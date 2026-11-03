import { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
    FaWhatsapp, FaCircleCheck, FaClock, FaCircleXmark, FaRotate,
    FaTruckFast, FaArrowUpRightFromSquare, FaPrint,
} from 'react-icons/fa6';
import { useCases } from '@/infrastructure/container.js';
import { ORDER_STATUS_LABELS, PAYMENT_METHODS } from '@/domain/orders/order.js';
import { formatMoney } from '@/domain/shared/money.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import Monogram from '@/presentation/components/brand/Monogram.jsx';

export default function OrderConfirmation() {
    const { code } = useParams();
    const { state } = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

    const queryTxId = searchParams.get('id');

    const { data: fetched, loading } = useAsync(
        () => (state?.order ? Promise.resolve(state.order) : useCases.getOrder(code)),
        [code],
    );

    const [paymentUpdate, setPaymentUpdate] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Si viene de redirección de Wompi con ?id=... y el estado no está aún aprobado, verificar de forma asíncrona
    useEffect(() => {
        let active = true;
        const txId = queryTxId;
        if (!txId || !fetched || fetched.paymentMethod !== 'wompi' || fetched.paymentStatus === 'APPROVED') {
            return undefined;
        }

        useCases.getWompiTransactionStatus(txId)
            .then((data) => {
                if (!active || !data?.status) return;
                useCases.updateWompiPayment(fetched.code, txId, data.status).catch(() => {});
                setPaymentUpdate({
                    wompiTransactionId: txId,
                    paymentStatus: data.status,
                    status: data.status === 'APPROVED' ? 'confirmed' : fetched.status,
                });
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [queryTxId, fetched]);

    const order = fetched ? { ...fetched, ...paymentUpdate } : null;

    if (loading && !order) return <div className="py-40 text-center text-taupe">Cargando pedido…</div>;
    if (!order) {
        return (
            <div className="container-luxe py-32 text-center">
                <h1 className="text-4xl">Pedido no encontrado</h1>
                <Link to="/" className="btn-dark mt-8">Volver al inicio</Link>
            </div>
        );
    }

    const payment = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod);
    const isWompi = order.paymentMethod === 'wompi';
    const wompiStatus = order.paymentStatus || (order.wompiTransactionId ? 'PENDING' : null);

    const handleManualVerify = async () => {
        const txId = order.wompiTransactionId || queryTxId;
        if (!txId) return;
        setCheckingStatus(true);
        try {
            const data = await useCases.getWompiTransactionStatus(txId);
            if (data?.status) {
                await useCases.updateWompiPayment(order.code, txId, data.status);
                setPaymentUpdate({
                    wompiTransactionId: txId,
                    paymentStatus: data.status,
                    status: data.status === 'APPROVED' ? 'confirmed' : order.status,
                });
            }
        } catch (err) {
            console.warn('No se pudo verificar el estado con Wompi:', err);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleRetryWompi = async () => {
        setCheckingStatus(true);
        try {
            const res = await useCases.openWompiCheckout({
                order,
                customer: order.customer,
                redirectUrl: `${window.location.origin}/pedido/${order.code}`,
            });
            const txId = res?.transaction?.id;
            const status = res?.status || 'PENDING';
            if (txId) {
                await useCases.updateWompiPayment(order.code, txId, status);
                setPaymentUpdate({
                    wompiTransactionId: txId,
                    paymentStatus: status,
                    status: status === 'APPROVED' ? 'confirmed' : order.status,
                });
            }
        } catch (err) {
            console.error('Error al reintentar pago con Wompi:', err);
        } finally {
            setCheckingStatus(false);
        }
    };

    return (
        <div className="container-luxe max-w-3xl py-16">
            <div className="flex flex-col items-center text-center">
                <Monogram className="h-16 w-auto" />
                <p className="eyebrow mt-6 text-gold-dark">¡Gracias por tu compra!</p>
                <h1 className="mt-3 text-4xl sm:text-5xl">Pedido {order.code}</h1>
                <p className="mt-3 text-sm text-taupe">{ORDER_STATUS_LABELS[order.status]} · {payment?.label}</p>

                {/* Banner de estado específico de Wompi */}
                {isWompi && (
                    <div className="mt-6 w-full max-w-md rounded-xl border border-taupe/20 bg-cream/30 p-5 text-left">
                        <div className="flex items-center justify-between border-b border-taupe/15 pb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-taupe">Estado del pago online</span>
                            {wompiStatus === 'APPROVED' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                    <FaCircleCheck className="h-3.5 w-3.5" /> Pago Aprobado
                                </span>
                            )}
                            {wompiStatus === 'PENDING' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                    <FaClock className="h-3.5 w-3.5" /> En validación
                                </span>
                            )}
                            {(wompiStatus === 'DECLINED' || wompiStatus === 'ERROR') && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                                    <FaCircleXmark className="h-3.5 w-3.5" /> No aprobado
                                </span>
                            )}
                            {!wompiStatus && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-taupe/15 px-3 py-1 text-xs font-semibold text-taupe">
                                    Pendiente de pago
                                </span>
                            )}
                        </div>

                        <div className="mt-3 space-y-2 text-xs text-ink/80">
                            {order.wompiTransactionId && (
                                <p className="font-mono text-[11px] text-taupe">
                                    ID Transacción: <span className="font-semibold text-ink">{order.wompiTransactionId}</span>
                                </p>
                            )}

                            {wompiStatus === 'APPROVED' ? (
                                <p className="text-emerald-900">
                                    ✓ Tu pago fue recibido exitosamente a través de Wompi. Tu pedido ya está confirmado y se encuentra en cola de despacho.
                                </p>
                            ) : wompiStatus === 'PENDING' ? (
                                <div>
                                    <p className="text-amber-900">
                                        Wompi o tu banco están procesando la transacción. Si pagaste por PSE o Botón Bancolombia, puede tardar de 1 a 5 minutos en confirmarse.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleManualVerify}
                                        disabled={checkingStatus}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                                    >
                                        <FaRotate className={`h-3 w-3 ${checkingStatus ? 'animate-spin' : ''}`} />
                                        {checkingStatus ? 'Consultando a Wompi…' : 'Verificar estado ahora'}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-red-900">
                                        No recibimos la confirmación de tu pago. Puedes reintentar con otra tarjeta, PSE o Nequi.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleRetryWompi}
                                        disabled={checkingStatus}
                                        className="btn-dark mt-3 px-4 py-2 text-xs"
                                    >
                                        Reintentar pago con Wompi
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tarjeta de Trazabilidad y Guía de Transporte para el Cliente */}
                {order.shippingGuideNumber ? (
                    <div className="mt-6 w-full max-w-md rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 text-left shadow-sm">
                        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-950">
                                <FaTruckFast className="h-4 w-4 text-emerald-700" /> Envío Despachado
                            </span>
                            <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                                {order.shippingCarrier || 'Transportadora'}
                            </span>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-ink/80">
                            <div className="flex items-center justify-between">
                                <span className="text-taupe">Número de Guía:</span>
                                <span className="font-mono text-sm font-bold text-ink">{order.shippingGuideNumber}</span>
                            </div>
                            <p className="text-[11px] text-emerald-900 leading-relaxed">
                                ✓ Tu paquete ha sido radicado con la transportadora y se encuentra en ruta hacia <strong className="text-emerald-950">{order.customer?.city}</strong>.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <a
                                    href={order.shippingTrackingUrl || `https://coordinadora.com/rastreo/guia/${order.shippingGuideNumber}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-dark flex items-center gap-1.5 px-3 py-1.5 text-xs"
                                >
                                    <FaArrowUpRightFromSquare className="h-3 w-3" /> Rastrear mi paquete
                                </a>
                                <button
                                    type="button"
                                    onClick={() => useCases.printShippingLabel(order)}
                                    className="btn-outline flex items-center gap-1.5 bg-white px-3 py-1.5 text-xs"
                                >
                                    <FaPrint className="h-3 w-3" /> Ver comprobante de guía
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    wompiStatus === 'APPROVED' && (
                        <div className="mt-6 flex w-full max-w-md items-center gap-3 rounded-xl border border-taupe/20 bg-cream/30 p-4 text-left text-xs text-taupe">
                            <FaTruckFast className="h-5 w-5 text-ink shrink-0" />
                            <span>Tu pago fue recibido exitosamente. Estamos alistando tu fragancia para el despacho con la transportadora. En breve verás aquí tu guía.</span>
                        </div>
                    )
                )}

                {state?.confirmationUrl && (
                    <>
                        <p className="mt-8 max-w-md text-sm text-ink/80">
                            {isWompi && wompiStatus === 'APPROVED'
                                ? '¿Deseas una copia en WhatsApp o coordinar detalles de entrega directamente con nuestro equipo?'
                                : 'Envíanos el resumen por WhatsApp para confirmar disponibilidad y coordinar el pago y la entrega.'}
                        </p>
                        <a href={state.confirmationUrl} target="_blank" rel="noreferrer" className="btn-gold mt-6 py-4">
                            <FaWhatsapp className="h-4 w-4" /> Notificar por WhatsApp
                        </a>
                    </>
                )}
            </div>

            <div className="mt-14 bg-white p-6 ring-1 ring-taupe/10 sm:p-8">
                <ul className="divide-y divide-taupe/15 text-sm">
                    {order.items.map((i) => (
                        <li key={i.productId} className="flex justify-between gap-4 py-3">
                            <span>{i.quantity} × {i.brand} {i.name}</span>
                            <span>{formatMoney(i.lineTotal)}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 space-y-2 border-t border-taupe/15 pt-4 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
                    <div className="flex justify-between text-taupe"><span>Envío</span><span>{order.shipping ? formatMoney(order.shipping) : 'Gratis'}</span></div>
                    <div className="flex justify-between font-display text-2xl"><span>Total</span><span>{formatMoney(order.total)}</span></div>
                </div>
                <div className="mt-6 border-t border-taupe/15 pt-4 text-sm text-taupe">
                    <p className="text-ink">{order.customer.fullName}</p>
                    <p>{order.customer.address}, {order.customer.city}</p>
                    <p>{order.customer.phone} · {order.customer.email}</p>
                </div>
            </div>

            {!isAuthenticated && (
                <div className="mt-8 border border-gold/30 bg-gold/10 p-6 text-center">
                    <p className="font-display text-lg font-semibold text-ink">
                        ¿Quieres guardar tus direcciones y rastrear tus pedidos?
                    </p>
                    <p className="mt-1 text-xs text-taupe">
                        Crea una cuenta gratis con tu correo <strong className="text-ink">{order.customer.email}</strong> y accede a tu historial completo.
                    </p>
                    <Link
                        to={`/registro?redirect=/cuenta`}
                        className="btn-dark mt-4 inline-block px-6 py-3 text-xs"
                    >
                        Crear cuenta gratis
                    </Link>
                </div>
            )}

            <div className="mt-10 text-center">
                <Link to="/tienda" className="btn-outline">Seguir comprando</Link>
            </div>
        </div>
    );
}
