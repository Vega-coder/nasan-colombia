// Casos de uso del catálogo. Reciben sus dependencias por inyección (ver infrastructure/container.js).
import { filterProducts, sortProducts, getAvailableBrands, getAvailableBrandsByPopularity } from '@/domain/catalog/filters.js';
import { getCategoryBySlug } from '@/domain/catalog/categories.js';
import { buildBrandsCatalog, resolveBrandBySlug, brandToSlug } from '@/domain/catalog/brands.js';

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeBrowseCatalog = ({ productRepository }) =>
    async ({ category, query, aroma, brands, minPrice, maxPrice, sort = 'featured' } = {}) => {
        const all = await productRepository.findAll();
        const categoryFilter = getCategoryBySlug(category)?.filter ?? {};
        const scoped = filterProducts(all, { ...categoryFilter, aroma });
        const filtered = filterProducts(scoped, { query, brands, minPrice, maxPrice });
        return {
            products: sortProducts(filtered, sort),
            // Las marcas disponibles se calculan sobre la categoría y aroma, no sobre el filtro de marcas,
            // para que el usuario pueda seguir marcando otras.
            brands: getAvailableBrands(scoped),
            total: filtered.length,
        };
    };

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeGetProductDetail = ({ productRepository }) =>
    async (slug) => {
        let product = await productRepository.findBySlug(slug);
        if (!product) {
            // Fallback 1: Buscar por ID directo en caso de enlaces con ID
            product = await productRepository.findById(slug);
        }
        if (!product) {
            // Fallback 2: Búsqueda flexible por tokens de marca y nombre
            const all = await productRepository.findAll();
            const cleanTarget = String(slug).toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const targetTokens = cleanTarget.split('-').filter((t) => t && !/^\d+$/.test(t));

            product = all.find((p) => {
                const sTokens = String(p.slug).toLowerCase().split('-');
                const idTokens = String(p.id).toLowerCase().split('-');
                const pTokens = new Set([...sTokens, ...idTokens]);
                return targetTokens.length > 0 && targetTokens.every((t) => pTokens.has(t));
            }) || null;
        }
        if (!product) return { product: null, related: [] };

        const all = await productRepository.findAll();
        const related = all
            .filter((p) => p.id !== product.id && (p.gender === product.gender || p.brand === product.brand))
            .slice(0, 4);
        return { product, related };
    };

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeGetHomeShowcase = ({ productRepository }) =>
    async () => {
        const all = await productRepository.findAll();
        const featured = all.filter((p) => p.isFeatured);
        return {
            featured: (featured.length ? featured : all).slice(0, 8),
            newArrivals: sortProducts(all.filter((p) => p.isNew), 'newest').slice(0, 4),
            brands: getAvailableBrandsByPopularity(all),
        };
    };

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeGetBrandsCatalog = ({ productRepository }) =>
    async () => {
        const all = await productRepository.findAll();
        const brands = buildBrandsCatalog(all);
        return {
            brands,
            totalBrands: brands.length,
            totalProducts: all.length,
        };
    };

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeGetBrandDetail = ({ productRepository }) =>
    async (brandSlug, { sort = 'featured' } = {}) => {
        const all = await productRepository.findAll();
        const brand = resolveBrandBySlug(brandSlug, all);
        if (!brand) return { brand: null, products: [], total: 0 };

        const brandProducts = all.filter((p) => p.brand && brandToSlug(p.brand) === brand.slug);
        return {
            brand,
            products: sortProducts(brandProducts, sort),
            total: brandProducts.length,
        };
    };
