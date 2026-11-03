// Dominio de Familias y Especialidades Técnicas de NASAN Colombia.

export const TECH_SPECIALTIES = Object.freeze([
    {
        slug: 'remanufactura',
        name: 'Remanufactura & Prensado',
        title: 'PRENSADO & LAMINACIÓN',
        tag: 'Prensado 110V/220V y Laminación 3D',
        description: 'Maquinaria de vanguardia para prensado al vacío, laminación 3D Soft y remanufactura de cristales.',
        image: '/images/products/na-cln-main.png',
        keywords: ['prensa', 'prensado', 'laminadora', 'laminacion', 'remanufactura', 'cln'],
    },
    {
        slug: 'pantallas',
        name: 'Separación de Pantallas',
        title: 'PLANCHAS & SEPARADORAS',
        tag: 'Planchas 360 y Separadoras Display',
        description: 'Separación térmica y micrométrica de pantallas planas, curvas OLED y displays de iPhone 12 al 17PM.',
        image: '/images/products/na-sp23-ultra-main.png',
        keywords: ['plancha', 'separador', 'separadora', 'display', '360', 'sp23', 'fr01n'],
    },
    {
        slug: 'autoclaves',
        name: 'Eliminación de Burbujas',
        title: 'AUTOCLAVES & BURBUJAS',
        tag: 'Compresor Integrado 550W y Control Táctil',
        description: 'Cámaras presurizadas con compresor integrado sin aceite para acabado libre de burbujas en cristales.',
        image: '/images/products/na-b2-plus-main.png',
        keywords: ['burbuja', 'burbujas', 'autoclave', 'compresor', 'na-b2', 'removedor'],
    },
    {
        slug: 'insumos',
        name: 'Insumos & Limpieza',
        title: 'INSUMOS & LIMPIEZA',
        tag: 'Hilos Tungsteno y Paños Cleanroom',
        description: 'Consumibles de grado industrial: alambre de molibdeno 0.035mm y paños estériles anti-pelusa.',
        image: '/images/products/clean-room-wipers-main.png',
        keywords: ['hilo', 'paño', 'wipers', 'limpieza', 'alambre', 'glass', 'molibdeno'],
    },
    {
        slug: 'herramientas',
        name: 'Herramientas de Precisión',
        title: 'DESTORNILLADORES & AJUSTE',
        tag: 'Acero S2 y Rodamiento 360°',
        description: 'Puntas magnéticas de ultra precisión, control de torque y máxima comodidad en cada apertura.',
        image: '/images/products/destornillador-nasan-main.png',
        keywords: ['destornillador', 'precision', 'herramienta', 'punta', 'torque'],
    },
    {
        slug: 'baterias',
        name: 'Baterías & Energía',
        title: 'BATERÍAS PREMIUM',
        tag: '0 Ciclos y Cobalto Puro',
        description: 'Celdas de cobalto 100% puro con microcontrolador TI y máxima estabilidad de carga.',
        image: '/images/products/bateria-nasan.png',
        keywords: ['bateria', 'baterias', 'amperaje', 'cobalto', 'ciclos'],
    },
]);

export const AROMAS = Object.freeze([
    {
        slug: 'avainillados',
        name: 'Avainillados',
        title: 'AVAINILLADOS',
        tag: 'Vainilla Bourbon & Haba Tonka',
        description: 'Notas cálidas y envolventes.',
        image: '/images/products/na-cln-main.png',
        keywords: ['vainilla', 'vanilla', 'avainillad'],
    },
    {
        slug: 'citricos',
        name: 'Cítricos',
        title: 'CÍTRICOS',
        tag: 'Bergamota & Limón',
        description: 'Frescura e higiene técnica.',
        image: '/images/products/clean-room-wipers-main.png',
        keywords: ['citric', 'bergamota', 'limon', 'lima', 'citricos'],
    },
    {
        slug: 'amaderados',
        name: 'Amaderados',
        title: 'AMADERADOS',
        tag: 'Oud & Sándalo',
        description: 'Porte y durabilidad.',
        image: '/images/products/destornillador-nasan-main.png',
        keywords: ['madera', 'amaderad', 'oud', 'cedro'],
    },
    {
        slug: 'florales',
        name: 'Florales',
        title: 'FLORALES',
        tag: 'Rosa & Lavanda',
        description: 'Equilibrio y estética.',
        image: '/images/products/na-sp23-ultra-main.png',
        keywords: ['flor', 'floral', 'rosa', 'lavanda', 'jazmin'],
    },
    {
        slug: 'almizclados',
        name: 'Almizclados',
        title: 'ALMIZCLADOS',
        tag: 'Almizcle Blanco',
        description: 'Pureza y limpieza.',
        image: '/images/products/clean-room-wipers-main.png',
        keywords: ['almizcle', 'musk'],
    },
    {
        slug: 'especiados',
        name: 'Especiados',
        title: 'ESPECIADOS',
        tag: 'Canela & Pimienta',
        description: 'Intensidad.',
        image: '/images/products/na-fr01n-main.png',
        keywords: ['especi', 'canela', 'pimienta'],
    },
    {
        slug: 'dulces',
        name: 'Dulces',
        title: 'DULCES',
        tag: 'Gourmand & Caramelo',
        description: 'Suavidad.',
        image: '/images/products/hilo-para-glass-main.png',
        keywords: ['dulce', 'dulces', 'caramelo'],
    },
    {
        slug: 'afrutados',
        name: 'Afrutados',
        title: 'AFRUTADOS',
        tag: 'Frutas Exóticas',
        description: 'Vitalidad.',
        image: '/images/products/bateria-nasan.png',
        keywords: ['frutal', 'afrutad', 'manzana'],
    },
]);

export const getAromaBySlug = (slug = '') => {
    const s = String(slug || '').trim().toLowerCase();
    const foundSpecialty = TECH_SPECIALTIES.find((t) => t.slug.toLowerCase() === s);
    if (foundSpecialty) return foundSpecialty;
    return AROMAS.find((a) => a.slug.toLowerCase() === s) ?? null;
};
