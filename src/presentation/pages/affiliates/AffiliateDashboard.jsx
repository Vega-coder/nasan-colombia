import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCases } from '@/infrastructure/container.js';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import { formatMoney } from '@/domain/shared/money.js';
import { toast } from '@/presentation/utils/swal.js';
import { FaCopy, FaCheck, FaCoins, FaLink, FaRotateRight, FaClock } from 'react-icons/fa6';

export default function AffiliateDashboard() {
    const { user, isAuthenticated } = useAuth();
    const [emailInput, setEmailInput] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [version, setVersion] = useState(0);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    const targetUser = (isAuthenticated && user?.email)
        ? user
        : (manualEmail ? { email: manualEmail } : null);

    const { data: portalData, loading } = useAsync(
        () => (targetUser ? useCases.getInfluencerPortalData(targetUser) : Promise.resolve(null)),
        [targetUser?.email, version]
    );

    const handleSearchByEmail = (e) => {
        e.preventDefault();
        if (!emailInput.trim()) return;
        setManualEmail(emailInput.trim().toLowerCase());
    };

    const handleRefresh = () => {
        setVersion((v) => v + 1);
    };

    const copyToClipboard = (text, isLink = false) => {
        navigator.clipboard.writeText(text);
        if (isLink) {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } else {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
        toast('Copiado al portapapeles', 'success');
    };

    const referralLink = portalData?.affiliate
        ? `${window.location.origin}/?ref=${portalData.affiliate.coupon_code}`
        : '';

    return (
        <div className="bg-cream-light min-h-screen py-12 text-ink">
            <div className="container-luxe max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-taupe/20 pb-6 gap-4">
                    <div>
                        <span className="eyebrow text-gold-dark">Panel de Creadores</span>
                        <h1 className="text-3xl sm:text-4xl font-display">Aroma Premium Partners</h1>
                        {portalData?.affiliate && (
                            <p className="text-sm text-taupe mt-1">
                                Hola, <span className="font-semibold text-ink">{portalData.affiliate.full_name}</span> ({portalData.affiliate.social_handle})
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Link to="/partners" className="btn-dark text-xs uppercase tracking-wider">
                            Información del programa
                        </Link>
                        {portalData && (
                            <button
                                type="button"
                                onClick={handleRefresh}
                                className="border border-taupe/30 bg-white p-2.5 text-xs text-taupe hover:text-ink hover:border-gold transition"
                                title="Actualizar datos"
                            >
                                <FaRotateRight className={loading ? 'animate-spin' : ''} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Si no ha iniciado sesión ni consultado por email */}
                {!portalData && !loading && (
                    <div className="mt-12 bg-white p-8 sm:p-12 shadow-sm ring-1 ring-taupe/15 text-center max-w-xl mx-auto">
                        <FaCoins className="mx-auto h-12 w-12 text-gold mb-4" />
                        <h2 className="text-2xl font-display">Ingresa a tu panel de influencer</h2>
                        <p className="text-sm text-taupe mt-2">
                            Ingresa con el correo electrónico con el que te registraste en el programa para consultar tus ventas y comisiones:
                        </p>

                        <form onSubmit={handleSearchByEmail} className="mt-6 flex flex-col sm:flex-row gap-2">
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="tu-correo@ejemplo.com"
                                className="flex-1 border border-taupe/30 p-2.5 text-sm focus:border-gold focus:outline-none"
                                required
                            />
                            <button type="submit" className="btn-dark px-6 py-2.5 text-xs uppercase tracking-wider">
                                Consultar
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-taupe/15 text-xs text-taupe">
                            ¿Aún no eres parte?{' '}
                            <Link to="/partners#registro" className="text-gold-dark font-semibold hover:underline">
                                Regístrate como partner aquí
                            </Link>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="py-24 text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent mx-auto" />
                        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-taupe">Cargando métricas...</p>
                    </div>
                )}

                {/* Tablero Principal del Influencer */}
                {portalData && !loading && (
                    <div className="mt-8 space-y-8">
                        {/* Estado del Partner */}
                        {portalData.affiliate.status === 'pending_approval' && (
                            <div className="rounded border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-3">
                                <FaClock className="h-5 w-5 text-amber-600 shrink-0" />
                                <div>
                                    <span className="font-bold">Solicitud en revisión:</span> Tu cuenta está siendo verificada por el administrador. Podrás comenzar a ganar comisiones en cuanto sea activada.
                                </div>
                            </div>
                        )}

                        {/* Herramientas de Difusión: Código y Enlace */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Tarjeta de Código */}
                            <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/15">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wider font-semibold text-taupe">Tu código exclusivo</span>
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                                        {portalData.stats.discountPct}% Desc. a tus seguidores
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between bg-cream/40 border border-taupe/20 p-3 rounded">
                                    <span className="font-display text-2xl font-bold tracking-wider text-ink">
                                        {portalData.affiliate.coupon_code}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(portalData.affiliate.coupon_code, false)}
                                        className="btn-dark px-3 py-1.5 text-[11px] uppercase tracking-wider flex items-center gap-1.5"
                                    >
                                        {copiedCode ? <FaCheck /> : <FaCopy />}
                                        <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                                    </button>
                                </div>
                                <p className="text-[11px] text-taupe mt-2">
                                    Compártelo en historias de Instagram o videos de TikTok.
                                </p>
                            </div>

                            {/* Tarjeta de Enlace con Atribución Automática */}
                            <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/15">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wider font-semibold text-taupe">Enlace personalizado</span>
                                    <span className="text-xs text-gold-dark font-semibold">Descuento automático</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between bg-cream/40 border border-taupe/20 p-3 rounded text-xs text-taupe truncate">
                                    <span className="truncate pr-2 font-mono">{referralLink}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(referralLink, true)}
                                        className="btn-dark px-3 py-1.5 text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1.5"
                                    >
                                        {copiedLink ? <FaCheck /> : <FaLink />}
                                        <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                                    </button>
                                </div>
                                <p className="text-[11px] text-taupe mt-2">
                                    Colócalo en tu biografía: el descuento se aplicará solo al hacer clic.
                                </p>
                            </div>
                        </div>

                        {/* Indicadores clave (KPIs) requeridos por Andrés */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/15">
                                <span className="text-xs uppercase tracking-wider text-taupe font-semibold">Comisión asignada</span>
                                <p className="font-display text-3xl font-bold text-gold-dark mt-2">{portalData.stats.commissionPct}%</p>
                                <span className="text-[11px] text-taupe mt-1 block capitalize">Nivel {portalData.stats.tier}</span>
                            </div>

                            <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/15">
                                <span className="text-xs uppercase tracking-wider text-taupe font-semibold">Ventas confirmadas</span>
                                <p className="font-display text-3xl font-bold text-ink mt-2">{portalData.stats.confirmedSalesCount}</p>
                                <span className="text-[11px] text-taupe mt-1 block">Total: {formatMoney(portalData.stats.totalSalesVolume)}</span>
                            </div>

                            <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/15">
                                <span className="text-xs uppercase tracking-wider text-taupe font-semibold">Comisiones acumuladas</span>
                                <p className="font-display text-3xl font-bold text-emerald-800 mt-2">
                                    {formatMoney(portalData.stats.accumulatedCommissions)}
                                </p>
                                <span className="text-[11px] text-taupe mt-1 block">Pagadas: {formatMoney(portalData.stats.paidCommissions)}</span>
                            </div>

                            <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/15 border-l-4 border-gold">
                                <span className="text-xs uppercase tracking-wider text-gold-dark font-bold">Saldo disponible</span>
                                <p className="font-display text-3xl font-bold text-ink mt-2">
                                    {formatMoney(portalData.stats.pendingBalance)}
                                </p>
                                <span className="text-[11px] text-taupe mt-1 block">Listo para próxima liquidación</span>
                            </div>
                        </div>

                        {/* Historial de Ventas / Referidos */}
                        <div className="bg-white p-6 sm:p-8 shadow-sm ring-1 ring-taupe/15">
                            <h2 className="text-xl font-display">Historial de ventas generadas</h2>
                            <p className="text-xs text-taupe mt-1">Transacciones realizadas con tu código o enlace directo.</p>

                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-taupe/20 bg-cream/40 text-taupe uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="p-3">Código Pedido</th>
                                            <th className="p-3">Fecha</th>
                                            <th className="p-3">Base neta</th>
                                            <th className="p-3">Descuento</th>
                                            <th className="p-3">Comisión ganada</th>
                                            <th className="p-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-taupe/10">
                                        {portalData.referrals.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-6 text-center text-taupe">
                                                    Aún no tienes ventas registradas. ¡Comparte tu código para comenzar!
                                                </td>
                                            </tr>
                                        ) : (
                                            portalData.referrals.map((ref) => (
                                                <tr key={ref.id} className="hover:bg-cream/20">
                                                    <td className="p-3 font-semibold font-mono">{ref.order_code}</td>
                                                    <td className="p-3 text-taupe">{new Date(ref.created_at).toLocaleDateString('es-CO')}</td>
                                                    <td className="p-3">{formatMoney(ref.subtotal_net)}</td>
                                                    <td className="p-3 text-emerald-700">-{formatMoney(ref.discount_applied)}</td>
                                                    <td className="p-3 font-bold text-ink">{formatMoney(ref.commission_amount)}</td>
                                                    <td className="p-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                                            ref.status === 'confirmed' || ref.status === 'paid'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : ref.status === 'pending'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {ref.status === 'confirmed' ? 'Confirmada' : ref.status === 'paid' ? 'Pagada' : ref.status === 'pending' ? 'Pendiente pago Wompi' : 'Cancelada'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Historial de Liquidaciones / Pagos Recibidos */}
                        {portalData.payouts.length > 0 && (
                            <div className="bg-white p-6 sm:p-8 shadow-sm ring-1 ring-taupe/15">
                                <h2 className="text-xl font-display">Comprobantes de pago</h2>
                                <p className="text-xs text-taupe mt-1">Transferencias bancarias realizadas a tu cuenta.</p>
                                <div className="mt-4 divide-y divide-taupe/15 text-xs">
                                    {portalData.payouts.map((pay) => (
                                        <div key={pay.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-ink">{formatMoney(pay.amount)}</p>
                                                <p className="text-[11px] text-taupe">
                                                    {new Date(pay.paid_at).toLocaleDateString('es-CO')} · Ref: {pay.reference || 'Transferencia directa'}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                Transferido
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
