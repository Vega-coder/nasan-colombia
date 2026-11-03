// Entidad Carrito: funciones puras e inmutables. El estado lo guarda la capa de presentación.
import { getFinalPrice } from '../catalog/product.js';

export const FREE_SHIPPING_THRESHOLD = 250000;
export const SHIPPING_COST = 15000;
export const MAX_QTY_PER_ITEM = 10;

/**
 * @typedef {Object} CartItem
 * @property {string} productId
 * @property {string} slug
 * @property {string} name
 * @property {string} brand
 * @property {number} unitPrice   Precio final con descuento al momento de agregar
 * @property {number} quantity
 * @property {number} stock
 * @property {{ from: string, to: string, liquid: string }} palette
 * @property {string|null} image
 */

const clampQty = (qty, stock) => Math.max(0, Math.min(qty, MAX_QTY_PER_ITEM, stock));

/** @returns {CartItem[]} */
export const addItem = (items, product, quantity = 1) => {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
        return items.map((i) =>
            i.productId === product.id ? { ...i, quantity: clampQty(i.quantity + quantity, product.stock) } : i,
        );
    }
    const qty = clampQty(quantity, product.stock);
    if (qty === 0) return items;
    return [
        ...items,
        {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            unitPrice: getFinalPrice(product),
            quantity: qty,
            stock: product.stock,
            palette: product.palette,
            image: product.images[0] ?? null,
            hasFreeShipping: Boolean(product.hasFreeShipping),
            shippingCost: product.hasFreeShipping ? 0 : Math.max(0, Number(product.shippingCost) || 0),
        },
    ];
};

export const updateQuantity = (items, productId, quantity) =>
    items
        .map((i) => (i.productId === productId ? { ...i, quantity: clampQty(quantity, i.stock) } : i))
        .filter((i) => i.quantity > 0);

export const removeItem = (items, productId) => items.filter((i) => i.productId !== productId);

export const countItems = (items) => items.reduce((sum, i) => sum + i.quantity, 0);

export const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    // Si el carrito está vacío o supera el umbral general de envío gratis de la tienda:
    if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) {
        return {
            subtotal,
            shipping: 0,
            total: subtotal,
            missingForFreeShipping: 0,
        };
    }

    // Costo de envío según los productos en el carrito:
    // Si un producto tiene envío gratis (hasFreeShipping o shippingCost <= 0), no cobra envío.
    // Si tiene costo de envío específico, se aplica el mayor valor configurado entre los productos del pedido.
    // Si ningún producto tiene costo de envío configurado, el envío es $0 (no cobra envío).
    const costs = items.map((i) => (i.hasFreeShipping || !i.shippingCost || i.shippingCost <= 0 ? 0 : Number(i.shippingCost)));
    const shipping = costs.length > 0 ? Math.max(0, ...costs) : 0;

    return {
        subtotal,
        shipping,
        total: subtotal + shipping,
        missingForFreeShipping: shipping === 0 ? 0 : Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    };
};
