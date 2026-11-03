// Piezas visuales compartidas del panel de administración.
import { ORDER_STATUS_LABELS } from '@/domain/orders/order.js';

export function PageHeader({ title, subtitle, children }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl sm:text-4xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-taupe">{subtitle}</p>}
            </div>
            {children && <div className="flex flex-wrap gap-3">{children}</div>}
        </div>
    );
}

export function StatCard({ label, value, hint, accent = false }) {
    return (
        <div className={`p-5 ring-1 ${accent ? 'bg-ink text-cream-light ring-ink' : 'bg-white ring-taupe/10'}`}>
            <p className={`eyebrow text-[10px] ${accent ? 'text-gold' : 'text-taupe'}`}>{label}</p>
            <p className="mt-3 font-display text-3xl">{value}</p>
            {hint && <p className={`mt-1 text-xs ${accent ? 'text-cream/60' : 'text-taupe'}`}>{hint}</p>}
        </div>
    );
}

const STATUS_STYLES = {
    pending: 'bg-gold/20 text-gold-dark',
    confirmed: 'bg-sky-100 text-sky-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-taupe/15 text-taupe',
};

export function OrderStatusBadge({ status }) {
    return (
        <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLES[status] ?? ''}`}>
            {ORDER_STATUS_LABELS[status] ?? status}
        </span>
    );
}

export function Panel({ title, children, action }) {
    return (
        <section className="bg-white p-5 ring-1 ring-taupe/10 sm:p-6">
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between gap-4">
                    {title && <h2 className="font-display text-xl">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
