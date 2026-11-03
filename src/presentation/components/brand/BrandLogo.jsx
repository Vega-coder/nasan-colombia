import { brandToSlug } from '@/domain/catalog/brands.js';

export default function BrandLogo({ brand, className = 'h-14 w-auto' }) {
    const slug = brandToSlug(typeof brand === 'string' ? brand : brand?.slug || brand?.name || '');

    switch (slug) {
        case 'nasan':
            return (
                <div className={`flex flex-col items-center justify-center text-center ${className}`}>
                    <span className="font-display text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-600">
                        NASAN
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-400">
                        COLOMBIA
                    </span>
                </div>
            );
        case 'jordan-duran':
            return (
                <div className={`flex flex-col items-center justify-center text-center ${className}`}>
                    <span className="font-serif italic text-lg font-bold text-teal-600">
                        By: Jordan Duran
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-slate-400">
                        @nasancolombia
                    </span>
                </div>
            );
        default: {
            const label = (typeof brand === 'string' ? brand : brand?.name || 'NASAN').toUpperCase();
            return (
                <div className={`flex flex-col items-center justify-center text-center ${className}`}>
                    <span className="font-display text-lg font-bold tracking-[0.2em] text-teal-600">{label}</span>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-slate-400">Tecnología</span>
                </div>
            );
        }
    }
}
