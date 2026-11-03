import { Link } from 'react-router-dom';
import { adminUseCases } from '@/infrastructure/container.js';
import { formatMoney } from '@/domain/shared/money.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import { formatDate } from '@/presentation/utils/format.js';
import { PageHeader, StatCard, Panel, OrderStatusBadge } from '@/presentation/components/admin/AdminUi.jsx';

export default function AdminDashboard() {
    const { data, loading, error } = useAsync(() => adminUseCases.getDashboard(), []);

    if (loading) return <p className="text-taupe">Cargando resumen…</p>;
    if (error) return <p className="text-red-800">No se pudo cargar el resumen: {error.message}</p>;

    return (
        <>
            <PageHeader title="Resumen" subtitle="Así va tu tienda">
                <Link to="/admin/productos/nuevo" className="btn-dark">Nuevo producto</Link>
            </PageHeader>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard accent label="Ventas" value={formatMoney(data.revenue)} hint="Pedidos no cancelados" />
                <StatCard label="Pedidos" value={data.orderCount} hint={`${data.pendingCount} pendientes`} />
                <StatCard label="Ticket promedio" value={formatMoney(data.averageTicket)} />
                <StatCard label="Productos activos" value={data.productCount} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Panel title="Pedidos recientes" action={<Link to="/admin/pedidos" className="text-xs uppercase tracking-[0.15em] text-gold-dark hover:underline">Ver todos</Link>}>
                    {data.recentOrders.length === 0 ? (
                        <p className="text-sm text-taupe">Aún no hay pedidos.</p>
                    ) : (
                        <ul className="divide-y divide-taupe/15 text-sm">
                            {data.recentOrders.map((o) => (
                                <li key={o.code} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="font-medium">{o.code}</p>
                                        <p className="truncate text-xs text-taupe">{o.customer.fullName} · {formatDate(o.createdAt)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span>{formatMoney(o.total)}</span>
                                        <OrderStatusBadge status={o.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Stock bajo">
                    {data.lowStock.length === 0 ? (
                        <p className="text-sm text-taupe">Todo el inventario está en buen nivel.</p>
                    ) : (
                        <ul className="divide-y divide-taupe/15 text-sm">
                            {data.lowStock.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                                    <Link to={`/admin/productos/${p.id}`} className="hover:text-gold-dark">{p.brand} {p.name}</Link>
                                    <span className={p.stock === 0 ? 'font-semibold text-red-800' : 'text-gold-dark'}>
                                        {p.stock === 0 ? 'Agotado' : `${p.stock} und.`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Más vendidos">
                    {data.topProducts.length === 0 ? (
                        <p className="text-sm text-taupe">Aparecerán cuando entren pedidos.</p>
                    ) : (
                        <ol className="divide-y divide-taupe/15 text-sm">
                            {data.topProducts.map((p, i) => (
                                <li key={p.productId} className="flex items-center justify-between gap-3 py-3">
                                    <span><span className="mr-3 text-gold-dark">{i + 1}.</span>{p.name}</span>
                                    <span className="text-taupe">{p.units} und. · {formatMoney(p.revenue)}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>
            </div>
        </>
    );
}
