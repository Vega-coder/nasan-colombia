import { Link } from 'react-router-dom';

const TECH_AREAS = [
    {
        title: 'PRENSADO & LAMINACIÓN',
        tag: 'Prensas bi-voltaje y colchón 3D Soft',
        to: '/tienda?aroma=remanufactura',
        image: '/images/products/na-cln-main.png',
        alt: 'Prensado y laminación NASAN',
    },
    {
        title: 'PLANCHAS & SEPARADORAS',
        tag: 'Planchas 360° LCD, OLED y curvas',
        to: '/tienda?aroma=pantallas',
        image: '/images/products/na-sp23-ultra-main.png',
        alt: 'Separadoras display 360 NASAN',
    },
    {
        title: 'AUTOCLAVES & BURBUJAS',
        tag: 'Compresor 550W integrado silencioso',
        to: '/tienda?aroma=autoclaves',
        image: '/images/products/na-b2-plus-main.png',
        alt: 'Removedores de burbujas NASAN',
    },
    {
        title: 'SEPARADORA DISPLAY APPLE',
        tag: 'Del iPhone 12 al 17 Pro Max',
        to: '/tienda?q=FR01N',
        image: '/images/products/na-fr01n-main.png',
        alt: 'Separadora iPhone NA-FR01N',
    },
    {
        title: 'HILOS & INSUMOS OCA',
        tag: '0.035 mm molibdeno y paños cleanroom',
        to: '/tienda?aroma=insumos',
        image: '/images/products/hilo-para-glass-main.png',
        alt: 'Hilos y paños para pantalla',
    },
    {
        title: 'PRECISIÓN & TALLER',
        tag: 'Destornilladores con rodamiento 360°',
        to: '/tienda?aroma=herramientas',
        image: '/images/products/destornillador-nasan-main.png',
        alt: 'Destornilladores NASAN de precisión',
    },
];

export default function AromaExplore() {
    return (
        <section className="container-luxe py-12 sm:py-16">
            <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Equipamiento Técnico</span>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-900">
                    Soluciones para Remanufactura Móvil
                </h2>
                <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
                    Tecnología probada para garantizar acabados de fábrica en pantallas planas y curvas sin riesgos.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {TECH_AREAS.map((a) => (
                    <Link
                        key={a.title}
                        to={a.to}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/10"
                    >
                        <div className="flex h-36 sm:h-44 w-full items-center justify-center p-2">
                            <img
                                src={a.image}
                                alt={a.alt}
                                loading="lazy"
                                className="max-h-32 sm:max-h-40 w-auto object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
                            />
                        </div>
                        <div className="mt-3 text-center border-t border-slate-100 pt-3">
                            <h3 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 group-hover:text-teal-600 transition">
                                {a.title}
                            </h3>
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                                {a.tag}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
