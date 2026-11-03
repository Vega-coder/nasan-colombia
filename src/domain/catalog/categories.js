// Catálogo maestro de categorías, líneas y clasificaciones técnicas para NASAN Colombia.

export const GENDER = Object.freeze({
    MACHINERY: 'maquinaria',
    TOOLS: 'herramientas',
    SUPPLIES: 'insumos',
    WOMEN: 'mujer',
    MEN: 'hombre',
    UNISEX: 'unisex',
});

export const PRODUCT_TYPE = Object.freeze({
    MACHINERY: 'maquinaria',
    TOOLS: 'herramientas',
    SUPPLIES: 'insumos',
    BATTERIES: 'baterias',
    FRAGRANCE: 'fragancia',
    DECANT: 'muestra',
    GIFT_SET: 'set',
    ACCESSORY: 'accesorio',
});

export const CONCENTRATION = Object.freeze({
    PRO: { id: 'pro', label: 'Línea Profesional' },
    INDUSTRIAL: { id: 'industrial', label: 'Uso Industrial' },
    STANDARD: { id: 'standard', label: 'Taller / Laboratorio' },
    PARFUM: { id: 'parfum', label: 'Parfum' },
    EDP: { id: 'edp', label: 'Eau de Parfum' },
    EDT: { id: 'edt', label: 'Eau de Toilette' },
    EDC: { id: 'edc', label: 'Eau de Cologne' },
});

export const getConcentrationLabel = (id) =>
    Object.values(CONCENTRATION).find((c) => c.id === id)?.label ?? 'Línea Profesional';

// Categorías que se muestran en la navegación y en los círculos del home.
export const CATEGORIES = Object.freeze([
    { slug: 'maquinaria', label: 'Maquinaria', short: 'Maquinaria', filter: { type: PRODUCT_TYPE.MACHINERY }, description: 'Laminadoras, prensas y autoclaves eliminadoras de burbujas' },
    { slug: 'herramientas', label: 'Herramientas', short: 'Herramientas', filter: { type: PRODUCT_TYPE.TOOLS }, description: 'Planchas 360, separadoras de display y destornilladores' },
    { slug: 'insumos', label: 'Insumos', short: 'Insumos', filter: { type: PRODUCT_TYPE.SUPPLIES }, description: 'Hilos para glass, paños cleanroom y consumibles' },
    { slug: 'baterias', label: 'Baterías', short: 'Baterías', filter: { type: PRODUCT_TYPE.BATTERIES }, description: 'Baterías premium de alta capacidad y cero ciclos' },
    { slug: 'novedades', label: 'Novedades', short: 'Novedades', filter: { isNew: true }, description: 'Lo más nuevo de NASAN para tu laboratorio técnico' },
    { slug: 'ofertas', label: 'Ofertas', short: 'Ofertas', filter: { onSale: true }, description: 'Precios especiales en maquinaria y equipamiento' },
]);

export const getCategoryBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug) ?? null;
