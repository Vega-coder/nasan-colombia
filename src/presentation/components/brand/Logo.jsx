import { Link } from 'react-router-dom';

// Logo oficial de NASAN COLOMBIA By: Jordan Duran (@nasancolombia)
export default function Logo({ tone = 'dark', compact = false, className = '' }) {
    const isDarkBg = tone === 'light';

    return (
        <Link
            to="/"
            className={`flex min-w-0 items-center gap-2.5 sm:gap-3 transition hover:opacity-95 ${className}`}
            aria-label="NASAN Colombia, ir al inicio"
        >
            {/* Logo oficial recortado del flyer */}
            <div className={`overflow-hidden rounded-md bg-slate-900/40 p-1 border border-teal-500/20 shadow-sm ${compact ? 'h-10' : 'h-12 sm:h-14'}`}>
                <img
                    src="/brand/logo-full.png"
                    alt="NASAN Colombia"
                    className="h-full w-auto object-contain"
                />
            </div>

            <div className="flex min-w-0 flex-col leading-none">
                <div className="flex items-baseline gap-1.5">
                    <span className="font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-500 text-lg sm:text-2xl drop-shadow-sm">
                        NASAN
                    </span>
                    <span className={`font-display text-[11px] sm:text-sm font-bold tracking-[0.25em] ${isDarkBg ? 'text-white' : 'text-slate-800'}`}>
                        COLOMBIA
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-serif italic text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 font-semibold tracking-wide">
                        By: Jordan Duran
                    </span>
                    <span className="hidden sm:inline-block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        · @nasancolombia
                    </span>
                </div>
            </div>
        </Link>
    );
}
