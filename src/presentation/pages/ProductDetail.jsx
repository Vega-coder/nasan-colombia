import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineTruck, HiOutlineLockClosed, HiHeart, HiOutlineHeart, HiOutlineSparkles, HiStar } from 'react-icons/hi2';
import { useCases } from '@/infrastructure/container.js';
import { getConcentrationLabel } from '@/domain/catalog/categories.js';
import { getAromaBySlug } from '@/domain/catalog/aromas.js';
import { getStockLabel } from '@/domain/catalog/product.js';
import { MAX_QTY_PER_ITEM, FREE_SHIPPING_THRESHOLD } from '@/domain/cart/cart.js';
import { formatMoney } from '@/domain/shared/money.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import { useCart } from '@/presentation/context/CartContext.jsx';
import { useWishlist } from '@/presentation/context/WishlistContext.jsx';
import ProductImage from '@/presentation/components/product/ProductImage.jsx';
import ProductGallery from '@/presentation/components/product/ProductGallery.jsx';
import PriceTag from '@/presentation/components/product/PriceTag.jsx';
import ProductGrid from '@/presentation/components/product/ProductGrid.jsx';
import QuantityStepper from '@/presentation/components/ui/QuantityStepper.jsx';
import SectionHeading from '@/presentation/components/ui/SectionHeading.jsx';
import ProductReviews from '@/presentation/components/product/ProductReviews.jsx';
import RecentlyViewed from '@/presentation/components/product/RecentlyViewed.jsx';
import NotFound from './NotFound.jsx';

export default function ProductDetail() {
    const { slug } = useParams();
    const { data, loading } = useAsync(() => useCases.getProductDetail(slug), [slug]);

    if (loading) {
        return (
            <div className="container-luxe grid animate-pulse gap-12 py-12 md:grid-cols-2">
                <div className="aspect-square bg-cream" />
                <div className="space-y-4"><div className="h-4 w-1/4 bg-cream" /><div className="h-10 w-2/3 bg-cream" /></div>
            </div>
        );
    }
    if (!data?.product) return <NotFound />;

    // key={slug} reinicia la cantidad al navegar entre productos relacionados.
    return <ProductView key={slug} product={data.product} related={data.related} />;
}

