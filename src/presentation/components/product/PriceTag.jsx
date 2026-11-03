import { formatMoney } from '@/domain/shared/money.js';
import { getFinalPrice, isOnSale } from '@/domain/catalog/product.js';

export default function PriceTag({ product, size = 'md' }) {
    const big = size === 'lg';
    return (
        <div className="flex flex-col">
            {product.priceTag && (
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-display font-black text-teal-600 text-lg sm:text-xl tracking-tight">
                        {product.priceTag}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        COP
                    </span>
                </div>
            )}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span className={`${big ? 'text-2xl' : 'text-sm'} font-bold text-ink`}>
                    {formatMoney(getFinalPrice(product))}
                </span>
                {isOnSale(product) && (
                    <>
                        <span className={`${big ? 'text-base' : 'text-xs'} text-taupe line-through`}>
                            {formatMoney(product.price)}
                        </span>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                            -{product.discountPercent}%
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
