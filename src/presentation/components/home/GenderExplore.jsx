import { Link } from 'react-router-dom';

const PILLARS = [
    {
        title: 'HERRAMIENTAS',
        subtitle: 'Planchas 360 & Separadoras',
        to: '/tienda/herramientas',
        image: '/images/products/na-sp23-ultra-main.png',
        badge: 'Alta Precisión',
    },
    {
        title: 'INSUMOS',
        subtitle: 'Hilos OCA & Paños Cleanroom',
        to: '/tienda/insumos',
        image: '/images/products/clean-room-wipers-main.png',
        badge: 'Grado Taller',
    },
    {
        title: 'BATERÍAS',
        subtitle: 'Titanium Pure Cobalt Cell',
        to: '/tienda/baterias',
        image: '/images/products/bateria-nasan.png',
        badge: '0 Ciclos',
    },
];

export default function GenderExplore() {
    return (
        <section className="container-luxe py-12 sm:py-16">
            <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Líneas Principales</span>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-900">
                    Herramientas · Insumos · Baterías
                </h2>
                <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
                    Todo lo que necesitas para equipar tu laboratorio de servicio técnico profesional con la mejor calidad y soporte.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PILLARS.map((p) => (
                    <Link
                        key={p.title}
                        to={p.to}
                        className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10"
                    >
                        <div className="w-full flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                                {p.badge}
                            </span>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-600 transition">
                                Ver catálogo →
                            </span>
                        </div>

                        <div className="relative my-6 flex h-44 w-full items-center justify-center">
                            <div className="absolute h-36 w-36 rounded-full bg-teal-100/50 blur-xl group-hover:bg-teal-200/60 transition-all duration-500" />
                            <img
                                src={p.image}
                                alt={p.title}
                                className="relative max-h-40 w-auto object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
                            />
                        </div>

                        <div className="text-center w-full pt-2 border-t border-slate-100">
                            <h3 className="font-display text-xl font-black uppercase tracking-wider text-slate-900 group-hover:text-teal-600 transition">
                                {p.title}
                            </h3>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                                {p.subtitle}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