function ProductView({ product, related }) {
    const { add } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isFav = isInWishlist(product.id);
    const [qty, setQty] = useState(1);
    const soldOut = product.stock <= 0;
    const maxQty = Math.min(product.stock, MAX_QTY_PER_ITEM);
    const hasFreeShip = product.hasFreeShipping || !product.shippingCost || product.shippingCost <= 0;

        const details = [
        ['Marca', product.brand],
        ['Línea Técnica', getConcentrationLabel(product.concentration)],
        ['Categoría', product.type ? product.type.toUpperCase() : null],
        ['Garantía', '1 Año Oficial NASAN'],
        ['Envío', hasFreeShip ? 'Gratis a toda Colombia' : formatMoney(product.shippingCost)],
    ].filter(([, v]) => v);

    return (
        <>
            <div className="container-luxe py-10">
                <nav className="mb-8 text-[11px] uppercase tracking-[0.15em] text-taupe" aria-label="Ruta">
                    <Link to="/" className="hover:text-ink">Inicio</Link> / <Link to="/tienda" className="hover:text-ink">Tienda</Link> / <span className="text-ink">{product.name}</span>
                </nav>

                <div className="grid gap-10 md:grid-cols-2 lg:gap-16 items-start">
                    <ProductGallery product={product} />

                    <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                            <p className="eyebrow text-taupe">{product.brand}</p>
                            {product.reviewsCount > 0 ? (
                                <a href="#reviews" className="flex items-center gap-1.5 text-xs font-semibold text-ink transition hover:text-gold-dark">
                                    <div className="flex items-center text-[#C6A15B]">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <HiStar
                                                key={star}
                                                className={`h-4 w-4 ${
                                                    star <= Math.round(product.ratingAverage || 5)
                                                        ? 'text-[#C6A15B] fill-current'
                                                        : 'text-taupe/25'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span>{Number(product.ratingAverage || 5).toFixed(1)}</span>
                                    <span className="text-taupe font-normal">({product.reviewsCount} {product.reviewsCount === 1 ? 'opinión' : 'opiniones'})</span>
                                </a>
                            ) : (
                                <a href="#reviews" className="flex items-center gap-1 text-xs text-taupe hover:text-gold-dark transition">
                                    <div className="flex items-center text-taupe/25">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <HiStar key={star} className="h-4 w-4" />
                                        ))}
                                    </div>
                                    <span className="text-[11px]">Sé el primero en opinar</span>
                                </a>
                            )}
                        </div>
                        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{product.name}</h1>
                        <p className="mt-2 text-sm text-taupe">
                            {[getConcentrationLabel(product.concentration), product.volumeMl && `${product.volumeMl} ml`].filter(Boolean).join(' · ')}
                        </p>

                        {product.aromas?.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                {product.aromas.map((slug) => {
                                    const aroma = getAromaBySlug(slug);
                                    if (!aroma) return null;
                                    return (
                                        <Link
                                            key={slug}
                                            to={`/tienda?aroma=${slug}`}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark transition duration-200 hover:bg-gold hover:text-white hover:border-gold"
                                            title={`Ver productos ${aroma.name}`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                                            {aroma.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6"><PriceTag product={product} size="lg" /></div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <span className={`text-xs ${product.stock <= 3 ? 'text-gold-dark font-medium' : 'text-taupe'}`}>{getStockLabel(product)}</span>
                            <span className="text-taupe/40">·</span>
                            {hasFreeShip ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                    <HiOutlineTruck className="h-3.5 w-3.5" /> Envío GRATIS
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-ink ring-1 ring-taupe/20">
                                    <HiOutlineTruck className="h-3.5 w-3.5 text-gold-dark" /> Envío: <strong>{formatMoney(product.shippingCost)}</strong>
                                    <span className="text-[10px] text-taupe ml-0.5">(Gratis desde {formatMoney(FREE_SHIPPING_THRESHOLD)})</span>
                                </span>
                            )}
                        </div>

                        <p className="mt-6 leading-relaxed text-ink/80">{product.description}</p>

                        {/* Ficha Técnica y Prestaciones en 3 Etapas (Operación, Control, Estructura) */}
                        {((product.topNotes?.length > 0) || (product.heartNotes?.length > 0) || (product.baseNotes?.length > 0)) ? (
                            <div className="mt-8 border-t border-taupe/15 pt-6 pb-2">
                                <h3 className="eyebrow text-ink font-bold tracking-[0.2em]">
                                    Ficha Técnica y Prestaciones
                                </h3>

                                <div className="mt-5 space-y-4">
                                    {product.topNotes?.length > 0 && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                            <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-taupe">
                                                Operación
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {product.topNotes.map((note) => (
                                                    <span
                                                        key={note}
                                                        className="rounded-full border border-taupe/25 bg-white px-4 py-1.5 text-xs font-medium text-ink shadow-xs transition duration-200 hover:border-gold hover:text-gold-dark hover:scale-105"
                                                    >
                                                        {note}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {product.heartNotes?.length > 0 && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                            <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-taupe">
                                                Control
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {product.heartNotes.map((note) => (
                                                    <span
                                                        key={note}
                                                        className="rounded-full border border-taupe/25 bg-white px-4 py-1.5 text-xs font-medium text-ink shadow-xs transition duration-200 hover:border-gold hover:text-gold-dark hover:scale-105"
                                                    >
                                                        {note}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {product.baseNotes?.length > 0 && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                            <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-taupe">
                                                Estructura
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {product.baseNotes.map((note) => (
                                                    <span
                                                        key={note}
                                                        className="rounded-full border border-taupe/25 bg-white px-4 py-1.5 text-xs font-medium text-ink shadow-xs transition duration-200 hover:border-gold hover:text-gold-dark hover:scale-105"
                                                    >
                                                        {note}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : product.notes?.length > 0 ? (
                            <div className="mt-8 border-t border-taupe/15 pt-6 pb-2">
                                <h3 className="eyebrow text-ink font-bold tracking-[0.2em]">
                                    Características Clave
                                </h3>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {product.notes.map((note) => (
                                        <span
                                            key={note}
                                            className="rounded-full border border-taupe/25 bg-white px-4 py-1.5 text-xs font-medium text-ink shadow-xs transition duration-200 hover:border-gold hover:text-gold-dark hover:scale-105"
                                        >
                                            {note}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Acciones de compra y favoritos */}
                        <div className="mt-10 flex flex-wrap items-center gap-4">
                            {!soldOut && <QuantityStepper value={qty} max={maxQty} onChange={(q) => setQty(Math.max(1, Math.min(q, maxQty)))} />}
                            <button className="btn-dark flex-1 py-4" disabled={soldOut} onClick={() => add(product, qty)}>
                                {soldOut ? 'Agotado' : 'Agregar al carrito'}
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleWishlist(product)}
                                aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded border transition-all duration-300 hover:scale-105 hover:shadow-sm active:scale-90 ${
                                    isFav
                                        ? 'border-gold bg-gold/10 text-gold-dark hover:bg-gold/20'
                                        : 'border-taupe/30 text-ink hover:border-gold hover:text-gold-dark'
                                }`}
                                title={isFav ? 'En tu lista de deseos' : 'Guardar en favoritos'}
                            >
                                {isFav ? <HiHeart className="h-6 w-6 text-gold transition-transform hover:scale-110" /> : <HiOutlineHeart className="h-6 w-6 transition-transform hover:scale-110" />}
                            </button>
                        </div>

                        <ul className="mt-10 grid gap-4 border-t border-taupe/15 pt-8 text-xs sm:grid-cols-3">
                            <li className="flex items-center gap-2"><HiOutlineShieldCheck className="h-5 w-5 text-gold-dark" /> 100% original</li>
                            <li className="flex items-center gap-2">
                                <HiOutlineTruck className="h-5 w-5 text-gold-dark" />
                                {hasFreeShip ? 'Envío gratis 24/48h' : `Envío ${formatMoney(product.shippingCost)} (24/48h)`}
                            </li>
                            <li className="flex items-center gap-2"><HiOutlineLockClosed className="h-5 w-5 text-gold-dark" /> Pago 100% seguro</li>
                        </ul>

                        <dl className="mt-8 divide-y divide-taupe/15 border-y border-taupe/15 text-sm">
                            {details.map(([k, v]) => (
                                <div key={k} className="flex justify-between py-3"><dt className="text-taupe">{k}</dt><dd>{v}</dd></div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>

            {/* 1. Apartado de Reseñas */}
            <ProductReviews product={product} />

            {/* 2. Productos Relacionados */}
            {related.length > 0 && (
                <section className="container-luxe py-16 sm:py-20 border-t border-taupe/15">
                    <SectionHeading eyebrow="También te puede interesar" title="Equipos y repuestos relacionados" />
                    <ProductGrid products={related} columns="lg:grid-cols-4" />
                </section>
            )}

            {/* 3. Productos Vistos Recientemente por el Usuario */}
            <RecentlyViewed currentProduct={product} />
        </>
    );
}
