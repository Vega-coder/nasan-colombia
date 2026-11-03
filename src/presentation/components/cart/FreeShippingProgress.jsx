import { FREE_SHIPPING_THRESHOLD } from '@/domain/cart/cart.js';
import { formatMoney } from '@/domain/shared/money.js';
import { HiOutlineTruck, HiCheckCircle } from 'react-icons/hi2';

export default function FreeShippingProgress({ missing }) {
    const clampedMissing = Math.max(0, missing);
    const pct = Math.min(100, Math.max(0, Math.round(((FREE_SHIPPING_THRESHOLD - clampedMissing) / FREE_SHIPPING_THRESHOLD) * 100)));

    return (
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-3.5">
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                    {pct >= 100 ? (
                        <>
                            <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                            <strong className="text-emerald-700 font-semibold">¡Felicidades! Tienes Envío GRATIS</strong>
                        </>
                    ) : (
                        <>
                            <HiOutlineTruck className="h-4 w-4 text-gold-dark" />
                            <span>
                                Te faltan <strong className="text-gold-dark font-bold">{formatMoney(clampedMissing)}</strong> para Envío Gratis
                            </span>
                        </>
                    )}
                </span>
                <span className="font-mono text-[11px] font-bold text-taupe-dark">{pct}%</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-dark/30 ring-1 ring-gold/20">
                <div
                    className="h-full bg-gold-gradient transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
