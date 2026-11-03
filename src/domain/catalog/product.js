// Entidad Producto: normaliza datos crudos (de cualquier fuente) a una forma única
// y expone reglas de negocio puras sobre ella.
import { applyDiscount } from '../shared/money.js';
import { GENDER, PRODUCT_TYPE } from './categories.js';
import { AROMAS } from './aromas.js';

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} brand
 * @property {string} description
 * @property {'mujer'|'hombre'|'unisex'} gender
 * @property {'fragancia'|'set'|'accesorio'} type
 * @property {string|null} concentration
 * @property {number|null} volumeMl
 * @property {number} price             Precio de lista en COP
 * @property {number} discountPercent
 * @property {number} stock
 * @property {string[]} [aromas]        Familias olfativas / Aromas vinculados
 * @property {string[]} notes           Notas olfativas consolidadas
 * @property {string[]} [topNotes]      Notas de salida (primeros aromas percibidos)
 * @property {string[]} [heartNotes]    Notas de corazón (cuerpo y personalidad)
 * @property {string[]} [baseNotes]     Notas de fondo / base (fijación y profundidad)
 * @property {string[]} images
 * @property {{ from: string, to: string, liquid: string }} palette  Colores para la ilustración del frasco
 * @property {boolean} isNew
 * @property {boolean} isFeatured
 * @property {boolean} isActive      Si es false no se muestra en la tienda
 * @property {string} createdAt
 */

const DEFAULT_PALETTE = { from: '#1A1816', to: '#0B0B0B', liquid: '#C6A15B' };

export const slugify = (text = '') =>
    text
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const splitNotesIntoPyramid = (notes = []) => {
    if (!Array.isArray(notes) || notes.length === 0) {
        return { top: [], heart: [], base: [] };
    }
    const len = notes.length;
    if (len === 1) {
        return { top: [notes[0]], heart: [notes[0]], base: [notes[0]] };
    }
    if (len === 2) {
        return { top: [notes[0]], heart: [notes[0]], base: [notes[1]] };
    }
    if (len === 3) {
        return { top: [notes[0]], heart: [notes[1]], base: [notes[2]] };
    }
    if (len === 4) {
        return { top: [notes[0]], heart: [notes[1]], base: [notes[2], notes[3]] };
    }
    if (len === 5) {
        return { top: [notes[0], notes[1]], heart: [notes[2]], base: [notes[3], notes[4]] };
    }
    if (len === 6) {
        return { top: [notes[0], notes[1]], heart: [notes[2], notes[3]], base: [notes[4], notes[5]] };
    }
    if (len === 7) {
        return { top: [notes[0], notes[1], notes[2]], heart: [notes[3], notes[4]], base: [notes[5], notes[6]] };
    }
    const topCount = Math.ceil(len / 3);
    const heartCount = Math.round((len - topCount) / 2);
    return {
        top: notes.slice(0, topCount),
        heart: notes.slice(topCount, topCount + heartCount),
        base: notes.slice(topCount + heartCount),
    };
};

