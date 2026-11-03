import { PAYMENT_METHODS } from '@/domain/orders/order.js';

const FIELDS = [
    { name: 'fullName', label: 'Nombre completo', autoComplete: 'name', span: 2 },
    { name: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
    { name: 'phone', label: 'Celular', type: 'tel', autoComplete: 'tel', inputMode: 'numeric' },
    { name: 'city', label: 'Ciudad', autoComplete: 'address-level2' },
    { name: 'address', label: 'Dirección de entrega', autoComplete: 'street-address' },
];

export default function CheckoutForm({ values, errors, onChange, onSubmit, submitting }) {
    return (
        <form onSubmit={onSubmit} noValidate className="space-y-10">
            <section>
                <h2 className="font-display text-2xl">Datos de envío</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {FIELDS.map((f) => (
                        <label key={f.name} className={f.span === 2 ? 'sm:col-span-2' : ''}>
                            <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">{f.label}</span>
                            <input
                                name={f.name}
                                type={f.type ?? 'text'}
                                autoComplete={f.autoComplete}
                                inputMode={f.inputMode}
                                value={values[f.name]}
                                onChange={onChange}
                                aria-invalid={Boolean(errors[f.name])}
                                className={`input ${errors[f.name] ? 'border-red-700/60' : ''}`}
                            />
                            {errors[f.name] && <span className="mt-1 block text-xs text-red-800">{errors[f.name]}</span>}
                        </label>
                    ))}
                    <label className="sm:col-span-2">
                        <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">Notas (opcional)</span>
                        <textarea name="notes" rows={3} value={values.notes} onChange={onChange} className="input resize-none" placeholder="Indicaciones para la entrega, mensaje de regalo…" />
                    </label>
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl">Método de pago</h2>
                    <span className="text-[10px] uppercase tracking-wider text-taupe">Pago 100% seguro</span>
                </div>
                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="group relative block w-full text-left border border-gold bg-white p-4 sm:p-5 ring-1 ring-gold/40 shadow-sm transition-all duration-200 hover:border-gold-dark hover:shadow-md hover:ring-gold/70 focus:outline-none focus:ring-2 focus:ring-gold active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                        <span className="block pointer-events-none">
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-sm text-ink group-hover:text-gold-dark transition-colors">
                                    Paga online con Wompi (Bancolombia)
                                </span>
                                <span className="rounded bg-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-dark">
                                    Recomendado
                                </span>
                            </span>
                            <span className="mt-1.5 block text-xs text-taupe">
                                Tarjetas de crédito/débito, PSE (todos los bancos), Nequi y Botón Bancolombia.
                            </span>
                            <span className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-ink/70">
                                <span className="rounded border border-taupe/20 bg-cream/30 px-2 py-1">PSE</span>
                                <span className="rounded border border-taupe/20 bg-cream/30 px-2 py-1">Bancolombia</span>
                                <span className="rounded border border-taupe/20 bg-cream/30 px-2 py-1">Nequi</span>
                                <span className="rounded border border-taupe/20 bg-cream/30 px-2 py-1">Visa</span>
                                <span className="rounded border border-taupe/20 bg-cream/30 px-2 py-1">Mastercard</span>
                            </span>
                            <span className="mt-4 flex items-center justify-between border-t border-gold/25 pt-3 text-xs font-semibold uppercase tracking-wider text-ink group-hover:text-gold-dark transition-colors">
                                <span className="flex items-center gap-2">
                                    {submitting ? (
                                        <>
                                            <svg className="h-3.5 w-3.5 animate-spin text-gold-dark" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            <span>Procesando pago…</span>
                                        </>
                                    ) : (
                                        <span>Continuar al pago con Wompi</span>
                                    )}
                                </span>
                                <span className="text-sm font-bold transition-transform group-hover:translate-x-1">→</span>
                            </span>
                        </span>
                    </button>
                    <p className="mt-3 text-center text-[11px] text-taupe leading-relaxed">
                        Al confirmar tu pedido aceptas nuestros{' '}
                        <a
                            href="/terminos"
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-gold text-ink font-medium"
                        >
                            Términos, condiciones y políticas comerciales
                        </a>.
                    </p>
                </div>
            </section>
        </form>
    );
}
