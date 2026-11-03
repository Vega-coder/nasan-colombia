// Entidad y reglas de negocio para el programa de afiliados (Aroma Premium Partners)

export const AFFILIATE_TIERS = Object.freeze({
    PRINCIPIANTE: {
        id: 'principiante',
        label: 'Principiante',
        defaultCommissionPct: 5,
        defaultDiscountPct: 3,
        minSales: 0,
    },
    INTERMEDIO: {
        id: 'intermedio',
        label: 'Intermedio',
        defaultCommissionPct: 7,
        defaultDiscountPct: 5,
        minSales: 15,
    },
    ALTO_RENDIMIENTO: {
        id: 'alto_rendimiento',
        label: 'Alto Rendimiento',
        defaultCommissionPct: 10,
        defaultDiscountPct: 5,
        minSales: 40,
    },
});

export const COMMISSION_STATUS = Object.freeze({
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PAID: 'paid',
    CANCELLED: 'cancelled',
});

export const COMMISSION_STATUS_LABELS = Object.freeze({
    pending: 'Pendiente de pago',
    confirmed: 'Confirmada (En retención)',
    paid: 'Pagada',
    cancelled: 'Cancelada',
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^3\d{9}$/;
const COUPON_RE = /^[A-Z0-9]{3,15}$/;

/**
 * Valida los datos de registro de un influencer aspirante.
 */
export const validateAffiliateRegistration = (data = {}) => {
    const errors = {};
    const fullName = String(data.fullName ?? '').trim();
    const email = String(data.email ?? '').trim().toLowerCase();
    const phone = String(data.phone ?? '').replace(/\D/g, '');
    const socialHandle = String(data.socialHandle ?? '').trim();
    const couponCode = String(data.couponCode ?? '').trim().toUpperCase();

    if (!fullName || fullName.length < 3) errors.fullName = 'Ingresa tu nombre completo';
    if (!EMAIL_RE.test(email)) errors.email = 'Correo electrónico inválido';
    if (!PHONE_RE.test(phone)) errors.phone = 'Celular de 10 dígitos (iniciando en 3)';
    if (!socialHandle || socialHandle.length < 2) errors.socialHandle = 'Ingresa tu usuario en redes sociales';
    if (!COUPON_RE.test(couponCode)) {
        errors.couponCode = 'El código debe tener entre 3 y 15 letras o números sin espacios ni símbolos';
    }

    return errors;
};

/**
 * Normaliza un código de cupón para comparaciones seguras.
 */
export const normalizeCoupon = (code) => {
    if (!code || typeof code !== 'string') return '';
    return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Normaliza celulares colombianos removiendo caracteres no numéricos y prefijo 57.
 */
export const normalizePhone = (phone) => {
    const digits = String(phone ?? '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('57')) return digits.slice(2);
    return digits;
};

/**
 * Regla anti-fraude: previene que un influencer gane comisiones comprando con sus propios datos.
 */
export const isSelfPurchase = (affiliate = {}, customer = {}) => {
    if (!affiliate?.email || !customer?.email) return false;
    const affEmail = affiliate.email.trim().toLowerCase();
    const custEmail = customer.email.trim().toLowerCase();
    if (affEmail === custEmail) return true;

    const affPhone = normalizePhone(affiliate.phone);
    const custPhone = normalizePhone(customer.phone);
    if (affPhone && custPhone && affPhone === custPhone) return true;

    return false;
};

/**
 * Calcula la comisión sobre el subtotal neto (después de descuento y sin costo de envío).
 */
export const calculateAffiliateCommission = (subtotalNet, commissionPct) => {
    const validSubtotal = Math.max(0, Number(subtotalNet) || 0);
    const validPct = Math.max(0, Math.min(50, Number(commissionPct) || 0));
    return Math.round(validSubtotal * (validPct / 100));
};

/**
 * Calcula el descuento al cliente derivado del cupón del influencer.
 */
export const calculateCustomerDiscount = (subtotal, discountPct) => {
    const validSubtotal = Math.max(0, Number(subtotal) || 0);
    const validPct = Math.max(0, Math.min(50, Number(discountPct) || 0));
    return Math.round(validSubtotal * (validPct / 100));
};
