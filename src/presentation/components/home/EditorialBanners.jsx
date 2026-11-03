import { Link } from 'react-router-dom';
import Monogram from '@/presentation/components/brand/Monogram.jsx';

const BANNERS = [
    {
        theme: 'dark',
        eyebrow: 'Prensado Bi-voltaje',
        title: 'NA - CLN Prensado Profesional',
        to: '/producto/nasan-na-cln-maquina-prensado',
        cta: 'Conocer máquina',
        image: '/images/products/na-cln-main.png',
        alt: 'NA-CLN Prensadora NASAN',
    },
    {
        theme: 'cyan',
        eyebrow: 'Laminación 3D Soft',
        title: 'SUPA LITE PRO Inteligente',
        to: '/producto/nasan-supa-lite-pro-laminadora',
        cta: 'Ver especificaciones',
        image: '/images/products/supa-lite-pro-main.png',
        alt: 'SUPA LITE PRO Laminadora',
    },
    {
        theme: 'dark',
        eyebrow: 'Rotación 360 Grados',
        title: 'NA - SP23 ULTRA Plancha 360',
        to: '/producto/nasan-na-sp23-ultra-plancha-360',
        cta: 'Explorar plancha',
        image: '/images/products/na-sp23-ultra-main.png',
        alt: 'NA-SP23 ULTRA Plancha 360',
    },
];

const THEMES = {
    dark: {
        box: 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800',
        eyebrow: 'text-teal-400',
        btn: 'border border-teal-500/50 bg-teal-500/10 text-teal-300 hover:bg-teal-500 hover:text-slate-950',
    },
    cyan: {
        box: 'bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 text-white border border-teal-500/30',
        eyebrow: 'text-cyan-300',
        btn: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold hover:from-teal-400 hover:to-cyan-400',
    },
};

export default function EditorialBanners() {
    return (
        <section className="container-luxe grid gap-6 pb-16 md:grid-cols-3">
            {BANNERS.map((b) => {
                const t = THEMES[b.theme];
                return (
                    <Link
                        key={b.title}
                        to={b.to}
                        className={`group relative flex min-h-[460px] flex-col items-center overflow-hidden rounded-2xl px-6 pt-8 text-center shadow-md transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/20 hover:-translate-y-2 ${t.box}`}
                    >
                        <Monogram className="h-8 w-auto transition-transform duration-500 group-hover:scale-110" />
                        <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${t.eyebrow}`}>
                            {b.eyebrow}
                        </p>
                        <h3 className="mt-2 font-display text-2xl font-bold leading-snug group-hover:text-cyan-300 transition">
                            {b.title}
                        </h3>
                        <div className="mt-auto flex h-52 w-full items-center justify-center p-2">
                            <img
                                src={b.image}
                                alt={b.alt}
                                loading="lazy"
                                className="max-h-48 w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,140,153,0.35)] transition duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-110"
                            />
                        </div>
                        <span className={`my-6 rounded-md px-4 py-2 text-xs uppercase tracking-wider transition ${t.btn}`}>
                            {b.cta} →
                        </span>
                    </Link>
                );
            })}
        </section>
    );
}
