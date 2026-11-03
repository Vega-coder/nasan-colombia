// Implementación de ProductRepository en memoria (modo demo y pruebas).
// Si recibe un `storage` (localStorage), persiste los cambios del panel admin entre recargas.
import { createProduct } from '@/domain/catalog/product.js';

const KEY = 'ap_products_v2';

const load = (storage, seed) => {
    try {
        const saved = storage?.getItem(KEY);
        if (saved) return JSON.parse(saved).map(createProduct);
    } catch {
        // Datos corruptos: volvemos al catálogo semilla.
    }
    return seed.map(createProduct);
};

const enrichWithReviews = (product, storage) => {
    try {
        if (!storage) return product;
        const raw = storage.getItem(`ap_reviews_${product.id}`);
        if (!raw) return product;
        const reviews = JSON.parse(raw);
        if (Array.isArray(reviews) && reviews.length > 0) {
            const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
            return {
                ...product,
                reviewsCount: reviews.length,
                ratingAverage: Number((sum / reviews.length).toFixed(1)),
            };
        }
    } catch {
        // ignore
    }
    return product;
};

/** @returns {import('@/application/ports.js').ProductRepository & { decrementStock: (items: {productId: string, quantity: number}[]) => Promise<void> }} */
export const createInMemoryProductRepository = (seed = [], storage = null) => {
    let products = load(storage, seed);

    const persist = () => {
        try {
            storage?.setItem(KEY, JSON.stringify(products));
        } catch (error) {
            console.warn('No se pudo guardar el catálogo localmente:', error);
        }
    };

    return {
        findAll: async () => products.filter((p) => p.isActive).map((p) => enrichWithReviews(p, storage)),
        findAllForAdmin: async () => products.map((p) => enrichWithReviews(p, storage)),
        findById: async (id) => {
            const found = products.find((p) => p.id === id);
            return found ? enrichWithReviews(found, storage) : null;
        },
        findBySlug: async (slug) => {
            const found = products.find((p) => p.slug === slug && p.isActive);
            return found ? enrichWithReviews(found, storage) : null;
        },
        findByIds: async (ids) => products.filter((p) => ids.includes(p.id)).map((p) => enrichWithReviews(p, storage)),
        save: async (product) => {
            const saved = createProduct(product);
            const exists = products.some((p) => p.id === saved.id);
            products = exists ? products.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...products];
            persist();
            return saved;
        },
        remove: async (id) => {
            products = products.filter((p) => p.id !== id);
            persist();
            return { archived: false };
        },
        // Solo modo demo: en Supabase el descuento de stock lo hace la función place_order.
        decrementStock: async (items) => {
            products = products.map((p) => {
                const item = items.find((i) => i.productId === p.id);
                return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
            });
            persist();
        },
    };
};
