import { Link } from 'react-router-dom';
import { HiOutlineTrash, HiArrowLongLeft, HiArrowLongRight, HiOutlineShoppingBag } from 'react-icons/hi2';
import { useCart } from '@/presentation/context/CartContext.jsx';
import { formatMoney } from '@/domain/shared/money.js';
import { MAX_QTY_PER_ITEM } from '@/domain/cart/cart.js';
import QuantityStepper from '@/presentation/components/ui/QuantityStepper.jsx';
import ProductImage from '@/presentation/components/product/ProductImage.jsx';
import FreeShippingProgress from '@/presentation/components/cart/FreeShippingProgress.jsx';
import CartUpsell from '@/presentation/components/cart/CartUpsell.jsx';

export default function Cart() {
    const { items, count, totals, setQuantity, remove, clear } = useCart();

    if (items.length === 0) {
        return (
            <div className="container-luxe flex flex-col items-center py-32 text-center">
                <HiOutlineShoppingBag className="h-14 w-14 text-gold" />
                <h1 className="mt-6 text-4xl">Tu carrito está vacío</h1>
                <p className="mt-3 text-taupe">Explora la colección y agrega las fragancias que quieres comprar.</p>
                <Link to="/tienda" className="btn-dark mt-8">Ir a la tienda</Link>
            </div>
        );
    }

    return (
        <div className="container-luxe py-12">
            <header className="mb-10 text-center">
                <p className="eyebrow text-taupe">Tu selección</p>
                <h1 className="mt-3 text-4xl sm:text-5xl">Carrito de compras</h1>
                <p className="mt-2 text-sm text-taupe">{count} {count === 1 ? 'producto' : 'productos'}</p>
            </header>

            <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
                <section>
                    <div className="hidden grid-cols-[1fr_140px_120px_32px] gap-4 border-b border-taupe/20 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-taupe sm:grid">
                        <span>Producto</span><span className="text-center">Cantidad</span><span className="text-right">Total</span><span />
                    </div>
                    <ul className="divide-y divide-taupe/15">
                        {items.map((item) => (
                            <li key={item.productId} className="grid grid-cols-[80px_1fr] gap-4 py-6 sm:grid-cols-[1fr_140px_120px_32px] sm:items-center">
                                <div className="flex items-center gap-4 sm:col-span-1">
                                    <Link to={`/producto/${item.slug}`}>
                                        <ProductImage product={item} className="h-24 w-20 shrink-0" />
                                    </Link>
                                    <div className="hidden sm:block">
                                        <p className="eyebrow text-[9px] text-taupe">{item.brand}</p>
                                        <Link to={`/producto/${item.slug}`} className="font-display text-lg leading-tight hover:text-gold-dark">{item.name}</Link>
                                        <p className="mt-1 text-xs text-taupe">{formatMoney(item.unitPrice)} c/u</p>
                                        {item.hasFreeShipping || !item.shippingCost || item.shippingCost <= 0 ? (
                                            <span className="text-emerald-700 font-semibold text-[11px] block mt-0.5">✓ Envío gratis</span>
                                        ) : (
                                            <span className="text-taupe text-[11px] block mt-0.5">Envío: {formatMoney(item.shippingCost)}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Vista móvil: datos + controles apilados */}
                                <div className="flex flex-col gap-2 sm:contents">
                                    <div className="sm:hidden">
                                        <p className="eyebrow text-[9px] text-taupe">{item.brand}</p>
                                        <Link to={`/producto/${item.slug}`} className="font-display text-lg leading-tight">{item.name}</Link>
                                        <p className="text-xs text-taupe">{formatMoney(item.unitPrice)} c/u</p>
                                        {item.hasFreeShipping || !item.shippingCost || item.shippingCost <= 0 ? (
                                            <span className="text-emerald-700 font-semibold text-[11px] block mt-0.5">✓ Envío gratis</span>
                                        ) : (
                                            <span className="text-taupe text-[11px] block mt-0.5">Envío: {formatMoney(item.shippingCost)}</span>
                                        )}
                                    </div>
                                    <div className="sm:flex sm:justify-center">
                                        <QuantityStepper
                                            size="sm"
                                            value={item.quantity}
                                            max={Math.min(item.stock, MAX_QTY_PER_ITEM)}
                                            onChange={(q) => setQuantity(item.productId, q)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between sm:contents">
                                        <p className="font-semibold sm:text-right">{formatMoney(item.unitPrice * item.quantity)}</p>
                                        <button onClick={() => remove(item.productId)} className="text-taupe hover:text-ink sm:justify-self-end" aria-label={`Quitar ${item.name}`}>
                                            <HiOutlineTrash className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-taupe/20 pt-6">
                        <Link to="/tienda" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:text-gold-dark">
                            <HiArrowLongLeft className="h-4 w-4" /> Seguir comprando
                        </Link>
                        <button onClick={clear} className="text-xs uppercase tracking-[0.2em] text-taupe hover:text-ink">Vaciar carrito</button>
                    </div>

                    <div className="mt-8">
                        <CartUpsell />
                    </div>
                </section>

                <aside className="lg:sticky lg:top-36 lg:self-start">
                    <div className="bg-white p-6 shadow-sm ring-1 ring-taupe/10 sm:p-8">
                        <h2 className="font-display text-2xl">Resumen</h2>
                        <div className="mt-6"><FreeShippingProgress missing={totals.missingForFreeShipping} /></div>
                        <div className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(totals.subtotal)}</span></div>
                            <div className="flex justify-between text-taupe"><span>Envío</span><span>{totals.shipping ? formatMoney(totals.shipping) : 'Gratis'}</span></div>
                            <div className="flex justify-between border-t border-taupe/15 pt-4 font-display text-2xl"><span>Total</span><span>{formatMoney(totals.total)}</span></div>
                        </div>
                        <Link to="/checkout" className="btn-dark mt-8 w-full py-4">
                            Finalizar compra <HiArrowLongRight className="h-4 w-4" />
                        </Link>
                        <p className="mt-4 text-center text-[11px] text-taupe">Pago contra entrega o transferencia · 100% originales</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
