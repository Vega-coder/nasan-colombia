// Utilidades monetarias puras. Los precios se manejan siempre en pesos colombianos (enteros).

export const CURRENCY = 'COP';

const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
});

export const formatMoney = (amount) => formatter.format(Math.round(Number(amount) || 0));

export const applyDiscount = (price, discountPercent = 0) => {
    const pct = Math.min(Math.max(Number(discountPercent) || 0, 0), 90);
    return Math.round(price * (1 - pct / 100));
};
