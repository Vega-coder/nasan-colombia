import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/domain/catalog/categories.js';
import SectionHeading from '@/presentation/components/ui/SectionHeading.jsx';

const CATEGORY_IMAGES = {
    maquinaria: '/images/products/na-cln-main.png',
    herramientas: '/images/products/na-sp23-ultra-main.png',
    insumos: '/images/products/hilo-para-glass-main.png',
    baterias: '/images/products/bateria-nasan.png',
    novedades: '/images/products/supa-lite-pro-main.png',
    ofertas: '/images/products/na-b2-plus-main.png',
};

export default function CategoryCircles() {
    return (
        <section className="container-luxe pt-8 pb-6 overflow-hidden">
            <SectionHeading eyebrow="Líneas Especializadas" title="Categorías Destacadas" />

            <div className="relative overflow-hidden py-4">
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-slate-50 to-transparent sm:w-24" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-slate-50 to-transparent sm:w-24" />

                <div
                    className="flex w-max items-center gap-6 sm:gap-10 animate-marquee hover:[animation-play-state:paused] py-2"
                    style={{ animationDuration: '30s' }}
                >
                    {[...CATEGORIES, ...CATEGORIES].map((c, idx) => {
                        const img = CATEGORY_IMAGES[c.slug] || '/images/products/na-cln-main.png';
                        return (
                            <div key={`${c.slug}-${idx}`} className="shrink-0">
                                <Link
                                    to={`/tienda/${c.slug}`}
                                    className="group flex flex-col items-center gap-3 transition-transform duration-300 hover:scale-105"
                                >
                                    <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl border-2 border-teal-500/20 bg-white p-3 shadow-sm transition-all duration-300 group-hover:border-teal-500 group-hover:shadow-lg group-hover:shadow-teal-500/20">
                                        <img
                                            src={img}
                                            alt={c.label}
                                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </div>
                                    <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 group-hover:text-teal-600 transition">
                                        {c.short || c.label}
                                    </span>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
