export default function LuxuryTicker() {
    const ITEMS = [
        'HERRAMIENTAS · INSUMOS · BATERÍAS',
        'NASAN COLOMBIA BY: JORDAN DURAN',
        '@NASANCOLOMBIA',
        'LAMINADORAS 3D SOFT & AUTOCLAVES INTEGRADOS',
        'PLANCHAS 360° LCD & OLED CURVAS',
        'SEPARADORAS DISPLAY IPHONE 12 AL 17PM',
        'ENVÍOS ASEGURADOS A TODA COLOMBIA',
        'GARANTÍA DIRECTA & ASESORÍA TÉCNICA',
    ];

    return (
        <div className="relative overflow-hidden border-y border-teal-500/30 bg-slate-950 py-3 text-teal-300" aria-hidden="true">
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                {[...ITEMS, ...ITEMS].map((text, i) => (
                    <div key={i} className="mx-6 flex items-center gap-6 font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em]">
                        <span className="transition duration-300 hover:text-white">{text}</span>
                        <span className="text-cyan-400">⚡</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
