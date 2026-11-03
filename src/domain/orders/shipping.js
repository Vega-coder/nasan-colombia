// Entidades y reglas de negocio para envíos y transportadoras en Colombia.

export const CARRIERS = Object.freeze([
    {
        id: 'coordinadora',
        name: 'Coordinadora Mercantil',
        shortName: 'Coordinadora',
        prefix: 'COORD',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        trackingUrl: (guide) => `https://coordinadora.com/rastreo/guia/${encodeURIComponent(guide)}`,
    },
    {
        id: 'servientrega',
        name: 'Servientrega',
        shortName: 'Servientrega',
        prefix: 'SERVI',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        trackingUrl: (guide) => `https://www.servientrega.com/wps/portal/rastreo-envio?id=${encodeURIComponent(guide)}`,
    },
    {
        id: 'envia',
        name: 'Envía Colvanes',
        shortName: 'Envía',
        prefix: 'ENVIA',
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        trackingUrl: (guide) => `https://envia.co/seguimiento?guia=${encodeURIComponent(guide)}`,
    },
    {
        id: 'interrapidisimo',
        name: 'Inter Rapidísimo',
        shortName: 'Inter Rapidísimo',
        prefix: 'INTER',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        trackingUrl: (guide) => `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${encodeURIComponent(guide)}`,
    },
    {
        id: 'tcc',
        name: 'TCC',
        shortName: 'TCC',
        prefix: 'TCC',
        badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
        trackingUrl: (guide) => `https://tcc.com.co/logistica/rastrear-envio/?guia=${encodeURIComponent(guide)}`,
    },
]);

export const DEFAULT_CARRIER_ID = 'coordinadora';

export const getCarrierById = (carrierId) => {
    return CARRIERS.find((c) => c.id === carrierId || c.shortName.toLowerCase() === String(carrierId).toLowerCase()) || CARRIERS[0];
};

export const SHIPPING_STATUS = Object.freeze({
    PENDING: 'pendiente',
    GENERATED: 'generada',
    IN_TRANSIT: 'en_transito',
    OUT_FOR_DELIVERY: 'en_reparto',
    DELIVERED: 'entregada',
    ISSUE: 'novedad',
});

export const SHIPPING_STATUS_LABELS = Object.freeze({
    pendiente: 'Pendiente de guía',
    generada: 'Guía generada',
    en_transito: 'En tránsito',
    en_reparto: 'En reparto',
    entregada: 'Entregada',
    novedad: 'Novedad en entrega',
});

/**
 * Calcula automáticamente las dimensiones y peso del paquete según los productos del pedido.
 * Un perfume de lujo con caja y empaque de burbuja pesa aprox. 0.4kg.
 * Las transportadoras en Colombia tasan peso mínimo de 1 kg.
 *
 * @param {Object} order
 * @returns {{
 *   weightKg: number,
 *   lengthCm: number,
 *   widthCm: number,
 *   heightCm: number,
 *   declaredValue: number,
 *   contentDescription: string,
 *   totalUnits: number
 * }}
 */
export const calculatePackageSpecs = (order = {}) => {
    const items = order.items || [];
    const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) || 1;

    // Peso real y peso facturable (mínimo 1 kg reglamentario)
    const rawWeight = totalUnits * 0.4;
    const weightKg = Math.max(1, Math.round(rawWeight * 10) / 10);

    // Dimensiones en cm según cantidad de botellas
    let lengthCm = 15;
    let widthCm = 15;
    let heightCm = 15;

    if (totalUnits >= 4) {
        lengthCm = 30;
        widthCm = 25;
        heightCm = 20;
    } else if (totalUnits >= 2) {
        lengthCm = 22;
        widthCm = 18;
        heightCm = 15;
    }

    // Descripción del contenido
    const contentDescription = items.length > 0
        ? items.map((i) => `${i.quantity}x ${i.brand || ''} ${i.name || 'Perfume'}`.trim()).join(', ')
        : 'Fragancias y perfumería fina';

    // Valor declarado (por defecto el total del pedido)
    const declaredValue = Number(order.total) || Number(order.subtotal) || 100000;

    return {
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        declaredValue,
        contentDescription,
        totalUnits,
    };
};

/**
 * Valida los datos necesarios para generar una guía de transporte.
 * Previene guías duplicadas y datos de entrega incompletos.
 *
 * @param {Object} order
 * @returns {Record<string, string>} Mapa de errores (vacío si es válido)
 */
export const validateShippingOrder = (order = {}) => {
    const errors = {};

    if (!order) {
        errors.order = 'El pedido no existe';
        return errors;
    }

    // Control de errores: Prevenir guías duplicadas (Requisito 7)
    if (order.shippingGuideNumber) {
        errors.duplicate = `El pedido ${order.code} ya tiene la guía asignada ${order.shippingGuideNumber} (${order.shippingCarrier || 'Transportadora'}). No se permiten guías duplicadas.`;
        return errors;
    }

    const customer = order.customer || {};
    if (!customer.fullName || customer.fullName.trim().length < 3) {
        errors.fullName = 'Nombre del destinatario requerido';
    }

    const phone = String(customer.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 7) {
        errors.phone = 'Teléfono de contacto del destinatario inválido';
    }

    if (!customer.address || customer.address.trim().length < 5) {
        errors.address = 'Dirección de destino completa requerida';
    }

    if (!customer.city || customer.city.trim().length < 2) {
        errors.city = 'Ciudad de destino requerida';
    }

    return errors;
};
