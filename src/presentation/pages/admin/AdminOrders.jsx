import { useState } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import { FaWhatsapp, FaTruckFast } from 'react-icons/fa6';
import { adminUseCases } from '@/infrastructure/container.js';
import { ORDER_STATUS_LABELS, PAYMENT_METHODS, getNextStatuses } from '@/domain/orders/order.js';
import { formatMoney } from '@/domain/shared/money.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import { formatDate } from '@/presentation/utils/format.js';
import { toast, alertError } from '@/presentation/utils/swal.js';
import { PageHeader, OrderStatusBadge } from '@/presentation/components/admin/AdminUi.jsx';
import OrderShippingModule from '@/presentation/components/admin/OrderShippingModule.jsx';

const FILTERS = [{ id: '', label: 'Todos' }, ...Object.entries(ORDER_STATUS_LABELS).map(([id, label]) => ({ id, label }))];

const ACTION_LABELS = {
    confirmed: 'Confirmar',
    shipped: 'Marcar enviado',
    delivered: 'Marcar entregado',
    cancelled: 'Cancelar',
};

export default function AdminOrders() {
    const [status, setStatus] = useState('');
    const [version, setVersion] = useState(0);
    const [expanded, setExpanded] = useState(null);
    const { data: orders, loading, error } = useAsync(() => adminUseCases.listOrders({ status: status || undefined }), [status, version]);

    const changeStatus = async (order, next) => {
        try {
            await adminUseCases.changeOrderStatus(order.code, next);
            toast(`Pedido ${order.code}: ${ORDER_STATUS_LABELS[next]}`);
            setVersion((v) => v + 1);
        } catch (err) {
            alertError('No se pudo cambiar el estado', err.message);
        }
    };

    return (
        <>
            <PageHeader title="Pedidos" subtitle={orders ? `${orders.length} ${status ? ORDER_STATUS_LABELS[status].toLowerCase() : 'en total'}` : ''} />

            <div className="mb-6 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setStatus(f.id)}
                        className={`px-3 py-1.5 text-xs transition ${status === f.id ? 'bg-ink text-cream-light' : 'bg-white text-ink/70 ring-1 ring-taupe/20 hover:ring-ink'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading && <p className="text-taupe">Cargando pedidos…</p>}
            {error && <p className="text-red-800">No se pudieron cargar los pedidos: {error.message}</p>}
            {!loading && !error && orders.length === 0 && (
                <p className="bg-white p-8 text-center text-sm text-taupe ring-1 ring-taupe/10">No hay pedidos {status && 'con este estado'}.</p>
            )}

            <ul className="space-y-3">
                {(orders ?? []).map((o) => {
                    const open = expanded === o.code;
                    return (
                        <li key={o.code} className="bg-white ring-1 ring-taupe/10">
                            <button
                                onClick={() => setExpanded(open ? null : o.code)}
                                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 text-left sm:grid-cols-[190px_1fr_auto_auto_20px]"
                                aria-expanded={open}
                            >
                                <span className="flex flex-col gap-0.5">
                                    <span className="font-medium">{o.code}</span>
                                    {o.shippingGuideNumber && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800">
                                            <FaTruckFast className="h-3 w-3" />
                                            {o.shippingCarrier}: {o.shippingGuideNumber}
                                        </span>
                                    )}
                                </span>
                                <span className="hidden min-w-0 truncate text-sm text-taupe sm:block">{o.customer.fullName} · {o.customer.city}</span>
                                <span className="hidden text-xs text-taupe sm:block">{formatDate(o.createdAt)}</span>
                                <span className="flex items-center gap-3 justify-self-end">
                                    <span className="font-semibold">{formatMoney(o.total)}</span>
                                    <OrderStatusBadge status={o.status} />
                                </span>
                                <HiChevronDown className={`hidden h-4 w-4 transition sm:block ${open ? 'rotate-180' : ''}`} />
                            </button>

                            {open && (
                                <div className="space-y-6 border-t border-taupe/15 px-5 py-5">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <p className="eyebrow text-[10px] text-taupe">Productos</p>
                                            <ul className="mt-3 space-y-2 text-sm">
                                                {o.items.map((i) => (
                                                    <li key={i.productId} className="flex justify-between gap-4">
                                                        <span>{i.quantity} × {i.brand} {i.name}</span>
                                                        <span>{formatMoney(i.lineTotal)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-3 space-y-1 border-t border-taupe/15 pt-3 text-sm">
                                                <div className="flex justify-between text-taupe"><span>Envío</span><span>{o.shipping ? formatMoney(o.shipping) : 'Gratis'}</span></div>
                                                <div className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(o.total)}</span></div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <p className="eyebrow text-[10px] text-taupe">Cliente</p>
                                                <p className="mt-2 font-medium">{o.customer.fullName}</p>
                                                <p className="text-taupe">{o.customer.phone} · {o.customer.email}</p>
                                                <p className="text-taupe">{o.customer.address}, {o.customer.city}</p>
                                                {o.customer.notes && <p className="mt-2 italic text-ink/70">“{o.customer.notes}”</p>}
                                            </div>
                                            <p><span className="text-taupe">Pago:</span> {PAYMENT_METHODS.find((m) => m.id === o.paymentMethod)?.label ?? o.paymentMethod}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {getNextStatuses(o.status).map((next) => (
                                                    <button
                                                        key={next}
                                                        onClick={() => changeStatus(o, next)}
                                                        className={next === 'cancelled' ? 'btn-outline px-4 py-2' : 'btn-dark px-4 py-2'}
                                                    >
                                                        {ACTION_LABELS[next]}
                                                    </button>
                                                ))}
                                                <a href={adminUseCases.customerMessageUrl(o)} target="_blank" rel="noreferrer" className="btn-gold px-4 py-2">
                                                    <FaWhatsapp className="h-4 w-4" /> Escribir al cliente
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Módulo de Despachos y Guía */}
                                    <OrderShippingModule order={o} onUpdated={() => setVersion((v) => v + 1)} />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
