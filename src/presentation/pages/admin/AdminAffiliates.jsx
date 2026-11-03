import { useState } from 'react';
import { adminUseCases } from '@/infrastructure/container.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import { formatMoney } from '@/domain/shared/money.js';
import { AFFILIATE_TIERS } from '@/domain/affiliates/affiliate.js';
import { toast, alertError, alertSuccess } from '@/presentation/utils/swal.js';
import { PageHeader } from '@/presentation/components/admin/AdminUi.jsx';
import { FaCheck, FaMoneyBillTransfer, FaUserPlus, FaLink } from 'react-icons/fa6';

export default function AdminAffiliates() {
    const [version, setVersion] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedAffiliate, setSelectedAffiliate] = useState(null);
    const [payoutModal, setPayoutModal] = useState(null);
    const [payoutForm, setPayoutForm] = useState({ amount: '', reference: '', notes: '' });
    const [payoutSubmitting, setPayoutSubmitting] = useState(false);

    // Modal para crear nuevo influencer desde el panel admin
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        platform: 'instagram',
        socialHandle: '',
        couponCode: '',
        tier: 'principiante',
        commissionPct: 5,
        discountPct: 3,
        status: 'active',
        bankName: 'Bancolombia',
        bankAccountType: 'Ahorros',
        bankAccountNumber: '',
        notes: '',
    });
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const { data: affiliates, loading, error } = useAsync(() => adminUseCases.listAffiliates(), [version]);

    const filtered = (affiliates || []).filter((a) => {
        if (!statusFilter) return true;
        return a.status === statusFilter;
    });

    // Cálculos globales
    const totalVolume = (affiliates || []).reduce((acc, a) => acc + (a.stats?.totalSales || 0), 0);
    const totalCommissions = (affiliates || []).reduce((acc, a) => acc + (a.stats?.totalCommissions || 0), 0);
    const totalPendingPayout = (affiliates || []).reduce((acc, a) => acc + (a.stats?.pendingBalance || 0), 0);

    const handleTierChangeInCreate = (tierId) => {
        const tier = Object.values(AFFILIATE_TIERS).find((t) => t.id === tierId);
        setCreateForm((prev) => ({
            ...prev,
            tier: tierId,
            commissionPct: tier ? tier.defaultCommissionPct : prev.commissionPct,
            discountPct: tier ? tier.defaultDiscountPct : prev.discountPct,
        }));
    };

    const handleCreateAffiliate = async (e) => {
        e.preventDefault();
        setCreateSubmitting(true);
        try {
            await adminUseCases.createAffiliate({
                ...createForm,
                couponCode: createForm.couponCode.toUpperCase().trim(),
                commissionPct: Number(createForm.commissionPct),
                discountPct: Number(createForm.discountPct),
            });
            alertSuccess('Influencer Creado', `El código ${createForm.couponCode.toUpperCase()} ya está activo.`);
            setCreateModalOpen(false);
            setCreateForm({
                fullName: '',
                email: '',
                phone: '',
                platform: 'instagram',
                socialHandle: '',
                couponCode: '',
                tier: 'principiante',
                commissionPct: 5,
                discountPct: 3,
                status: 'active',
                bankName: 'Bancolombia',
                bankAccountType: 'Ahorros',
                bankAccountNumber: '',
                notes: '',
            });
            setVersion((v) => v + 1);
        } catch (err) {
            alertError('Error al crear afiliado', err.message);
        } finally {
            setCreateSubmitting(false);
        }
    };

    const handleUpdateStatus = async (affiliateId, newStatus) => {
        try {
            await adminUseCases.updateAffiliateStatus(affiliateId, { status: newStatus });
            toast(`Afiliado actualizado a: ${newStatus}`);
            setVersion((v) => v + 1);
        } catch (err) {
            alertError('Error al actualizar', err.message);
        }
    };

    const handleSaveTerms = async (e) => {
        e.preventDefault();
        if (!selectedAffiliate) return;
        try {
            await adminUseCases.updateAffiliateStatus(selectedAffiliate.id, {
                status: selectedAffiliate.status,
                commissionPct: Number(selectedAffiliate.commission_pct),
                discountPct: Number(selectedAffiliate.discount_pct),
                tier: selectedAffiliate.tier,
                notes: selectedAffiliate.notes,
            });
            alertSuccess('Términos actualizados', 'Los porcentajes de comisión y descuento fueron guardados.');
            setSelectedAffiliate(null);
            setVersion((v) => v + 1);
        } catch (err) {
            alertError('Error', err.message);
        }
    };

    const handleRecordPayout = async (e) => {
        e.preventDefault();
        if (!payoutModal || !payoutForm.amount) return;
        setPayoutSubmitting(true);
        try {
            await adminUseCases.recordAffiliatePayout({
                affiliateId: payoutModal.id,
                amount: Number(payoutForm.amount),
                reference: payoutForm.reference,
                notes: payoutForm.notes,
            });
            alertSuccess('Pago registrado', `Se registró la transferencia por ${formatMoney(payoutForm.amount)}`);
            setPayoutModal(null);
            setPayoutForm({ amount: '', reference: '', notes: '' });
            setVersion((v) => v + 1);
        } catch (err) {
            alertError('Error al registrar pago', err.message);
        } finally {
            setPayoutSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Programa de Afiliados (Partners)"
                    subtitle="Gestión de creadores, asignación de códigos, porcentajes y control de comisiones."
                />
                <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="btn-dark px-4 py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto shadow-sm"
                >
                    <FaUserPlus /> Añadir Influencer
                </button>
            </div>

            {/* KPIs Generales del Programa */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-5 shadow-sm ring-1 ring-taupe/15">
                    <span className="text-xs uppercase tracking-wider text-taupe font-semibold">Total Partners</span>
                    <p className="font-display text-3xl font-bold text-ink mt-2">{affiliates ? affiliates.length : '—'}</p>
                    <span className="text-[11px] text-taupe mt-1 block">
                        {(affiliates || []).filter((a) => a.status === 'pending_approval').length} pendientes de aprobación
                    </span>
                </div>

                <div className="bg-white p-5 shadow-sm ring-1 ring-taupe/15">
                    <span className="text-xs uppercase tracking-wider text-taupe font-semibold">Ventas por Afiliados</span>
                    <p className="font-display text-3xl font-bold text-ink mt-2">{formatMoney(totalVolume)}</p>
                    <span className="text-[11px] text-taupe mt-1 block">Ventas netas confirmadas</span>
                </div>

                <div className="bg-white p-5 shadow-sm ring-1 ring-taupe/15">
                    <span className="text-xs uppercase tracking-wider text-taupe font-semibold">Comisiones Totales</span>
                    <p className="font-display text-3xl font-bold text-emerald-800 mt-2">{formatMoney(totalCommissions)}</p>
                    <span className="text-[11px] text-taupe mt-1 block">Generadas por creadores</span>
                </div>

                <div className="bg-white p-5 shadow-sm ring-1 ring-taupe/15 border-l-4 border-gold">
                    <span className="text-xs uppercase tracking-wider text-gold-dark font-bold">Por Liquidar</span>
                    <p className="font-display text-3xl font-bold text-ink mt-2">{formatMoney(totalPendingPayout)}</p>
                    <span className="text-[11px] text-taupe mt-1 block">Saldo pendiente de pago</span>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: '', label: 'Todos' },
                        { id: 'pending_approval', label: 'Pendientes de aprobación' },
                        { id: 'active', label: 'Activos' },
                        { id: 'suspended', label: 'Suspendidos' },
                    ].map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setStatusFilter(f.id)}
                            className={`px-3 py-1.5 text-xs transition ${
                                statusFilter === f.id
                                    ? 'bg-ink text-cream-light font-semibold'
                                    : 'bg-white text-ink/70 ring-1 ring-taupe/20 hover:ring-ink'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <a
                    href="/partners"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gold-dark hover:underline flex items-center gap-1 font-medium"
                >
                    <FaLink className="text-[10px]" /> Ver formulario público de registro (/partners)
                </a>
            </div>

            {loading && <p className="text-taupe text-sm">Cargando afiliados…</p>}
            {error && <p className="text-red-800 text-sm">Error: {error.message}</p>}

            {!loading && !error && filtered.length === 0 && (
                <div className="bg-white p-12 text-center shadow-sm ring-1 ring-taupe/10 space-y-3">
                    <p className="font-display text-lg text-ink">No hay afiliados en esta pestaña</p>
                    <p className="text-xs text-taupe max-w-md mx-auto">
                        {statusFilter === 'suspended'
                            ? 'No tienes ningún afiliado suspendido.'
                            : statusFilter === 'pending_approval'
                            ? 'No hay solicitudes pendientes. Los creadores que se registren en la página aparecerán aquí.'
                            : 'Aún no tienes creadores registrados. Puedes añadir uno manualmente con el botón «Añadir Influencer» o compartir el enlace de registro.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="btn-dark px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-2 mt-2"
                    >
                        <FaUserPlus /> Añadir mi primer Influencer
                    </button>
                </div>
            )}

            {/* Listado de Afiliados */}
            <div className="space-y-4">
                {filtered.map((aff) => (
                    <div key={aff.id} className="bg-white p-5 shadow-sm ring-1 ring-taupe/15 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-display text-lg text-ink font-semibold">{aff.full_name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                    aff.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : aff.status === 'pending_approval'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {aff.status === 'active' ? 'Activo' : aff.status === 'pending_approval' ? 'Pendiente' : 'Suspendido'}
                                </span>
                                <span className="bg-gold/15 text-gold-dark text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded capitalize">
                                    Nivel: {aff.tier}
                                </span>
                            </div>

                            <p className="text-xs text-taupe mt-1">
                                {aff.social_handle} ({aff.platform}) · {aff.email} · Tel: {aff.phone}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-4 text-xs">
                                <div>
                                    <span className="text-taupe">Código: </span>
                                    <span className="font-bold font-mono text-ink bg-cream/60 px-1.5 py-0.5 border border-taupe/20">{aff.coupon_code}</span>
                                </div>
                                <div>
                                    <span className="text-taupe">Comisión: </span>
                                    <span className="font-bold text-ink">{aff.commission_pct}%</span>
                                </div>
                                <div>
                                    <span className="text-taupe">Descuento seguidor: </span>
                                    <span className="font-bold text-emerald-700">{aff.discount_pct}%</span>
                                </div>
                                <div>
                                    <span className="text-taupe">Ventas: </span>
                                    <span className="font-bold text-ink">{aff.stats?.confirmedSalesCount || 0}</span> ({formatMoney(aff.stats?.totalSales || 0)})
                                </div>
                                <div>
                                    <span className="text-taupe">Saldo pendiente: </span>
                                    <span className="font-bold text-gold-dark">{formatMoney(aff.stats?.pendingBalance || 0)}</span>
                                </div>
                            </div>

                            {aff.bank_name && (
                                <p className="text-[11px] text-taupe mt-2">
                                    Banco: {aff.bank_name} ({aff.bank_account_type}) · Cuenta: {aff.bank_account_number}
                                </p>
                            )}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex flex-wrap items-center gap-2">
                            {aff.status === 'pending_approval' && (
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(aff.id, 'active')}
                                    className="btn-dark px-3 py-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                                >
                                    <FaCheck /> Aprobar
                                </button>
                            )}

                            {aff.status === 'active' && (
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(aff.id, 'suspended')}
                                    className="border border-red-300 text-red-700 hover:bg-red-50 px-3 py-1.5 text-xs uppercase tracking-wider"
                                >
                                    Suspender
                                </button>
                            )}

                            {aff.status === 'suspended' && (
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(aff.id, 'active')}
                                    className="border border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 text-xs uppercase tracking-wider"
                                >
                                    Reactivar
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setSelectedAffiliate(aff)}
                                className="border border-taupe/30 bg-white hover:border-ink px-3 py-1.5 text-xs uppercase tracking-wider"
                            >
                                Editar términos
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setPayoutModal(aff);
                                    setPayoutForm({
                                        amount: aff.stats?.pendingBalance > 0 ? String(aff.stats.pendingBalance) : '',
                                        reference: '',
                                        notes: '',
                                    });
                                }}
                                className="btn-dark px-3 py-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5"
                            >
                                <FaMoneyBillTransfer /> Registrar pago
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal para CREAR NUEVO INFLUENCER desde el Admin */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 overflow-y-auto">
                    <div className="bg-white p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8">
                        <h3 className="font-display text-xl">Añadir Nuevo Influencer</h3>
                        <p className="text-xs text-taupe mt-1">
                            Crea la cuenta del partner directamente sin que tenga que llenar el formulario público.
                        </p>

                        <form onSubmit={handleCreateAffiliate} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Nombre completo *</label>
                                <input
                                    type="text"
                                    value={createForm.fullName}
                                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    placeholder="Laura Martínez"
                                    className="w-full mt-1 border border-taupe/30 p-2 text-sm focus:border-gold focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Correo *</label>
                                    <input
                                        type="email"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        placeholder="laura@ejemplo.com"
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm focus:border-gold focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">WhatsApp / Celular *</label>
                                    <input
                                        type="tel"
                                        value={createForm.phone}
                                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                        placeholder="3001234567"
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm focus:border-gold focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Red social</label>
                                    <select
                                        value={createForm.platform}
                                        onChange={(e) => setCreateForm({ ...createForm, platform: e.target.value })}
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm bg-white"
                                    >
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="other">Otra</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Usuario (@...)</label>
                                    <input
                                        type="text"
                                        value={createForm.socialHandle}
                                        onChange={(e) => setCreateForm({ ...createForm, socialHandle: e.target.value })}
                                        placeholder="@laurastyle"
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm focus:border-gold focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Código exclusivo *</label>
                                    <input
                                        type="text"
                                        value={createForm.couponCode}
                                        onChange={(e) => setCreateForm({ ...createForm, couponCode: e.target.value.toUpperCase() })}
                                        placeholder="LAURA10"
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm uppercase tracking-wider font-mono font-bold focus:border-gold focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Nivel inicial</label>
                                    <select
                                        value={createForm.tier}
                                        onChange={(e) => handleTierChangeInCreate(e.target.value)}
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm bg-white"
                                    >
                                        <option value="principiante">Principiante (5% / 3%)</option>
                                        <option value="intermedio">Intermedio (7% / 5%)</option>
                                        <option value="alto_rendimiento">Alto Rendimiento (10% / 5%)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">% Comisión</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="50"
                                        value={createForm.commissionPct}
                                        onChange={(e) => setCreateForm({ ...createForm, commissionPct: e.target.value })}
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">% Descuento seguidor</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="50"
                                        value={createForm.discountPct}
                                        onChange={(e) => setCreateForm({ ...createForm, discountPct: e.target.value })}
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-taupe/15">
                                <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-2">Datos bancarios para liquidación (opcional)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={createForm.bankName}
                                        onChange={(e) => setCreateForm({ ...createForm, bankName: e.target.value })}
                                        placeholder="Banco o Nequi"
                                        className="border border-taupe/30 p-2 text-xs"
                                    />
                                    <input
                                        type="text"
                                        value={createForm.bankAccountNumber}
                                        onChange={(e) => setCreateForm({ ...createForm, bankAccountNumber: e.target.value })}
                                        placeholder="Número de cuenta o celular"
                                        className="border border-taupe/30 p-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="border border-taupe/30 px-4 py-2 text-xs uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createSubmitting}
                                    className="btn-dark px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-50"
                                >
                                    {createSubmitting ? 'Guardando...' : 'Crear y Activar Partner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Editar Términos del Afiliado */}
            {selectedAffiliate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
                    <div className="bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl">
                        <h3 className="font-display text-xl">Configurar Influencer: {selectedAffiliate.full_name}</h3>
                        <p className="text-xs text-taupe mt-1">Modifica comisiones, descuentos y nivel.</p>

                        <form onSubmit={handleSaveTerms} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Nivel</label>
                                <select
                                    value={selectedAffiliate.tier}
                                    onChange={(e) => setSelectedAffiliate({ ...selectedAffiliate, tier: e.target.value })}
                                    className="w-full mt-1 border border-taupe/30 p-2 text-sm bg-white"
                                >
                                    <option value="principiante">Principiante (Sugerido: 5% com / 3% desc)</option>
                                    <option value="intermedio">Intermedio (Sugerido: 7% com / 5% desc)</option>
                                    <option value="alto_rendimiento">Alto Rendimiento (Sugerido: 10% com / 5% desc)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">% Comisión</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="50"
                                        value={selectedAffiliate.commission_pct}
                                        onChange={(e) => setSelectedAffiliate({ ...selectedAffiliate, commission_pct: e.target.value })}
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">% Descuento</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="50"
                                        value={selectedAffiliate.discount_pct}
                                        onChange={(e) => setSelectedAffiliate({ ...selectedAffiliate, discount_pct: e.target.value })}
                                        className="w-full mt-1 border border-taupe/30 p-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Notas internas</label>
                                <textarea
                                    value={selectedAffiliate.notes || ''}
                                    onChange={(e) => setSelectedAffiliate({ ...selectedAffiliate, notes: e.target.value })}
                                    rows="2"
                                    className="w-full mt-1 border border-taupe/30 p-2 text-xs"
                                    placeholder="Acuerdos especiales, campañas específicas..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAffiliate(null)}
                                    className="border border-taupe/30 px-4 py-2 text-xs uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-dark px-4 py-2 text-xs uppercase tracking-wider">
                                    Guardar cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Registrar Pago por Transferencia */}
            {payoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
                    <div className="bg-white p-6 sm:p-8 max-w-md w-full shadow-2xl">
                        <h3 className="font-display text-xl">Registrar Pago a {payoutModal.full_name}</h3>
                        <p className="text-xs text-taupe mt-1">
                            Saldo pendiente acumulado: <span className="font-bold text-ink">{formatMoney(payoutModal.stats?.pendingBalance || 0)}</span>
                        </p>

                        {payoutModal.bank_name && (
                            <div className="mt-3 bg-cream/40 border border-taupe/20 p-2.5 rounded text-xs text-taupe">
                                <p className="font-semibold text-ink">Cuenta para transferir:</p>
                                <p>{payoutModal.bank_name} - {payoutModal.bank_account_type}</p>
                                <p className="font-mono">{payoutModal.bank_account_number}</p>
                            </div>
                        )}

                        <form onSubmit={handleRecordPayout} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Monto transferido (COP) *</label>
                                <input
                                    type="number"
                                    value={payoutForm.amount}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                    className="w-full mt-1 border border-taupe/30 p-2 text-sm"
                                    placeholder="Ej: 78000"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Referencia bancaria / N.º de comprobante</label>
                                <input
                                    type="text"
                                    value={payoutForm.reference}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, reference: e.target.value })}
                                    className="w-full mt-1 border border-taupe/30 p-2 text-sm"
                                    placeholder="Ej: TRANSF-982173 / Nequi M1234"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-taupe font-semibold">Notas de liquidación</label>
                                <textarea
                                    value={payoutForm.notes}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                                    rows="2"
                                    className="w-full mt-1 border border-taupe/30 p-2 text-xs"
                                    placeholder="Liquidación comisiones mes de..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setPayoutModal(null)}
                                    className="border border-taupe/30 px-4 py-2 text-xs uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={payoutSubmitting}
                                    className="btn-dark px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-50"
                                >
                                    {payoutSubmitting ? 'Guardando...' : 'Confirmar pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
