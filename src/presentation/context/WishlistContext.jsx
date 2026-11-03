import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from '@/presentation/utils/swal.js';

const STORAGE_KEY = 'nasan_wishlist';
const WishlistContext = createContext(null);

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist debe usarse dentro de <WishlistProvider>');
    return ctx;
};

const loadWishlist = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const WishlistProvider = ({ children }) => {
    const [items, setItems] = useState(loadWishlist);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Modo incógnito o sin almacenamiento
        }
    }, [items]);

    const isInWishlist = useCallback(
        (productId) => items.some((item) => String(item.id) === String(productId)),
        [items]
    );

    const toggleWishlist = useCallback((product) => {
        if (!product?.id) return;
        setItems((prev) => {
            const exists = prev.some((item) => String(item.id) === String(product.id));
            if (exists) {
                toast('Eliminado de tus favoritos', 'info');
                return prev.filter((item) => String(item.id) !== String(product.id));
            } else {
                toast('¡Añadido a tus favoritos!', 'success');
                // Guardamos una copia ligera del producto para pintar la lista sin reconsultar el backend
                const minimal = {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    brand: product.brand,
                    price: product.price,
                    discountPercent: product.discountPercent,
                    stock: product.stock,
                    concentration: product.concentration,
                    volumeMl: product.volumeMl,
                    gender: product.gender,
                    images: product.images || [],
                    palette: product.palette,
                    notes: product.notes || [],
                    isNew: product.isNew,
                    isFeatured: product.isFeatured,
                };
                return [minimal, ...prev];
            }
        });
    }, []);

    const removeFromWishlist = useCallback((productId) => {
        setItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
        toast('Eliminado de favoritos', 'info');
    }, []);

    const clearWishlist = useCallback(() => {
        setItems([]);
        toast('Lista de deseos vaciada', 'info');
    }, []);

    const value = useMemo(
        () => ({
            items,
            count: items.length,
            isInWishlist,
            toggleWishlist,
            removeFromWishlist,
            clearWishlist,
        }),
        [items, isInWishlist, toggleWishlist, removeFromWishlist, clearWishlist]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
