import Monogram from '@/presentation/components/brand/Monogram.jsx';

export default function BrandStatement() {
    return (
        <section className="relative overflow-hidden bg-slate-950 py-20 text-center text-white">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/20 blur-3xl animate-pulse-subtle" />
            <div className="container-luxe relative z-10 flex flex-col items-center">
                <div className="animate-float">
                    <Monogram className="h-20 w-auto drop-shadow-[0_10px_25px_rgba(0,140,153,0.35)] sm:h-24" />
                </div>
                <h2 className="mt-6 font-display text-3xl sm:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-500">
                    NASAN COLOMBIA
                </h2>
                <p className="mt-2 font-serif italic text-base sm:text-lg text-teal-400 font-semibold">
                    By: Jordan Duran
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <span className="h-px w-12 bg-teal-500/40" />
                    <span className="font-display text-xs font-bold tracking-[0.25em] text-slate-300 uppercase">
                        HERRAMIENTAS · INSUMOS · BATERÍAS
                    </span>
                    <span className="h-px w-12 bg-teal-500/40" />
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wider">
                    Asesoría técnica directa · Envíos nacionales · @nasancolombia
                </p>
            </div>
        </section>
    );
}
