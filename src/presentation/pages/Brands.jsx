import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiArrowRight, HiOutlineSparkles } from 'react-icons/hi2';
import { useCases } from '@/infrastructure/container.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import BrandLogo from '@/presentation/components/brand/BrandLogo.jsx';

export default function Brands() {
    const [search, setSearch] = useState('');
    const { data, loading, error } = useAsync(() => useCases.getBrandsCatalog(), []);

    const rawBrands = data?.brands;

    const filteredBrands = useMemo(() => {
        const brands = Array.isArray(rawBrands) ? rawBrands : [];
        const q = search.trim().toLowerCase();
        if (!q) return brands;
        return brands.filter(
            (b) =>
                (b?.name || '').toLowerCase().includes(q) ||
                (b?.country || '').toLowerCase().includes(q) ||
                (b?.description || '').toLowerCase().includes(q) ||
                (b?.tagline || '').toLowerCase().includes(q)
        );
    }, [rawBrands, search]);

    return (
        <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
            <div className="container-luxe">
                <header className="mx-auto max-w-3xl text-center">
                    <p className="eyebrow text-teal-600 flex items-center justify-center gap-2">
                        <HiOutlineSparkles className="h-3.5 w-3.5" />
                        Líneas Técnicas Oficiales
                    </p>
                    <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-[0.14em] text-slate-900 sm:text-4xl md:text-5xl">
                        NASAN Colombia & Respaldo
                    </h1>
                    <div className="mx-auto mt-4 h-1 w-20 bg-teal-500 rounded-full" />
                    <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-base">
                        Maquinaria, herramientas e insumos especializados para la reparación, laminación al vacío y remanufactura de pantallas LCD y OLED en Colombia.
                    </p>

                    <div className="relative mx-auto mt-8 max-w-md">
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar marcas o líneas técnicas…"
                            className="input w-full py-3 pl-11 pr-4 text-xs shadow-sm bg-white"
                        />
                        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    </div>
                </header>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
                        ))
                    ) : filteredBrands.length > 0 ? (
                        filteredBrands.map((brand) => (
                            <Link
                                key={brand.slug}
                                to={`/marcas/${brand.slug}`}
                                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-500 hover:shadow-lg"
                            >
                                <div>
                                    <div className="h-20 flex items-center justify-center border-b border-slate-100 pb-4">
                                        <BrandLogo brand={brand} />
                                    </div>
                                    <h2 className="mt-4 font-display text-lg font-bold text-slate-900 group-hover:text-teal-600 transition">
                                        {brand.name}
                                    </h2>
                                    <p className="mt-1 text-xs text-teal-600 font-semibold">{brand.tagline}</p>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">
                                        {brand.description}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-700 group-hover:text-teal-600">
                                    <span>{brand.productsCount ?? 0} Equipos disponibles</span>
                                    <HiArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            No encontramos líneas con ese criterio.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
