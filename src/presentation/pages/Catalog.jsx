import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustmentsHorizontal, HiOutlineXMark } from 'react-icons/hi2';
import { useCases } from '@/infrastructure/container.js';
import { getCategoryBySlug } from '@/domain/catalog/categories.js';
import { getAromaBySlug } from '@/domain/catalog/aromas.js';
import { SORT_OPTIONS, PRICE_RANGES } from '@/domain/catalog/filters.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import FilterPanel from '@/presentation/components/catalog/FilterPanel.jsx';
import SortDropdown from '@/presentation/components/catalog/SortDropdown.jsx';
import ProductGrid, { ProductGridSkeleton } from '@/presentation/components/product/ProductGrid.jsx';
import NotFound from './NotFound.jsx';

// Los filtros viven en la URL (?q=&aroma=&marca=&precio=&orden=) para que se puedan compartir.
export default function Catalog() {
    const { category } = useParams();
    const [params, setParams] = useSearchParams();
    const [filtersOpen, setFiltersOpen] = useState(false);

    const query = params.get('q') ?? '';
    const aroma = params.get('aroma') ?? '';
    const brands = params.getAll('marca');
    const priceRange = params.get('precio') ?? '';
    const sort = params.get('orden') ?? 'featured';
    const range = PRICE_RANGES.find((r) => r.id === priceRange);
    const categoryInfo = getCategoryBySlug(category);
    const aromaInfo = getAromaBySlug(aroma);

    const { data, loading, error } = useAsync(
        () => useCases.browseCatalog({ category, query, aroma, brands, minPrice: range?.min, maxPrice: range?.max ?? undefined, sort }),
        [category, params.toString()],
    );

    if (category && !categoryInfo) return <NotFound />;

    const update = (mutate) => {
        const next = new URLSearchParams(params);
        mutate(next);
        setParams(next, { replace: true });
    };

    const toggleBrand = (brand) => update((p) => {
        const current = p.getAll('marca');
        p.delete('marca');
        (current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand]).forEach((b) => p.append('marca', b));
    });

    const panel = (
        <FilterPanel
            brands={data?.brands ?? []}
            selectedBrands={brands}
            onToggleBrand={toggleBrand}
            priceRange={priceRange}
            onPriceRange={(id) => update((p) => p.set('precio', id))}
            aroma={aroma}
            onAroma={(slug) => update((p) => (slug ? p.set('aroma', slug) : p.delete('aroma')))}
            onClear={() => setParams({}, { replace: true })}
        />
    );

    let title = 'Catálogo Oficial';
    let subtitle = null;
    if (query) {
        title = `Resultados para “${query}”`;
    } else if (aromaInfo) {
        title = `Línea ${aromaInfo.name}`;
        subtitle = aromaInfo.description;
    } else if (categoryInfo) {
        title = categoryInfo.label;
    }

    return (
        <div className="container-luxe py-12">
            <header className="mb-10 border-b border-taupe/15 pb-8 text-center">
                <p className="eyebrow text-taupe">{aromaInfo ? 'Familia Olfativa' : 'Tienda'}</p>
                <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
                {subtitle && <p className="mx-auto mt-3 max-w-xl text-sm text-taupe">{subtitle}</p>}
                {aromaInfo && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-medium text-gold-dark">
                            Aroma: <strong className="font-semibold">{aromaInfo.name}</strong>
                            <button
                                type="button"
                                onClick={() => update((p) => p.delete('aroma'))}
                                className="ml-1 text-taupe hover:text-ink"
                                title="Quitar filtro de aroma"
                            >
                                ✕
                            </button>
                        </span>
                    </div>
                )}
            </header>

            <div className="flex gap-12">
                <aside className="hidden w-60 shrink-0 lg:block">{panel}</aside>

                <div className="flex-1">
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <button className="btn-outline px-4 py-2 lg:hidden" onClick={() => setFiltersOpen(true)}>
                            <HiOutlineAdjustmentsHorizontal className="h-4 w-4" /> Filtros
                        </button>
                        <p className="hidden text-xs text-taupe lg:block">{loading ? 'Cargando…' : `${data?.total ?? 0} productos`}</p>
                        <SortDropdown
                            value={sort}
                            onChange={(val) => update((p) => p.set('orden', val))}
                        />
                    </div>

                    {error && <p className="py-20 text-center text-taupe">No pudimos cargar el catálogo. Intenta de nuevo en unos segundos.</p>}
                    {loading && <ProductGridSkeleton count={6} />}
                    {!loading && !error && data.products.length === 0 && (
                        <div className="py-20 text-center">
                            <p className="font-display text-2xl">No encontramos productos</p>
                            <p className="mt-2 text-sm text-taupe">Prueba con otros filtros o términos de búsqueda.</p>
                        </div>
                    )}
                    {!loading && !error && data.products.length > 0 && <ProductGrid products={data.products} columns="lg:grid-cols-3" />}
                </div>
            </div>

            {filtersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-ink/50" onClick={() => setFiltersOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-cream-light p-6">
                        <div className="mb-8 flex items-center justify-between">
                            <p className="font-display text-2xl">Filtros</p>
                            <button onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros"><HiOutlineXMark className="h-6 w-6" /></button>
                        </div>
                        {panel}
                    </div>
                </div>
            )}
        </div>
    );
}
