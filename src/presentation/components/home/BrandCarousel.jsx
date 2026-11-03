import { Link } from 'react-router-dom';

const BRANDS = [
    { name: 'NASAN', tag: 'Maquinaria Principal', slug: 'nasan' },
    { name: 'By: Jordan Duran', tag: 'Garantía Oficial', slug: 'jordan-duran' },
    { name: 'NASAN Technology', tag: 'I+D y Laboratorio', slug: 'nasan' },
    { name: 'Titanium Cell', tag: 'Baterías 0 Ciclos', slug: 'nasan' },
];

export default function BrandCarousel() {
    return (
        <section className="bg-slate-900 py-10 text-white">
            <div className="container-luxe">
                <div className="text-center mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Respaldo y Calidad</span>
                    <h2 className="text-lg font-bold font-display uppercase tracking-wider text-slate-200">
                        Líneas Oficiales NASAN Colombia
                    </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {BRANDS.map((b, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center transition hover:border-teal-500/50"
                        >
                            <span className="font-display text-base font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                                {b.name}
                            </span>
                            <span className="mt-1 text-[10px] uppercase font-semibold text-slate-400">
                                {b.tag}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
