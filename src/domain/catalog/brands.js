// Dominio de marcas para tecnología y maquinaria de reparación móvil.
// NASAN Colombia By: Jordan Duran.

export const brandToSlug = (name = '') =>
    name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const KNOWN_BRAND_INFO = {
    'nasan': {
        name: 'NASAN',
        slug: 'nasan',
        country: 'Colombia · Distribución Oficial',
        founded: '2016',
        tagline: 'Maquinaria de alta precisión para remanufactura de pantallas',
        description: 'NASAN es el fabricante líder a nivel internacional en desarrollo de maquinaria inteligente para reparación, remanufactura de pantallas LCD/OLED, autoclaves removedores de burbujas, planchas térmicas 360 y herramientas de alta ingeniería para laboratorios de servicio técnico.',
    },
    'jordan-duran': {
        name: 'By: Jordan Duran',
        slug: 'jordan-duran',
        country: 'Colombia',
        founded: '2020',
        tagline: 'Garantía oficial y soporte técnico especializado',
        description: 'Línea oficial respaldada por Jordan Duran (@nasancolombia) con asesoría técnica personalizada, repuestos originales garantizados y envíos asegurados a todo el territorio colombiano.',
    },
    'lattafa': {
        name: 'Lattafa',
        slug: 'lattafa',
        country: 'Dubai, Emiratos Árabes Unidos',
        founded: '1980',
        tagline: 'Lujo oriental accesible y proyección legendaria',
        description: 'Lattafa Perfumes es una de las casas de perfumería más prestigiosas y reconocidas de los Emiratos Árabes Unidos.',
    },
};

export const getBrandMetadata = (brandNameOrSlug = '') => {
    const slug = brandToSlug(brandNameOrSlug);
    if (KNOWN_BRAND_INFO[slug]) {
        return KNOWN_BRAND_INFO[slug];
    }
    const cleanName = (brandNameOrSlug || 'NASAN').trim();
    return {
        name: cleanName,
        slug: slug || 'nasan',
        country: 'Emiratos Árabes Unidos',
        founded: '2020',
        tagline: 'Herramientas y equipamiento de alta precisión',
        description: `${cleanName} ofrece soluciones técnicas para talleres y laboratorios de reparación móvil con los más altos estándares de calidad y durabilidad.`,
    };
};

export const getBrandInfo = (nameOrSlug = '') => getBrandMetadata(nameOrSlug);

export const buildBrandsCatalog = (products = []) => {
    const brandMap = new Map();

    for (const p of products) {
        if (!p.brand) continue;
        const brandName = p.brand.trim();
        const slug = brandToSlug(brandName);

        if (!brandMap.has(slug)) {
            const meta = getBrandMetadata(brandName);
            brandMap.set(slug, {
                ...meta,
                name: brandName,
                slug,
                count: 0,
                genders: new Set(),
            });
        }

        const entry = brandMap.get(slug);
        entry.count += 1;
        if (p.gender) entry.genders.add(p.gender);
    }

    return Array.from(brandMap.values())
        .map((b) => ({
            ...b,
            productsCount: b.count,
            genders: Array.from(b.genders),
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
};

export const resolveBrandBySlug = (slug, products = []) => {
    const normalized = brandToSlug(slug);
    for (const p of products) {
        if (p.brand && brandToSlug(p.brand) === normalized) {
            return {
                ...getBrandMetadata(p.brand),
                name: p.brand,
                slug: normalized,
            };
        }
    }
    if (KNOWN_BRAND_INFO[normalized]) {
        return KNOWN_BRAND_INFO[normalized];
    }
    return null;
};

export const getAllKnownBrands = () => Object.values(KNOWN_BRAND_INFO);