/** @returns {Product} */
export const createProduct = (raw = {}) => {
    const name = String(raw.name ?? '').trim();
    if (!name) throw new Error('El producto debe tener nombre');

    const price = Math.round(Number(raw.price));
    if (!Number.isFinite(price) || price < 0) throw new Error(`Precio inválido para "${name}"`);

    // Reseñas dinámicas (provenientes de la tabla product_reviews)
    const reviews = Array.isArray(raw.reviews) ? raw.reviews : [];
    const reviewsCount = Number(raw.reviewsCount ?? raw.reviews_count ?? reviews.length) || 0;
    let ratingAverage = raw.ratingAverage ?? raw.rating_average ?? null;
    if (ratingAverage == null && reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
        ratingAverage = Number((sum / reviews.length).toFixed(1));
    } else if (ratingAverage != null) {
        ratingAverage = Number(Number(ratingAverage).toFixed(1));
    }

    // Normalización de notas y familias olfativas
    const normalizeNotesList = (val) => {
        if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
        if (typeof val === 'string' && val.trim()) {
            return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
    };

    const normalizeAromas = (val) => {
        if (Array.isArray(val)) return val.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
        if (typeof val === 'string' && val.trim()) {
            return val.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        }
        return [];
    };

    let aromas = normalizeAromas(raw.aromas ?? raw.olfactory_families);
    const rawNotes = normalizeNotesList(raw.notes);

    // Si no se pasaron aromas explícitos, deducir de rawNotes si trae tags aroma:slug o nombres de familias
    if (aromas.length === 0 && rawNotes.length > 0) {
        for (const n of rawNotes) {
            if (n.startsWith('aroma:')) {
                const slug = n.replace('aroma:', '').toLowerCase();
                if (!aromas.includes(slug)) aromas.push(slug);
            } else {
                const found = AROMAS.find((a) => a.name.toLowerCase() === n.toLowerCase() || a.slug === n.toLowerCase());
                if (found && !aromas.includes(found.slug)) {
                    aromas.push(found.slug);
                }
            }
        }
    }

    // Filtrar notas generales para no ensuciar con etiquetas internas de aromas
    const cleanRawNotes = rawNotes.filter((n) => {
        if (n.startsWith('aroma:')) return false;
        const isAromaName = AROMAS.some((a) => a.name.toLowerCase() === n.toLowerCase() || a.slug === n.toLowerCase());
        return !isAromaName;
    });

    // Mapear cada aroma a su nombre legible (ej. 'amaderados' -> 'Amaderados')
    const aromaNames = aromas.map((slug) => {
        const found = AROMAS.find((a) => a.slug === slug);
        return found ? found.name : slug;
    });

    let topNotes = normalizeNotesList(raw.topNotes ?? raw.top_notes);
    let heartNotes = normalizeNotesList(raw.heartNotes ?? raw.heart_notes);
    let baseNotes = normalizeNotesList(raw.baseNotes ?? raw.base_notes);

    // Si los campos de la pirámide vienen vacíos de la base de datos pero existen notas generales,
    // deducimos automáticamente las 3 etapas (salida, corazón, base) para que ningún producto quede plano.
    if (topNotes.length === 0 && heartNotes.length === 0 && baseNotes.length === 0 && cleanRawNotes.length > 0) {
        const derived = splitNotesIntoPyramid(cleanRawNotes);
        topNotes = derived.top;
        heartNotes = derived.heart;
        baseNotes = derived.base;
    }

    // Notas consolidadas para búsqueda, filtros y badges
    const consolidatedNotes = Array.from(new Set([
        ...topNotes,
        ...heartNotes,
        ...baseNotes,
        ...cleanRawNotes,
        ...aromaNames,
        ...aromas.map((s) => `aroma:${s}`),
    ]));

    // Configuración de envío por producto (Envío gratis o costo específico)
    const rawShippingCost = raw.shippingCost ?? raw.shipping_cost;
    const shippingCost = rawShippingCost != null && rawShippingCost !== '' ? Math.max(0, Number(rawShippingCost) || 0) : 0;
    const hasFreeShipping = raw.hasFreeShipping !== undefined
        ? Boolean(raw.hasFreeShipping)
        : raw.has_free_shipping !== undefined
        ? Boolean(raw.has_free_shipping)
        : (shippingCost === 0);

    return {
        id: String(raw.id ?? slugify(`${raw.brand ?? ''}-${name}`)),
        slug: raw.slug || slugify(`${raw.brand ?? ''} ${name}`),
        name,
        brand: String(raw.brand ?? 'NASAN').trim(),
        description: raw.description ?? '',
        gender: Object.values(GENDER).includes(raw.gender) ? raw.gender : GENDER.UNISEX,
        type: Object.values(PRODUCT_TYPE).includes(raw.type) ? raw.type : PRODUCT_TYPE.FRAGRANCE,
        concentration: raw.concentration ?? null,
        volumeMl: raw.volumeMl ?? raw.volume_ml ?? null,
        price,
        discountPercent: Number(raw.discountPercent ?? raw.discount_percent ?? 0) || 0,
        badges: Array.isArray(raw.badges) ? raw.badges : [],
        priceTag: raw.priceTag || null,
        stock: Math.max(0, Number(raw.stock ?? 0) || 0),
        hasFreeShipping,
        shippingCost: hasFreeShipping ? 0 : shippingCost,
        aromas,
        notes: consolidatedNotes,
        topNotes,
        heartNotes,
        baseNotes,
        images: Array.isArray(raw.images) ? raw.images.filter(Boolean) : [],
        palette: { ...DEFAULT_PALETTE, ...(raw.palette ?? {}) },
        isNew: Boolean(raw.isNew ?? raw.is_new),
        isFeatured: Boolean(raw.isFeatured ?? raw.is_featured),
        isActive: (raw.isActive ?? raw.is_active) !== false,
        reviewsCount,
        ratingAverage,
        createdAt: raw.createdAt ?? raw.created_at ?? new Date(0).toISOString(),
    };
};

export const LOW_STOCK_THRESHOLD = 3;

/**
 * Valida los datos que llegan del formulario de administración.
 * @returns {Record<string, string>} errores por campo; vacío si es válido
 */
export const validateProductInput = (input = {}) => {
    const errors = {};
    if (!String(input.name ?? '').trim()) errors.name = 'El nombre es obligatorio';
    if (!String(input.brand ?? '').trim()) errors.brand = 'La marca es obligatoria';
    const price = Number(input.price);
    if (!Number.isFinite(price) || price <= 0) errors.price = 'Ingresa un precio mayor a 0';
    const discount = Number(input.discountPercent ?? 0);
    if (!Number.isFinite(discount) || discount < 0 || discount > 90) errors.discountPercent = 'Entre 0 y 90';
    const stock = Number(input.stock);
    if (input.stock === '' || !Number.isInteger(stock) || stock < 0) errors.stock = 'Número entero mayor o igual a 0';
    if (input.volumeMl !== '' && input.volumeMl != null && !(Number(input.volumeMl) > 0)) errors.volumeMl = 'Debe ser mayor a 0';
    if (!Object.values(GENDER).includes(input.gender)) errors.gender = 'Selecciona un género';
    if (!Object.values(PRODUCT_TYPE).includes(input.type)) errors.type = 'Selecciona un tipo';
    if (!input.hasFreeShipping && input.shippingCost !== '' && input.shippingCost != null) {
        const sc = Number(input.shippingCost);
        if (!Number.isFinite(sc) || sc < 0) errors.shippingCost = 'Debe ser un número mayor o igual a 0';
    }
    return errors;
};

export const getFinalPrice = (product) => applyDiscount(product.price, product.discountPercent);

export const isOnSale = (product) => product.discountPercent > 0;

export const isInStock = (product, quantity = 1) => product.stock >= quantity;

export const getStockLabel = (product) => {
    if (product.stock <= 0) return 'Agotado';
    if (product.stock <= LOW_STOCK_THRESHOLD) return `¡Solo quedan ${product.stock}!`;
    return 'Disponible';
};
