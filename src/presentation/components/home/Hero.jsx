import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLongRight, HiCheckBadge, HiWrenchScrewdriver, HiShieldCheck } from 'react-icons/hi2';

const FEATURED_MACHINES = [
    {
        id: 'na-cln',
        name: 'NA - CLN Máquina de Prensado',
        brand: 'NASAN',
        slug: 'nasan-na-cln-maquina-prensado',
        image: '/images/products/na-cln-main.png',
        tag: 'Prensado 110V / 220V',
        priceTag: '$ 1.7 M',
        glow: 'bg-cyan-500/30',
    },
    {
        id: 'supa-lite-pro',
        name: 'SUPA LITE PRO Laminadora',
        brand: 'NASAN',
        slug: 'nasan-supa-lite-pro-laminadora',
        image: '/images/products/supa-lite-pro-main.png',
        tag: 'Laminación 3D Soft + Desburbujeador',
        priceTag: '$ 2.35 M',
        glow: 'bg-teal-400/30',
    },
    {
        id: 'na-sp23-ultra',
        name: 'NA - SP23 ULTRA Plancha 360',
        brand: 'NASAN',
        slug: 'nasan-na-sp23-ultra-plancha-360',
        image: '/images/products/na-sp23-ultra-main.png',
        tag: 'Plancha 360° LCD & OLED Curvas',
        priceTag: '$ 480 K',
        glow: 'bg-sky-400/30',
    },
    {
        id: 'na-b2-plus-pro',
        name: 'NA - B2 + PRO 2 en 1',
        brand: 'NASAN',
        slug: 'nasan-na-b2-plus-pro-combo-eliminador-separador',
        image: '/images/products/na-b2-plus-pro-main.png',
        tag: 'Autoclave + Separador Táctil',
        priceTag: '$ 1.45 M',
        glow: 'bg-emerald-400/30',
    },
];

