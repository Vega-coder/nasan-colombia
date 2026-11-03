import { CONCENTRATION, GENDER, PRODUCT_TYPE } from '@/domain/catalog/categories.js';
import { AROMAS } from '@/domain/catalog/aromas.js';
import { applyDiscount, formatMoney } from '@/domain/shared/money.js';
import { FREE_SHIPPING_THRESHOLD } from '@/domain/cart/cart.js';
import ProductImage from '@/presentation/components/product/ProductImage.jsx';
import ImageUploader from './ImageUploader.jsx';
import { Panel } from './AdminUi.jsx';

const DISPLAY_AROMAS_ORDER = [
    'amaderados',
    'dulces',
    'avainillados',
    'citricos',
    'florales',
    'especiados',
    'afrutados',
    'almizclados',
];

const DISPLAY_AROMAS = DISPLAY_AROMAS_ORDER
    .map((slug) => AROMAS.find((a) => a.slug === slug))
    .filter(Boolean);

const GENDER_OPTIONS = [
    { id: 'maquinaria', label: 'Maquinaria' },
    { id: 'herramientas', label: 'Herramientas' },
    { id: 'insumos', label: 'Insumos' },
    { id: 'baterias', label: 'Baterías' },
];

const TYPE_OPTIONS = [
    { id: 'maquinaria', label: 'Maquinaria' },
    { id: 'herramientas', label: 'Herramientas' },
    { id: 'insumos', label: 'Insumos' },
    { id: 'baterias', label: 'Baterías' },
];

function Field({ label, error, children, className = '' }) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-red-800">{error}</span>}
        </label>
    );
}

