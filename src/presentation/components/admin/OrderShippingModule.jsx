import { useState, useEffect } from 'react';
import {
    FaTruckFast, FaPrint, FaCopy, FaCheck, FaArrowUpRightFromSquare,
    FaTriangleExclamation, FaBoxArchive, FaRotate, FaTag,
} from 'react-icons/fa6';
import { adminUseCases } from '@/infrastructure/container.js';
import { formatMoney } from '@/domain/shared/money.js';
import { toast, alertError } from '@/presentation/utils/swal.js';
import { getCarrierById, SHIPPING_STATUS_LABELS } from '@/domain/orders/shipping.js';

export default function OrderShippingModule({ order, onUpdated }) {
    const carriers = adminUseCases.getAvailableCarriers();
    const [carrierId, setCarrierId] = useState(order.shippingCarrier ? (getCarrierById(order.shippingCarrier)?.id || 'coordinadora') : 'coordinadora');
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState(order.shippingError || null);
    const [quotes, setQuotes] = useState([]);
    const [loadingQuotes, setLoadingQuotes] = useState(false);

    const hasGuide = Boolean(order.shippingGuideNumber);
    const specs = adminUseCases.calculatePackageSpecs(order);
    const activeCarrier = getCarrierById(order.shippingCarrier || carrierId);

    // Cargar tarifas reales de flete para la ruta (Ocaña -> Ciudad Destino)
    useEffect(() => {
        let isMounted = true;
        if (!hasGuide && order.customer?.city) {
            setLoadingQuotes(true);
            adminUseCases.quoteShippingRates(order)
                .then((res) => {
                    if (isMounted && Array.isArray(res) && res.length > 0) {
                        setQuotes(res);
                        // Si la transportadora seleccionada actualmente no está entre las cotizadas, preseleccionar la primera disponible
                        if (!res.some((r) => r.carrierId === carrierId)) {
                            setCarrierId(res[0].carrierId);
                        }
                    }
                })
                .catch(() => {})
                .finally(() => {
                    if (isMounted) setLoadingQuotes(false);
                });
        }
        return () => {
            isMounted = false;
        };
    }, [order.code, hasGuide]);

    const handleGenerate = async () => {
        if (hasGuide) {
            toast('Este pedido ya cuenta con una guía generada.');
            return;
        }

        setGenerating(true);
        setErrorMsg(null);
        try {
            await adminUseCases.generateShippingGuide({
                orderCode: order.code,
                carrierId,
            });
            toast(`Guía generada con ${activeCarrier.name}`);
            onUpdated?.();
        } catch (err) {
            setErrorMsg(err.message);
            alertError('No se pudo generar la guía', err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!order.shippingGuideNumber) return;
        navigator.clipboard?.writeText(order.shippingGuideNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast('Número de guía copiado al portapapeles');
    };

    const handlePrint = () => {
        adminUseCases.printShippingLabel(order);
    };

    const handleOpenTracking = () => {
        const url = order.shippingTrackingUrl || activeCarrier.trackingUrl(order.shippingGuideNumber);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="rounded-lg border border-taupe/20 bg-cream/40 p-4">
            <div className="flex items-center justify-between border-b border-taupe/15 pb-2.5">
                <div className="flex items-center gap-2">
                    <FaTruckFast className="h-4 w-4 text-ink" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                        Módulo de Despachos & Guía de Envío
                    </span>
                </div>
                {hasGuide && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        {SHIPPING_STATUS_LABELS[order.shippingStatus] || 'Guía Generada'}
                    </span>
                )}
            </div>

            {/* Error previo o de la transportadora */}
            {errorMsg && (
                <div className="mt-3 flex items-start gap-2 rounded bg-red-50 p-2.5 text-xs text-red-800 border border-red-200">
                    <FaTriangleExclamation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                    <div>
                        <p className="font-semibold">Rechazo de transportadora / Error:</p>
                        <p>{errorMsg}</p>
                    </div>
                </div>
            )}

            {hasGuide ? (
                /* ESTADO: GUÍA GENERADA */
                <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded bg-white p-3 ring-1 ring-taupe/15">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-taupe block">Transportadora asignada</span>
                            <span className="text-sm font-semibold text-ink">{order.shippingCarrier}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-taupe block">Número de Guía</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-ink">{order.shippingGuideNumber}</span>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    title="Copiar guía"
                                    className="rounded p-1 text-taupe hover:bg-cream hover:text-ink transition"
                                >
                                    {copied ? <FaCheck className="h-3.5 w-3.5 text-emerald-600" /> : <FaCopy className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-taupe">
                        <div className="bg-white p-2 rounded ring-1 ring-taupe/10">
                            <span className="block font-medium text-ink">Peso</span>
                            {specs.weightKg} kg
                        </div>
                        <div className="bg-white p-2 rounded ring-1 ring-taupe/10">
                            <span className="block font-medium text-ink">Dimensiones</span>
                            {specs.lengthCm}x{specs.widthCm}x{specs.heightCm} cm
                        </div>
                        <div className="bg-white p-2 rounded ring-1 ring-taupe/10">
                            <span className="block font-medium text-ink">Declarado</span>
                            {formatMoney(specs.declaredValue)}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="btn-dark flex items-center gap-2 px-3 py-1.5 text-xs"
                        >
                            <FaPrint className="h-3.5 w-3.5" /> Imprimir Guía (PDF)
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenTracking}
                            className="btn-outline flex items-center gap-2 px-3 py-1.5 text-xs bg-white"
                        >
                            <FaArrowUpRightFromSquare className="h-3 w-3" /> Rastrear en Transportadora
                        </button>
                    </div>
                </div>
            ) : (
                /* ESTADO: PENDIENTE DE GENERAR GUÍA */
                <div className="mt-3 space-y-3">
                    <p className="text-xs text-taupe">
                        Genera automáticamente la guía de transporte con los datos de entrega de este pedido:
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-taupe mb-1">
                                Transportadora seleccionada
                            </label>
                            <select
                                value={carrierId}
                                onChange={(e) => setCarrierId(e.target.value)}
                                className="w-full rounded border border-taupe/30 bg-white px-2.5 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
                            >
                                {carriers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase text-taupe mb-1">
                                Destino
                            </span>
                            <span className="block truncate text-xs font-medium text-ink bg-white/70 px-2 py-1.5 rounded border border-taupe/20">
                                {order.customer?.city} · {order.customer?.address}
                            </span>
                        </div>
                    </div>

                    {/* Tarifas en vivo cotizadas desde Ocaña */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-taupe flex items-center gap-1">
                                <FaTag className="h-3 w-3" /> Costo del Domicilio (Ocaña → {order.customer?.city})
                            </span>
                            {loadingQuotes && (
                                <span className="text-[10px] text-taupe flex items-center gap-1">
                                    <FaRotate className="h-2.5 w-2.5 animate-spin" /> Consultando tarifas en vivo…
                                </span>
                            )}
                        </div>

                        {quotes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {quotes.map((q) => {
                                    const isSelected = carrierId === q.carrierId;
                                    return (
                                        <button
                                            key={q.carrierId + q.carrierName}
                                            type="button"
                                            onClick={() => setCarrierId(q.carrierId)}
                                            className={`rounded-lg border p-2.5 text-left transition ${
                                                isSelected
                                                    ? 'border-ink bg-ink text-cream-light shadow-sm'
                                                    : 'border-taupe/20 bg-white text-ink hover:border-gold/80'
                                            }`}
                                        >
                                            <span className="block text-[10px] font-bold uppercase truncate">{q.carrierName}</span>
                                            <span className="block text-sm font-bold mt-0.5">{formatMoney(q.cost)}</span>
                                            <span className={`block text-[9px] mt-0.5 ${isSelected ? 'text-cream-light/70' : 'text-taupe'}`}>
                                                Entrega en ~{q.deliveryDays} día(s)
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : !loadingQuotes && (
                            <p className="text-[11px] text-taupe italic">
                                Cotizando tarifas disponibles para esta ruta.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-taupe bg-white/80 p-2 rounded border border-taupe/15">
                        <span>
                            <strong className="text-ink">{specs.weightKg} kg</strong> ({specs.lengthCm}x{specs.widthCm}x{specs.heightCm} cm)
                        </span>
                        <span>
                            Valor asegurado: <strong className="text-ink">{formatMoney(specs.declaredValue)}</strong>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="btn-dark flex w-full items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                    >
                        {generating ? (
                            <>
                                <FaRotate className="h-3.5 w-3.5 animate-spin" /> Conectando con {activeCarrier.name}…
                            </>
                        ) : (
                            <>
                                <FaTruckFast className="h-3.5 w-3.5" />
                                Generar Guía con {activeCarrier.name}
                                {quotes.find((q) => q.carrierId === carrierId) && (
                                    <span>({formatMoney(quotes.find((q) => q.carrierId === carrierId).cost)})</span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