export default function Hero() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % FEATURED_MACHINES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [currentIndex]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: px * 12, y: -py * 12 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    const activeMachine = FEATURED_MACHINES[currentIndex];

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
            {/* Luces y resplandores industriales de fondo */}
            <div className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-cyan-600/15 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#008C99_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />

            <div className="container-luxe relative grid min-h-0 md:min-h-[460px] items-center gap-4 sm:gap-8 py-6 sm:py-10 md:grid-cols-2 md:py-16">
                {/* Columna de texto e identidad oficial */}
                <div className="animate-fade-up z-10">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-0.5 text-[10px] sm:text-xs sm:px-3.5 sm:py-1 font-semibold uppercase tracking-wider text-teal-300 backdrop-blur-md">
                        <HiCheckBadge className="h-4 w-4 text-cyan-400" />
                        <span>Distribuidor Oficial Colombia · By: Jordan Duran</span>
                    </div>

                    <h1 className="mt-3 font-display text-2xl font-extrabold uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[54px]">
                        Maquinaria &{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-500">
                            Herramientas
                        </span>
                        <br />
                        para Servicio Técnico
                    </h1>

                    {/* Slogan oficial destacado */}
                    <div className="mt-2 sm:mt-4 flex flex-wrap items-center gap-2 font-display text-[10px] sm:text-sm font-bold tracking-[0.2em] text-slate-300 uppercase">
                        <span className="text-teal-400">HERRAMIENTAS</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-300">INSUMOS</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-teal-400">BATERÍAS</span>
                    </div>

                    <p className="mt-2 sm:mt-4 max-w-lg text-xs sm:text-base leading-relaxed text-slate-300 line-clamp-3 sm:line-clamp-none">
                        Equipa tu laboratorio con la tecnología de prensado, laminado 3D, autoclaves y desensamble más confiable de la industria. Respaldado por <strong>Jordan Duran</strong> con garantía directa.
                    </p>

                    <div className="mt-4 sm:mt-8 flex flex-wrap items-center gap-2 sm:gap-4">
                        <Link
                            to="/tienda"
                            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2.5 sm:px-6 sm:py-3.5 font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-950 transition-all duration-300 hover:from-teal-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-teal-500/30 hover:scale-105 active:scale-95"
                        >
                            Ver Catálogo Completo <HiArrowLongRight className="h-4 w-4" />
                        </Link>
                        <a
                            href="https://wa.me/573123917729?text=Hola%20NASAN%20Colombia,%20quisiera%20asesor%C3%ADa%20sobre%20la%20maquinaria"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-2.5 sm:px-5 sm:py-3.5 font-display text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-slate-700 hover:text-white"
                        >
                            Asesoría WhatsApp
                        </a>
                    </div>

                    <div className="mt-4 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-3 border-t border-slate-800/80 pt-4 sm:pt-6 text-[10px] sm:text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <HiShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
                            <span>1 Año Garantía</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <HiWrenchScrewdriver className="h-4 w-4 text-cyan-400 shrink-0" />
                            <span>Soporte Técnico</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <HiCheckBadge className="h-4 w-4 text-teal-400 shrink-0" />
                            <span>Envíos Colombia</span>
                        </div>
                    </div>
                </div>

                {/* Columna de la máquina dinámica 3D */}
                <div className="relative flex flex-col items-center justify-center">
                    <div
                        className="relative flex h-48 w-full items-end justify-center sm:h-80 md:h-[380px] lg:h-[420px]"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Glow dinámico detrás de la máquina */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className={`h-64 w-64 rounded-full ${activeMachine.glow} blur-3xl transition-colors duration-700`} />
                        </div>

                        {/* Sombra reflectiva de base */}
                        <div
                            className="absolute bottom-2 h-8 w-60 rounded-[50%] bg-cyan-950/80 blur-xl transition-transform duration-200"
                            style={{
                                transform: `translateX(${tilt.x * 0.5}px) scale(${1 - Math.abs(tilt.y) * 0.01})`,
                            }}
                        />

                        {/* Showcase de maquinaria en rotación */}
                        <div
                            className="relative flex h-full w-full items-center justify-center transition-transform duration-200 ease-out"
                            style={{
                                transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                            }}
                        >
                            {FEATURED_MACHINES.map((machine, index) => {
                                const isActive = index === currentIndex;
                                return (
                                    <Link
                                        key={machine.id}
                                        to={`/producto/${machine.slug}`}
                                        title={`Ver detalles de ${machine.name}`}
                                        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-out ${
                                            isActive
                                                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto z-10'
                                                : 'opacity-0 scale-90 translate-y-4 pointer-events-none z-0'
                                        }`}
                                    >
                                        <div className="relative max-h-[180px] sm:max-h-[320px] md:max-h-[350px] w-auto">
                                            <img
                                                src={machine.image}
                                                alt={machine.name}
                                                className="max-h-[160px] sm:max-h-[300px] md:max-h-[330px] w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,140,153,0.35)] transition-transform duration-500 hover:scale-105"
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tarjeta de información del equipo activo */}
                    <div className="mt-4 flex w-full max-w-md items-center justify-between rounded-lg border border-slate-800 bg-slate-900/90 p-3 shadow-lg backdrop-blur-md">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                                {activeMachine.tag}
                            </span>
                            <h2 className="font-display text-sm font-bold text-white truncate max-w-[240px]">
                                {activeMachine.name}
                            </h2>
                        </div>
                        <div className="text-right">
                            <span className="font-display text-lg font-black text-cyan-300">
                                {activeMachine.priceTag}
                            </span>
                            <Link
                                to={`/producto/${activeMachine.slug}`}
                                className="block text-[10px] font-semibold text-teal-400 hover:text-cyan-300 uppercase tracking-wider"
                            >
                                Ver equipo →
                            </Link>
                        </div>
                    </div>

                    {/* Selector de equipos con miniaturas */}
                    <div className="mt-3 flex gap-2">
                        {FEATURED_MACHINES.map((m, idx) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Ver ${m.name}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentIndex ? 'w-8 bg-teal-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
