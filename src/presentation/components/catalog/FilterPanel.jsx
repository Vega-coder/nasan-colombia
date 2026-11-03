import { NavLink } from 'react-router-dom';
import { CATEGORIES } from '@/domain/catalog/categories.js';
import { PRICE_RANGES } from '@/domain/catalog/filters.js';
import { AROMAS } from '@/domain/catalog/aromas.js';

export default function FilterPanel({
    brands,
    selectedBrands,
    onToggleBrand,
    priceRange,
    onPriceRange,
    aroma,
    onAroma,
    onClear,
}) {
    return (
        <div className="space-y-10">
            <div>
                <p className="eyebrow text-ink">Categorías</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                    <li><NavLink to="/tienda" end className={({ isActive }) => (isActive ? 'font-semibold text-gold-dark' : 'text-ink/70 hover:text-ink')}>Todo</NavLink></li>
                    {CATEGORIES.map((c) => (
                        <li key={c.slug}>
                            <NavLink to={`/tienda/${c.slug}`} className={({ isActive }) => (isActive ? 'font-semibold text-gold-dark' : 'text-ink/70 hover:text-ink')}>
                                {c.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <p className="eyebrow text-ink">Líneas Técnicas</p>
                <ul className="mt-4 space-y-2 text-sm">
                    {AROMAS.map((a) => {
                        const isSelected = aroma === a.slug;
                        return (
                            <li key={a.slug}>
                                <button
                                    type="button"
                                    onClick={() => onAroma?.(isSelected ? '' : a.slug)}
                                    className={`flex w-full items-center justify-between text-left transition ${
                                        isSelected ? 'font-semibold text-gold-dark' : 'text-ink/70 hover:text-ink'
                                    }`}
                                >
                                    <span>{a.name}</span>
                                    {isSelected && <span className="text-xs text-gold">✓</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {brands.length > 0 && (
                <fieldset>
                    <legend className="eyebrow text-ink">Marcas</legend>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        {brands.map((b) => (
                            <li key={b}>
                                <label className="flex cursor-pointer items-center gap-3 text-ink/80">
                                    <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => onToggleBrand(b)} className="h-4 w-4 accent-[#C6A15B]" />
                                    {b}
                                </label>
                            </li>
                        ))}
                    </ul>
                </fieldset>
            )}

            <fieldset>
                <legend className="eyebrow text-ink">Precio</legend>
                <ul className="mt-4 space-y-2.5 text-sm">
                    {PRICE_RANGES.map((r) => (
                        <li key={r.id}>
                            <label className="flex cursor-pointer items-center gap-3 text-ink/80">
                                <input type="radio" name="price" checked={priceRange === r.id} onChange={() => onPriceRange(r.id)} className="h-4 w-4 accent-[#C6A15B]" />
                                {r.label}
                            </label>
                        </li>
                    ))}
                </ul>
            </fieldset>

            <button type="button" onClick={onClear} className="text-xs uppercase tracking-[0.2em] text-taupe underline-offset-4 hover:text-ink hover:underline">
                Limpiar filtros
            </button>
        </div>
    );
}