export default function ProductForm({ values, errors, brands, onChange, onSubmit, saving, onCancel }) {
    const set = (name) => (e) => onChange({ [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const toggleAroma = (slug) => {
        const current = Array.isArray(values.aromas) ? values.aromas : [];
        const next = current.includes(slug)
            ? current.filter((s) => s !== slug)
            : [...current, slug];
        onChange({ aromas: next });
    };
    const inputClass = (name) => `input py-2.5 ${errors[name] ? 'border-red-700/60' : ''}`;
    const finalPrice = applyDiscount(Number(values.price) || 0, Number(values.discountPercent) || 0);

    // Producto "de vista previa" para mostrar cómo se verá en la tienda.
    const preview = {
        name: values.name || 'Nombre',
        brand: values.brand || 'Marca',
        type: values.type,
        images: values.images,
        palette: values.palette,
    };

    return (
        <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
                <Panel title="Información">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nombre" error={errors.name}>
                            <input value={values.name} onChange={set('name')} className={inputClass('name')} placeholder="Ej. Yara, Asad, 9PM..." />
                        </Field>
                        <Field label="Marca" error={errors.brand}>
                            <input value={values.brand} onChange={set('brand')} className={inputClass('brand')} list="brand-list" placeholder="Ej. Lattafa, Afnan..." />
                            <datalist id="brand-list">{brands.map((b) => <option key={b} value={b} />)}</datalist>
                        </Field>
                        <Field label="Tipo" error={errors.type}>
                            <select value={values.type} onChange={set('type')} className={inputClass('type')}>
                                {TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Género" error={errors.gender}>
                            <select value={values.gender} onChange={set('gender')} className={inputClass('gender')}>
                                {GENDER_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Concentración">
                            <select value={values.concentration ?? ''} onChange={set('concentration')} className="input py-2.5">
                                <option value="">— No aplica —</option>
                                {Object.values(CONCENTRATION).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Contenido (ml)" error={errors.volumeMl}>
                            <input type="number" min="1" value={values.volumeMl ?? ''} onChange={set('volumeMl')} className={inputClass('volumeMl')} placeholder="100" />
                        </Field>
                        <Field label="Descripción" className="sm:col-span-2">
                            <textarea rows={4} value={values.description} onChange={set('description')} className="input resize-y" />
                        </Field>

                        {/* Especialidades Técnicas */}
                        <div className="sm:col-span-2 mt-1 rounded-xl border border-teal-500/30 bg-teal-500/[0.04] p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="eyebrow text-teal-600 font-bold">Especialidades Técnicas y Aplicaciones</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Selecciona una o más áreas para vincular este equipo con las secciones y filtros de la tienda.
                                    </p>
                                </div>
                                {(values.aromas || []).length > 0 && (
                                    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-semibold text-gold-dark">
                                        {(values.aromas || []).length} seleccionada{(values.aromas || []).length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                {DISPLAY_AROMAS.map((a) => {
                                    const isSelected = (values.aromas || []).includes(a.slug);
                                    return (
                                        <button
                                            key={a.slug}
                                            type="button"
                                            onClick={() => toggleAroma(a.slug)}
                                            className={`group relative flex flex-col items-start rounded-lg border p-3 text-left transition duration-200 cursor-pointer ${
                                                isSelected
                                                    ? 'border-gold bg-gold/15 ring-1 ring-gold shadow-xs'
                                                    : 'border-taupe/20 bg-white hover:border-gold/50 hover:bg-cream/40'
                                            }`}
                                        >
                                            <div className="flex w-full items-center justify-between gap-1">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-gold-dark' : 'text-ink'}`}>
                                                    {a.name}
                                                </span>
                                                <div
                                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition ${
                                                        isSelected
                                                            ? 'border-gold bg-gold text-white'
                                                            : 'border-taupe/40 bg-white group-hover:border-gold'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <svg className="h-3 w-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            {a.tag && (
                                                <span className="mt-1 text-[10px] text-taupe line-clamp-1">
                                                    {a.tag}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pirámide Olfativa en 3 etapas */}
                        <div className="sm:col-span-2 mt-2 rounded-xl border border-taupe/20 bg-cream/30 p-4">
                            <div className="mb-3">
                                <p className="eyebrow text-ink font-bold">Pirámide Olfativa (Separadas por comas)</p>
                                <p className="text-[11px] text-taupe mt-0.5">Ingresa las notas de cada fase para generar la pirámide de 3 etapas en la tienda.</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Field label="1. Salida (Primer impacto)" error={errors.topNotes}>
                                    <input
                                        value={values.topNotes ?? ''}
                                        onChange={set('topNotes')}
                                        className="input py-2 text-xs"
                                        placeholder="Ej. Limón, Piña, Bergamota"
                                    />
                                </Field>
                                <Field label="2. Corazón (Cuerpo)" error={errors.heartNotes}>
                                    <input
                                        value={values.heartNotes ?? ''}
                                        onChange={set('heartNotes')}
                                        className="input py-2 text-xs"
                                        placeholder="Ej. Abedul, Jazmín, Rosa"
                                    />
                                </Field>
                                <Field label="3. Base / Fondo (Fijación)" error={errors.baseNotes}>
                                    <input
                                        value={values.baseNotes ?? ''}
                                        onChange={set('baseNotes')}
                                        className="input py-2 text-xs"
                                        placeholder="Ej. Ámbar gris, Almizcle, Vainilla"
                                    />
                                </Field>
                            </div>
                        </div>

                        <Field label="Notas generales / Etiquetas adicionales (Opcional)" className="sm:col-span-2">
                            <input value={values.notes ?? ''} onChange={set('notes')} className="input py-2 text-xs" placeholder="Notas adicionales o lista libre" />
                        </Field>
                    </div>
                </Panel>

                <Panel title="Precio e inventario">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Precio (COP)" error={errors.price}>
                            <input type="number" min="0" step="1000" value={values.price} onChange={set('price')} className={inputClass('price')} />
                        </Field>
                        <Field label="Descuento (%)" error={errors.discountPercent}>
                            <input type="number" min="0" max="90" value={values.discountPercent} onChange={set('discountPercent')} className={inputClass('discountPercent')} />
                        </Field>
                        <Field label="Stock" error={errors.stock}>
                            <input type="number" min="0" step="1" value={values.stock} onChange={set('stock')} className={inputClass('stock')} />
                        </Field>
                    </div>
                    <p className="mt-3 text-sm text-taupe">Precio final en tienda: <strong className="text-ink">{formatMoney(finalPrice)}</strong></p>

                    {/* Configuración de Envío por Producto */}
                    <div className="mt-5 rounded-xl border border-taupe/20 bg-cream/30 p-4">
                        <div className="mb-3">
                            <p className="eyebrow text-ink font-bold">Condiciones de Envío del Producto</p>
                            <p className="text-[11px] text-taupe mt-0.5">Indica si este producto tiene envío gratis o cuánto cuesta su envío individualmente.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 items-start">
                            <label className="flex items-start gap-3 cursor-pointer pt-2">
                                <input
                                    type="checkbox"
                                    checked={Boolean(values.hasFreeShipping)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        onChange({
                                            hasFreeShipping: checked,
                                            shippingCost: checked ? '0' : (values.shippingCost === '0' ? '' : values.shippingCost),
                                        });
                                    }}
                                    className="mt-0.5 h-4 w-4 accent-[#C6A15B]"
                                />
                                <div>
                                    <span className="block text-xs font-semibold text-ink">Envío Gratis Garantizado</span>
                                    <span className="block text-[11px] text-taupe mt-0.5">El cliente no pagará envío por este producto.</span>
                                </div>
                            </label>

                            <Field label="Costo de envío (COP)" error={errors.shippingCost}>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    disabled={Boolean(values.hasFreeShipping)}
                                    value={values.hasFreeShipping ? '0' : values.shippingCost}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onChange({
                                            shippingCost: val,
                                            hasFreeShipping: Number(val) === 0 && val !== '',
                                        });
                                    }}
                                    placeholder="0 = Sin cobro de envío"
                                    className={`${inputClass('shippingCost')} ${values.hasFreeShipping ? 'bg-black/5 opacity-60 cursor-not-allowed' : ''}`}
                                />
                                <span className="mt-1 block text-[10px] text-taupe">
                                    {values.hasFreeShipping
                                        ? '✓ Producto con Envío Gratis ($0).'
                                        : Number(values.shippingCost) > 0
                                        ? `Se cobrará ${formatMoney(Number(values.shippingCost))} de envío (o gratis si el pedido supera ${formatMoney(FREE_SHIPPING_THRESHOLD)}).`
                                        : 'Sin costo de envío configurado ($0 = no se le cobrará envío al cliente).'}
                                </span>
                            </Field>
                        </div>
                    </div>
                </Panel>

                <Panel title="Fotos">
                    <ImageUploader images={values.images} onChange={(images) => onChange({ images })} />
                </Panel>
            </div>

            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                <Panel title="Vista previa">
                    <ProductImage product={preview} className="aspect-[4/5]" artClassName="h-3/4 w-auto" />
                    {values.images.length === 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-taupe">
                            {[['from', 'Vidrio'], ['to', 'Sombra'], ['liquid', 'Líquido']].map(([key, label]) => (
                                <label key={key} className="flex flex-col items-center gap-1">
                                    <input
                                        type="color"
                                        value={values.palette[key]}
                                        onChange={(e) => onChange({ palette: { ...values.palette, [key]: e.target.value } })}
                                        className="h-9 w-full cursor-pointer border border-taupe/20 bg-white"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    )}
                </Panel>

                <Panel title="Visibilidad">
                    <div className="space-y-3 text-sm">
                        {[['isActive', 'Visible en la tienda'], ['isFeatured', 'Destacado en el inicio'], ['isNew', 'Marcar como novedad']].map(([key, label]) => (
                            <label key={key} className="flex cursor-pointer items-center gap-3">
                                <input type="checkbox" checked={values[key]} onChange={set(key)} className="h-4 w-4 accent-[#C6A15B]" />
                                {label}
                            </label>
                        ))}
                    </div>
                </Panel>

                <div className="flex gap-3">
                    <button type="button" onClick={onCancel} className="btn-outline flex-1">Cancelar</button>
                    <button type="submit" disabled={saving} className="btn-dark flex-1">{saving ? 'Guardando…' : 'Guardar'}</button>
                </div>
            </div>
        </form>
    );
}
