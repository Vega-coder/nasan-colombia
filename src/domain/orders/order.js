// Entidad Pedido: estados, transiciones, métodos de pago y validación del cliente.
import { calculateTotals, FREE_SHIPPING_THRESHOLD } from '../cart/cart.js';

export const ORDER_STATUS = Object.freeze({
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
});

export const ORDER_STATUS_LABELS = Object.freeze({
    pending: 'Pendiente de confirmación',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
});

const TRANSITIONS = Object.freeze({
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
});

export const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;

export const getNextStatuses = (from) => TRANSITIONS[from] ?? [];

export const PAYMENT_METHODS = Object.freeze([
    {
        id: 'wompi',
        label: 'Paga online con Wompi (Bancolombia)',
        description: 'Tarjetas de crédito/débito, PSE (todos los bancos), Nequi y Botón Bancolombia.',
        badge: 'Recomendado',
    },
    {
        id: 'transfer',
        label: 'Transferencia Bancaria / Nequi / Bancolombia',
        description: 'Transfiere a nuestra cuenta oficial y envía el comprobante.',
    },
    {
        id: 'cod',
        label: 'Pago Contra Entrega',
        description: 'Paga en efectivo al recibir tu paquete en tu domicilio.',
    },
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^3\d{9}$/; // Celular colombiano

/**
 * @typedef {Object} Customer
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} city
 * @property {string} address
 * @property {string} [notes]
 */

/** @returns {Record<string, string>} errores por campo; vacío si es válido */
export const validateCustomer = (customer = {}) => {
    const errors = {};
    const phone = String(customer.phone ?? '').replace(/\D/g, '');
    if (!customer.fullName?.trim() || customer.fullName.trim().length < 3) errors.fullName = 'Ingresa tu nombre completo';
    if (!EMAIL_RE.test(customer.email ?? '')) errors.email = 'Correo electrónico inválido';
    if (!PHONE_RE.test(phone)) errors.phone = 'Celular de 10 dígitos que empiece por 3';
    if (!customer.city?.trim()) errors.city = 'Indica tu ciudad';
    if (!customer.address?.trim() || customer.address.trim().length < 6) errors.address = 'Indica una dirección válida';
    return errors;
};

export const generateOrderCode = (now = new Date(), random = Math.random) => {
    const date = now.toISOString().slice(2, 10).replace(/-/g, '');
    const suffix = Math.floor(random() * 36 ** 4).toString(36).toUpperCase().padStart(4, '0');
    return `AP-${date}-${suffix}`;
};

/**
 * Construye un pedido válido a partir del carrito. Lanza error si algo no cumple las reglas.
 * @param {{ items: import('../cart/cart.js').CartItem[], customer: Customer, paymentMethod: string, couponCode?: string, discountPct?: number, now?: Date, random?: () => number }} input
 */
export const buildOrder = ({ items, customer, paymentMethod, couponCode = null, discountPct = 0, now = new Date(), random = Math.random }) => {
    if (!items?.length) throw new Error('El carrito está vacío');

    const errors = validateCustomer(customer);
    if (Object.keys(errors).length) {
        const error = new Error('Datos del cliente incompletos');
        error.fields = errors;
        throw error;
    }

    if (!PAYMENT_METHODS.some((m) => m.id === paymentMethod)) throw new Error('Método de pago no válido');

    const outOfStock = items.find((i) => i.quantity > i.stock);
    if (outOfStock) throw new Error(`No hay suficiente stock de ${outOfStock.name}`);

    const baseTotals = calculateTotals(items);
    let discountAmount = 0;
    let finalShipping = baseTotals.shipping;
    let finalTotal = baseTotals.total;

    if (couponCode && discountPct > 0) {
        discountAmount = Math.round(baseTotals.subtotal * (discountPct / 100));
        const subtotalNet = Math.max(0, baseTotals.subtotal - discountAmount);
        if (subtotalNet >= FREE_SHIPPING_THRESHOLD) {
            finalShipping = 0;
        } else {
            const costs = items.map((i) => (i.hasFreeShipping || !i.shippingCost || i.shippingCost <= 0 ? 0 : Number(i.shippingCost)));
            finalShipping = costs.length > 0 ? Math.max(0, ...costs) : 0;
        }
        finalTotal = subtotalNet + finalShipping;
    }

    return {
        code: generateOrderCode(now, random),
        status: ORDER_STATUS.PENDING,
        paymentStatus: 'pending',
        customer: { ...customer, phone: String(customer.phone).replace(/\D/g, '') },
        paymentMethod,
        couponCode: couponCode ? String(couponCode).trim().toUpperCase() : null,
        discountAmount,
        items: items.map(({ productId, name, brand, unitPrice, quantity, hasFreeShipping, shippingCost }) => ({
            productId, name, brand, unitPrice, quantity, lineTotal: unitPrice * quantity,
            hasFreeShipping: Boolean(hasFreeShipping),
            shippingCost: Number(shippingCost) || 0,
        })),
        subtotal: baseTotals.subtotal,
        shipping: finalShipping,
        total: finalTotal,
        missingForFreeShipping: baseTotals.missingForFreeShipping,
        createdAt: now.toISOString(),
    };
};
