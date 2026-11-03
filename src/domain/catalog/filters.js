// Reglas puras de filtrado, búsqueda y ordenamiento del catálogo.
import { getFinalPrice, isOnSale } from './product.js';
import { formatMoney } from '../shared/money.js';
import { getAromaBySlug } from './aromas.js';

export const SORT_OPTIONS = Object.freeze([
    { id: 'featured', label: 'Destacados' },
    { id: 'newest', label: 'Más recientes' },
    { id: 'price-asc', label: 'Precio: menor a mayor' },
    { id: 'price-desc', label: 'Precio: mayor a menor' },
    { id: 'name', label: 'Nombre A-Z' },
]);

export const PRICE_RANGES = Object.freeze([
    { id: '0-50000', label: `Hasta ${formatMoney(50000)}`, min: 0, max: 50000 },
    { id: '50000-500000', label: `${formatMoney(50000)} – ${formatMoney(500000)}`, min: 50000, max: 500000 },
    { id: '500000-1500000', label: `${formatMoney(500000)} – ${formatMoney(1500000)}`, min: 500000, max: 1500000 },
    { id: '1500000-', label: `Más de ${formatMoney(1500000)}`, min: 1500000, max: null },
]);

const normalize = (text = '') =>
    text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const matchesQuery = (product, query) => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const haystack = normalize([product.name, product.brand, product.description, ...product.notes].join(' '));
    return terms.every((term) => haystack.includes(term));
};

export const matchesAroma = (product, aromaSlug) => {
    if (!aromaSlug) return true;
    const aroma = getAromaBySlug(aromaSlug);
    if (!aroma) return true;
    const targetSlug = aromaSlug.toLowerCase();
    if (Array.isArray(product.aromas) && product.aromas.some((s) => String(s).toLowerCase() === targetSlug)) {
        return true;
    }
    const haystack = normalize([product.name, product.brand, product.description, ...(product.notes || [])].join(' '));
    return aroma.keywords.some((kw) => haystack.includes(normalize(kw)));
};

/**
 * @param {import('./product.js').Product[]} products
 * @param {{ query?: string, aroma?: string, gender?: string, type?: string, brands?: string[],
 *           minPrice?: number, maxPrice?: number, onSale?: boolean, isNew?: boolean, inStock?: boolean }} criteria
 */
export const filterProducts = (products, criteria = {}) => {
    const { query, aroma, gender, type, brands, minPrice, maxPrice, onSale, isNew, inStock } = criteria;

    return products.filter((p) => {
        if (query && !matchesQuery(p, query)) return false;
        if (aroma && !matchesAroma(p, aroma)) return false;
        if (gender && p.gender !== gender) return false;
        if (type && p.type !== type) return false;
        if (brands?.length && !brands.includes(p.brand)) return false;
        const price = getFinalPrice(p);
        if (minPrice != null && price < minPrice) return false;
        if (maxPrice != null && price > maxPrice) return false;
        if (onSale && !isOnSale(p)) return false;
        if (isNew && !p.isNew) return false;
        if (inStock && p.stock <= 0) return false;
        return true;
    });
};

export const sortProducts = (products, sortId = 'featured') => {
    const list = [...products];
    switch (sortId) {
        case 'price-asc':
            return list.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
        case 'price-desc':
            return list.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
        case 'newest':
            return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        case 'name':
            return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        case 'featured':
        default:
            return list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }
};

export const getAvailableBrands = (products) =>
    [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'es'));

export const getAvailableBrandsByPopularity = (products) => {
    const counts = {};
    for (const p of products) {
        if (!p.brand) continue;
        counts[p.brand] = (counts[p.brand] || 0) + 1;
    }
    return Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b, 'es'));
};
