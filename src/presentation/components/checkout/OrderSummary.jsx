import { formatMoney } from '@/domain/shared/money.js';
import ProductImage from '@/presentation/components/product/ProductImage.jsx';
import FreeShippingProgress from '@/presentation/components/cart/FreeShippingProgress.jsx';
import { FaTag, FaCheck, FaXmark } from 'react-icons/fa6';

export default function OrderSummary({
    items,
    totals,
    couponInput = '',
    onCouponInputChange,
    appliedCoupon = null,
    onApplyCoupon,
    onRemoveCoupon,
    couponLoading = false,
    couponError = null,
    discountAmount = 0,
    finalShipping,
    finalTotal,
}) {
    const displayShipping = typeof finalShipping === 'number' ? finalShipping : totals.shipping;
    const displayTotal = typeof finalTotal === 'number' ? finalTotal : totals.total;

    return (
        <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/10 sm:p-8">
            <h2 className="font-display text-2xl">Resumen del pedido</h2>
            <ul className="mt-6 divide-y divide-taupe/15">
                {items.map((i) => (
                    <li key={i.productId} className="flex items-center gap-4 py-4">
                        <div className="relative">
                            <ProductImage product={i} className="h-16 w-14" />
                            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-cream-light">
                                {i.quantity}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="eyebrow text-[9px] text-taupe">{i.brand}</p>
                            <p className="font-display leading-tight">{i.name}</p>
                            {i.hasFreeShipping || !i.shippingCost || i.shippingCost <= 0 ? (
                                <span className="text-[10px] font-semibold text-emerald-700">✓ Envío gratis</span>
                            ) : (
                                <span className="text-[10px] text-taupe">Envío: {formatMoney(i.shippingCost)}</span>
                            )}
                        </div>
                        <p className="text-sm">{formatMoney(i.unitPrice * i.quantity)}</p>
                    </li>
                ))}
            </ul>

            {/* Sección de Cupón de Descuento / Afiliado */}
            <div className="mt-6 border-t border-taupe/15 pt-5">
                <label htmlFor="coupon-code-input" className="block text-xs font-semibold uppercase tracking-wider text-taupe">
                    ¿Tienes un código de descuento?
                </label>

                {appliedCoupon ? (
                    <div className="mt-2 flex items-center justify-between rounded border border-emerald-300 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                            <FaCheck className="text-emerald-600" />
                            <div>
                                <span className="font-bold tracking-wide">{appliedCoupon.couponCode}</span>
                                <span className="text-emerald-700 ml-1">(-{appliedCoupon.discountPct}%)</span>
                                {appliedCoupon.affiliateName && (
                                    <p className="text-[11px] text-emerald-700/80">
                                        Recomendado por {appliedCoupon.affiliateName}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onRemoveCoupon}
                            className="text-taupe hover:text-red-600 transition p-1"
                            title="Quitar cupón"
                        >
                            <FaXmark className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onApplyCoupon?.();
                        }}
                        className="mt-2 flex gap-2"
                    >
                        <div className="relative flex-1">
                            <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe/60 text-xs" />
                            <input
                                id="coupon-code-input"
                                type="text"
                                value={couponInput}
                                onChange={(e) => onCouponInputChange?.(e.target.value.toUpperCase())}
                                placeholder="Ej: LAURA10"
                                className="w-full rounded border border-taupe/30 bg-cream/20 py-2 pl-8 pr-3 text-xs uppercase tracking-wider focus:border-gold focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={couponLoading || !couponInput.trim()}
                            className="btn-dark px-4 py-2 text-xs uppercase tracking-wider disabled:opacity-50"
                        >
                            {couponLoading ? '...' : 'Aplicar'}
                        </button>
                    </form>
                )}

                {couponError && (
                    <p className="mt-1.5 text-xs text-red-600">{couponError}</p>
                )}
            </div>

            <div className="mt-5 space-y-3 border-t border-taupe/15 pt-5 text-sm">
                <FreeShippingProgress missing={totals.missingForFreeShipping} />
                <div className="flex justify-between pt-2">
                    <span>Subtotal</span>
                    <span>{formatMoney(totals.subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Descuento ({appliedCoupon?.discountPct}%)</span>
                        <span>-{formatMoney(discountAmount)}</span>
                    </div>
                )}

                <div className="flex justify-between text-taupe">
                    <span>Envío</span>
                    <span>{displayShipping ? formatMoney(displayShipping) : 'Gratis'}</span>
                </div>

                <div className="flex justify-between border-t border-taupe/15 pt-4 font-display text-2xl">
                    <span>Total</span>
                    <span>{formatMoney(displayTotal)}</span>
                </div>
            </div>
        </div>
    );
}
