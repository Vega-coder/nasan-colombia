// Implementación de ProductRepository en memoria para NASAN Colombia.
// Carga y preserva únicamente el catálogo oficial de tecnología, maquinaria y baterías.
import { createProduct } from '@/domain/catalog/product.js';

const KEY = 'nasan_tech_catalog_v5';

const load = (storage, seed = []) => {
    try {
        // Limpiar de forma contundente cualquier residuo de tiendas anteriores o versiones viejas
        if (storage) {
            const keysToRemove = [
                'ap_products',
                'ap_products_v2',
                'ap_cart',
                'ap_wishlist',
                'ap_recently_viewed',
                'ap_chatbot_history_v2',
                'nasan_products',
                'nasan_products_v2',
                'nasan_products_v3',
                'nasan_products_v4',
            ];
            keysToRemove.forEach((k) => {
                try {
                    storage.removeItem(k);
                } catch {
                    // ignore
                }
            });
        }
        const saved = storage?.getItem(KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (
                Array.isArray(parsed) &&
                parsed.length >= 10 &&
                parsed.every((p) => (p.brand === 'NASAN' || p.brand === 'Saisebmer') && !/perfum|aroma|fraganc/i.test(p.name))
            ) {
                return parsed.map(createProduct);
            }
        }
    } catch {
        // Fallback seguro a semilla
    }
    return seed.map(createProduct);
};

const enrichWithReviews = (product, storage) => {
    try {
        if (!storage) return product;
        const raw = storage.getItem(`nasan_reviews_${product.id}`);
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
        saveProduct: async (product) => {
            const idx = products.findIndex((p) => p.id === product.id);
            if (idx >= 0) products[idx] = product;
            else products.push(product);
            persist();
            return enrichWithReviews(product, storage);
        },
        deleteProduct: async (id) => {
            products = products.filter((p) => p.id !== id);
            persist();
        },
        toggleProductActive: async (id) => {
            const p = products.find((x) => x.id === id);
            if (p) {
                p.isActive = !p.isActive;
                persist();
            }
            return p ? enrichWithReviews(p, storage) : null;
        },
        decrementStock: async (items = []) => {
            for (const item of items) {
                const p = products.find((x) => x.id === item.productId);
                if (p) p.stock = Math.max(0, p.stock - item.quantity);
            }
            persist();
        },
    };
};
