import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiHeart, HiOutlineHeart, HiCheck, HiStar } from 'react-icons/hi2';
import { getConcentrationLabel } from '@/domain/catalog/categories.js';
import { isOnSale } from '@/domain/catalog/product.js';
import { formatMoney } from '@/domain/shared/money.js';
import { useCart } from '@/presentation/context/CartContext.jsx';
import { useWishlist } from '@/presentation/context/WishlistContext.jsx';
import ProductImage from './ProductImage.jsx';
import PriceTag from './PriceTag.jsx';

export default function ProductCard({ product }) {
    const { add } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [justAdded, setJustAdded] = useState(false);
    const isFav = isInWishlist(product.id);
    const soldOut = product.stock <= 0;
    const meta = [
        getConcentrationLabel(product.concentration),
        product.volumeMl && `${product.volumeMl} ml`,
    ].filter(Boolean).join(' · ');

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        add(product);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1600);
    };

    return (
        <article className="group flex flex-col transition-all duration-300 hover:-translate-y-1">
            <div className="relative block overflow-hidden rounded-sm border border-ink/10 bg-white transition duration-300 group-hover:border-ink/30 group-hover:shadow-sm">
                <Link to={`/producto/${product.slug}`} className="block">
                    <ProductImage
                        product={product}
                        className="aspect-[4/5] transition duration-500 group-hover:shadow-luxe"
                        artClassName="h-3/4 w-auto transition duration-500 group-hover:scale-108 group-hover:-translate-y-1.5"
                    />
                </Link>

                {/* Badges superiores izquierdos */}
                <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
                    {product.isNew && (
                        <span className="bg-ink px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-cream-light">
                            Nuevo
                        </span>
                    )}
                    {isOnSale(product) && (
                        <span className="bg-gold px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink">
                            Oferta
                        </span>
                    )}
                    {soldOut && (
                        <span className="bg-taupe px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white">
                            Agotado
                        </span>
                    )}
                </div>

                {/* Botón de Lista de Deseos flotante */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product);
                    }}
                    aria-label={isFav ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 shadow-sm active:scale-125 hover:scale-110 hover:shadow-md ${
                        isFav
                            ? 'bg-gold text-ink ring-1 ring-gold scale-105'
                            : 'bg-white/85 text-ink/70 hover:bg-white hover:text-ink backdrop-blur-sm'
                    }`}
                >
                    {isFav ? <HiHeart className="h-4 w-4 text-ink" /> : <HiOutlineHeart className="h-4 w-4" />}
                </button>

                {/* Especificaciones clave reveladas sutilmente al hacer hover */}
                {product.notes?.length > 0 && (
                    <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[9px] font-medium text-gold-light backdrop-blur-md shadow-md text-center truncate max-w-[90%]">
                            ✨ {product.notes.slice(0, 3).join(' · ')}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                    <p className="eyebrow text-teal-600 font-bold uppercase tracking-wider">{product.brand}</p>
                    {product.type && (
                        <span className="text-[9px] uppercase font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {product.type}
                        </span>
                    )}
                </div>
                <Link to={`/producto/${product.slug}`} className="mt-1 font-display text-base font-bold leading-snug hover:text-teal-600 transition">
                    {product.name}
                </Link>
                {product.badges?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        {product.badges.map((b, i) => (
                            <span key={i} className="inline-block rounded-full border border-teal-500/30 bg-teal-50/70 px-2 py-0.5 text-[9px] font-semibold text-teal-800">
                                {b}
                            </span>
                        ))}
                    </div>
                )}
                {meta && <p className="mt-1 text-xs text-taupe">{meta}</p>}

                {/* Estrellas y calificación dinámica de reseñas reales */}
                <div className="mt-1.5 flex items-center gap-1.5 min-h-[18px]">
                    {product.reviewsCount > 0 ? (
                        <>
                            <div className="flex items-center text-xs">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <HiStar
                                        key={star}
                                        className={`h-3.5 w-3.5 ${
                                            star <= Math.round(product.ratingAverage || 5)
                                                ? 'text-[#C6A15B] fill-current'
                                                : 'text-taupe/25'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-[11px] font-bold text-ink leading-none">
                                {Number(product.ratingAverage || 5).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-taupe leading-none">
                                ({product.reviewsCount})
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center text-xs text-taupe/25">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <HiStar key={star} className="h-3.5 w-3.5" />
                                ))}
                            </div>
                            <span className="text-[10px] text-taupe/60 leading-none">
                                Sin reseñas
                            </span>
                        </>
                    )}
                </div>

                <div className="mt-auto pt-3">
                    <PriceTag product={product} />
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                        {product.hasFreeShipping || !product.shippingCost || product.shippingCost <= 0 ? (
                            <span className="font-semibold text-emerald-700">✓ Envío gratis</span>
                        ) : (
                            <span className="text-taupe">Envío: <span className="font-semibold text-ink">{formatMoney(product.shippingCost)}</span></span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={soldOut}
                        className={`mt-3 w-full px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95 ${
                            justAdded
                                ? 'bg-gold-dark text-white ring-2 ring-gold scale-[1.02] shadow-md'
                                : 'btn-outline hover:scale-[1.02] hover:border-gold hover:bg-gold hover:text-ink group-hover:border-ink'
                        }`}
                        aria-label={`Agregar ${product.name} al carrito`}
                    >
                        {justAdded ? (
                            <>
                                <HiCheck className="h-4 w-4 animate-bounce" />
                                <span>¡Agregado al carrito!</span>
                            </>
                        ) : (
                            <>
                                <HiOutlineShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span>{soldOut ? 'Agotado' : 'Agregar'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}
