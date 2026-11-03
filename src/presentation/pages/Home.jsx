import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCases } from '@/infrastructure/container.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import Hero from '@/presentation/components/home/Hero.jsx';
import LuxuryTicker from '@/presentation/components/home/LuxuryTicker.jsx';
import GenderExplore from '@/presentation/components/home/GenderExplore.jsx';
import AromaExplore from '@/presentation/components/home/AromaExplore.jsx';
import CategoryCircles from '@/presentation/components/home/CategoryCircles.jsx';
import EditorialBanners from '@/presentation/components/home/EditorialBanners.jsx';
import BrandStatement from '@/presentation/components/home/BrandStatement.jsx';
import BrandCarousel from '@/presentation/components/home/BrandCarousel.jsx';
import SectionHeading from '@/presentation/components/ui/SectionHeading.jsx';
import ProductGrid, { ProductGridSkeleton } from '@/presentation/components/product/ProductGrid.jsx';

const TABS = [
    { id: 'all', label: 'Todos' },
    { id: 'maquinaria', label: 'Maquinaria' },
    { id: 'herramientas', label: 'Herramientas' },
    { id: 'insumos', label: 'Insumos' },
    { id: 'baterias', label: 'Baterías' },
    { id: 'ofertas', label: 'Ofertas' },
];

export default function Home() {
    const { data, loading } = useAsync(() => useCases.getHomeShowcase(), []);
    const [selectedTab, setSelectedTab] = useState('all');

    const rawFeatured = data?.featured;
    const filteredProducts = useMemo(() => {
        const list = rawFeatured ?? [];
        if (selectedTab === 'all') return list;
        if (selectedTab === 'maquinaria') return list.filter((p) => p.type === 'maquinaria' || p.gender === 'maquinaria');
        if (selectedTab === 'herramientas') return list.filter((p) => p.type === 'herramientas' || p.gender === 'herramientas');
        if (selectedTab === 'insumos') return list.filter((p) => p.type === 'insumos' || p.gender === 'insumos');
        if (selectedTab === 'baterias') return list.filter((p) => p.type === 'baterias' || p.gender === 'baterias');
        if (selectedTab === 'ofertas') return list.filter((p) => (p.discountPercent ?? 0) > 0);
        return list;
    }, [rawFeatured, selectedTab]);

    return (
        <>
            <Hero />
            <LuxuryTicker />

            {/* Sección de Equipos y Herramientas Destacadas con Filtros Interactivos */}
            <section className="container-luxe pt-10 pb-12 sm:pt-14 sm:pb-16">
                <SectionHeading eyebrow="Catálogo Oficial" title="Equipamiento Destacado" />

                {/* Pestañas de filtrado dinámico */}
                <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                    {TABS.map((tab) => {
                        const isActive = selectedTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedTab(tab.id)}
                                className={`group relative flex items-center justify-center overflow-hidden rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase select-none transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                                    isActive
                                        ? 'bg-slate-900 text-teal-300 shadow-md ring-2 ring-teal-500 scale-105'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-700 hover:scale-105 hover:shadow-sm'
                                }`}
                            >
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <ProductGridSkeleton count={8} />
                ) : filteredProducts.length > 0 ? (
                    <ProductGrid products={filteredProducts} />
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-10 text-center">
                        <p className="text-sm text-slate-500">No encontramos productos en esta sección en este momento.</p>
                        <button
                            type="button"
                            onClick={() => setSelectedTab('all')}
                            className="btn-dark mt-4 text-[10px]"
                        >
                            Ver todos los productos
                        </button>
                    </div>
                )}

                <div className="mt-12 text-center">
                    <Link to="/tienda" className="btn-outline transition-transform hover:scale-105">
                        Ver todo el catálogo
                    </Link>
                </div>
            </section>

            <GenderExplore />
            <CategoryCircles />
            <AromaExplore />
            <EditorialBanners />

            {data?.newArrivals?.length > 0 && (
                <section className="bg-slate-100 py-16">
                    <div className="container-luxe">
                        <SectionHeading eyebrow="Recién llegados" title="Nuevas Tecnologías" />
                        <ProductGrid products={data.newArrivals} />
                    </div>
                </section>
            )}

            <BrandCarousel brands={data?.brands} />
            <BrandStatement />
        </>
    );
}
