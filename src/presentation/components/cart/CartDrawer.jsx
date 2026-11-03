import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineXMark, HiOutlineTrash } from 'react-icons/hi2';
import { useCart } from '@/presentation/context/CartContext.jsx';
import { formatMoney } from '@/domain/shared/money.js';
import { MAX_QTY_PER_ITEM } from '@/domain/cart/cart.js';
import QuantityStepper from '@/presentation/components/ui/QuantityStepper.jsx';
import ProductImage from '@/presentation/components/product/ProductImage.jsx';
import FreeShippingProgress from './FreeShippingProgress.jsx';
import CartUpsell from './CartUpsell.jsx';

export default function CartDrawer() {
    const { items, totals, isOpen, close, setQuantity, remove } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => e.key === 'Escape' && close();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, close]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito de compras">
            <div className="absolute inset-0 bg-ink/50" onClick={close} />
            <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-light shadow-luxe">
                <header className="flex items-center justify-between border-b border-taupe/15 px-6 py-5">
                    <h2 className="font-display text-2xl">Tu carrito</h2>
                    <button onClick={close} aria-label="Cerrar carrito"><HiOutlineXMark className="h-6 w-6" /></button>
                </header>

                {items.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                        <p className="font-display text-xl">Tu carrito está vacío</p>
                        <p className="text-sm text-slate-500">Equipa tu laboratorio con la mejor maquinaria y repuestos.</p>
                        <Link to="/tienda" onClick={close} className="btn-dark mt-2">Ver colección</Link>
                    </div>
                ) : (
                    <>
                        <div className="px-6 pt-5">
                            <FreeShippingProgress missing={totals.missingForFreeShipping} />
                        </div>
                        <div className="flex-1 overflow-y-auto px-6">
                            <ul className="divide-y divide-taupe/15">
                                {items.map((item) => (
                                    <li key={item.productId} className="flex gap-4 py-5">
                                        <ProductImage product={item} className="h-24 w-20 shrink-0" />
                                        <div className="flex flex-1 flex-col">
                                            <p className="eyebrow text-[9px] text-taupe">{item.brand}</p>
                                            <Link to={`/producto/${item.slug}`} onClick={close} className="font-display leading-tight hover:text-gold-dark">{item.name}</Link>
                                            <div className="flex items-center gap-2">
                                                <p className="mt-1 text-sm font-semibold">{formatMoney(item.unitPrice * item.quantity)}</p>
                                                {item.hasFreeShipping || !item.shippingCost || item.shippingCost <= 0 ? (
                                                    <span className="mt-1 text-[10px] font-semibold text-emerald-700">· Envío gratis</span>
                                                ) : (
                                                    <span className="mt-1 text-[10px] text-taupe">· Envío {formatMoney(item.shippingCost)}</span>
                                                )}
                                            </div>
                                            <div className="mt-auto flex items-center justify-between pt-2">
                                                <QuantityStepper
                                                    size="sm"
                                                    value={item.quantity}
                                                    max={Math.min(item.stock, MAX_QTY_PER_ITEM)}
                                                    onChange={(q) => setQuantity(item.productId, q)}
                                                />
                                                <button onClick={() => remove(item.productId)} className="text-taupe hover:text-ink" aria-label={`Quitar ${item.name}`}>
                                                    <HiOutlineTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Complementa tu compra integrado de forma sutil y no invasiva */}
                            <CartUpsell />
                        </div>
                        <footer className="space-y-3 border-t border-taupe/15 px-6 py-5">
                            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatMoney(totals.subtotal)}</span></div>
                            <div className="flex justify-between text-sm text-taupe">
                                <span>Envío</span><span>{totals.shipping ? formatMoney(totals.shipping) : 'Gratis'}</span>
                            </div>
                            <div className="flex justify-between font-display text-xl"><span>Total</span><span>{formatMoney(totals.total)}</span></div>
                            
                            <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] text-taupe">
                                <span>🔒 Compra 100% protegida</span>
                            </div>

                            <button className="btn-dark w-full" onClick={() => { close(); navigate('/checkout'); }}>
                                Finalizar compra
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="btn-outline w-full px-2" onClick={() => { close(); navigate('/carrito'); }}>
                                    Ver carrito
                                </button>
                                <button className="btn-outline w-full px-2" onClick={close}>
                                    Seguir comprando
                                </button>
                            </div>
                        </footer>
                    </>
                )}
            </aside>
        </div>
    );
}
