import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { useCases } from '@/infrastructure/container.js';
import { formatMoney } from '@/domain/shared/money.js';
import { HiOutlineShoppingBag, HiOutlineArrowRightOnRectangle, HiOutlineShieldCheck } from 'react-icons/hi2';

const STATUS_LABELS = {
    pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Confirmado', cls: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Enviado', cls: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Entregado', cls: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Cancelado', cls: 'bg-rose-100 text-rose-800' },
};

export default function Account() {
    const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login?redirect=/cuenta', { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        let active = true;
        useCases.getUserOrders()
            .then((list) => {
                if (active) setOrders(list || []);
            })
            .catch(() => {
                if (active) setOrders([]);
            })
            .finally(() => {
                if (active) setLoadingOrders(false);
            });

        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    if (authLoading || !user) {
        return <div className="container-luxe min-h-[60vh] py-20 text-center">Cargando tu cuenta…</div>;
    }

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="container-luxe py-12">
            {/* Cabecera del perfil */}
            <div className="flex flex-col justify-between gap-6 border-b border-taupe/15 pb-8 sm:flex-row sm:items-center">
                <div>
                    <p className="eyebrow text-taupe">Mi cuenta</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl">
                        Hola, {user.fullName || user.email.split('@')[0]}
                    </h1>
                    <p className="mt-1 text-sm text-taupe">
                        {user.email} {user.phone && `· ${user.phone}`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {user.isAdmin && (
                        <Link to="/admin" className="btn-outline flex items-center gap-2 border-gold text-xs text-gold-dark hover:bg-gold hover:text-ink">
                            <HiOutlineShieldCheck className="h-4 w-4" />
                            Panel Administrador
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="btn-outline flex items-center gap-2 text-xs"
                    >
                        <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {/* Listado de pedidos */}
            <div className="mt-12">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl">Mis pedidos</h2>
                    <span className="text-xs text-taupe">{orders.length} pedidos registrados</span>
                </div>

                {loadingOrders ? (
                    <div className="py-12 text-center text-sm text-taupe">Cargando tus pedidos…</div>
                ) : orders.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center justify-center rounded border border-dashed border-taupe/30 py-16 text-center">
                        <HiOutlineShoppingBag className="h-12 w-12 text-taupe/50" />
                        <p className="mt-4 font-display text-xl">Aún no tienes pedidos registrados</p>
                        <p className="mt-1 text-xs text-taupe">Explora nuestro catálogo de perfumería árabe original.</p>
                        <Link to="/tienda" className="btn-dark mt-6 text-xs">
                            Ir a la tienda
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {orders.map((o) => {
                            const status = STATUS_LABELS[o.status] || { label: o.status, cls: 'bg-gray-100 text-gray-800' };
                            const dateStr = o.createdAt
                                ? new Date(o.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
                                : 'Reciente';

                            return (
                                <article
                                    key={o.id || o.code}
                                    className="flex flex-col justify-between gap-4 border border-taupe/15 bg-white p-5 transition hover:border-gold/60 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-semibold tracking-wide">
                                                Pedido #{o.code}
                                            </span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.cls}`}>
                                                {status.label}
                                            </span>
                                            {o.shippingGuideNumber && (
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                                    📦 {o.shippingCarrier}: {o.shippingGuideNumber}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-taupe">
                                            Fecha: {dateStr} · {o.items?.length || 0} producto(s)
                                        </p>
                                        <p className="mt-1 text-xs text-ink/80">
                                            {o.items?.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-wider text-taupe">Total</p>
                                            <p className="font-display text-lg font-semibold text-ink">
                                                {formatMoney(o.total)}
                                            </p>
                                        </div>
                                        <Link
                                            to={`/pedido/${o.code}`}
                                            className="btn-outline px-4 py-2 text-[10px]"
                                        >
                                            Ver detalle
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
