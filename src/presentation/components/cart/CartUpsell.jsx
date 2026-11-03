import { useState, useEffect } from 'react';
import { useCases } from '@/infrastructure/container.js';
import { useCart } from '@/presentation/context/CartContext.jsx';
import { formatMoney } from '@/domain/shared/money.js';
import { getFinalPrice } from '@/domain/catalog/product.js';
import { HiPlus, HiCheck } from 'react-icons/hi2';
import ProductImage from '@/presentation/components/product/ProductImage.jsx';

export default function CartUpsell() {
    const { items, add } = useCart();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addedIds, setAddedIds] = useState(new Set());

    useEffect(() => {
        let mounted = true;
        useCases.browseCatalog()
            .then((result) => {
                if (!mounted) return;
                const available = (result?.products ?? []).filter((p) => p.stock > 0);
                setCandidates(available);
            })
            .catch(() => {})
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    // Excluir productos que ya están en el carrito
    const cartIds = new Set(items.map((i) => i.productId));
    const recommendations = candidates
        .filter((p) => !cartIds.has(p.id))
        .sort((a, b) => {
            // Dar prioridad a muestras/decants primero (compra impulsiva ideal y accesible)
            if (a.type === 'muestra' && b.type !== 'muestra') return -1;
            if (b.type === 'muestra' && a.type !== 'muestra') return 1;
            // Luego por menor precio para complementar fácilmente el envío gratis
            return a.price - b.price;
        })
        .slice(0, 6);

    if (loading || recommendations.length === 0) return null;

    const handleAdd = (product) => {
        add(product, 1);
        setAddedIds((prev) => new Set(prev).add(product.id));
        setTimeout(() => {
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(product.id);
                return next;
            });
        }, 1500);
    };

    return (
        <section className="my-5 rounded-2xl border border-gold/25 bg-white/80 p-3.5 shadow-xs backdrop-blur-xs" aria-label="Complementa tu compra">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">
                        ✨ Complementa tu compra
                    </p>
                    <p className="text-[11px] text-taupe">
                        Añade una muestra o fragancia para acompañar tu pedido
                    </p>
                </div>
            </div>

            {/* Lista deslizable horizontal compacta y no invasiva */}
            <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {recommendations.map((prod) => {
                    const isAdded = addedIds.has(prod.id);
                    const finalPrice = getFinalPrice(prod);
                    return (
                        <div
                            key={prod.id}
                            className="group flex w-[138px] shrink-0 flex-col rounded-xl border border-taupe/15 bg-white p-2 shadow-xs transition-all duration-300 hover:border-gold/60 hover:shadow-sm"
                        >
                            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-cream-light/60 p-1">
                                <ProductImage product={prod} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                                {prod.type === 'muestra' && (
                                    <span className="absolute left-1 top-1 rounded bg-gold-dark px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                                        Decant
                                    </span>
                                )}
                            </div>

                            <div className="mt-2 flex flex-1 flex-col">
                                <p className="text-[9px] uppercase tracking-wider text-taupe truncate">{prod.brand}</p>
                                <p className="text-[11px] font-medium leading-tight text-ink line-clamp-1 group-hover:text-gold-dark">
                                    {prod.name}
                                </p>
                                <p className="mt-1 text-xs font-bold text-ink">
                                    {formatMoney(finalPrice)}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => handleAdd(prod)}
                                    className={`mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                                        isAdded
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-ink text-cream-light hover:bg-gold hover:text-ink'
                                    }`}
                                    aria-label={`Agregar ${prod.name} al carrito`}
                                >
                                    {isAdded ? (
                                        <>
                                            <HiCheck className="h-3 w-3" />
                                            <span>Agregado</span>
                                        </>
                                    ) : (
                                        <>
                                            <HiPlus className="h-3 w-3" />
                                            <span>Agregar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
