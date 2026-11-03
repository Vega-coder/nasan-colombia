// Generador de resumen compacto del catálogo en tiempo real para el Asesor Virtual IA (RAG Dinámico en memoria).
import { getFinalPrice } from './product.js';
import { formatMoney } from '../shared/money.js';

/**
 * Convierte el catálogo de productos activos en un resumen markdown optimizado para contexto LLM.
 * @param {import('./product.js').Product[]} products
 * @returns {string}
 */
export const buildCatalogSummary = (products = []) => {
    if (!Array.isArray(products) || products.length === 0) return '';

    return products
        .filter((p) => p && p.isActive !== false)
        .map((p) => {
            const finalPrice = getFinalPrice(p);
            const formattedPrice = `${formatMoney(finalPrice)} COP`;
            const isOutOfStock = Number(p.stock || 0) <= 0;
            const stockStatus = isOutOfStock ? '[AGOTADO TEMPORALMENTE]' : `En stock (${p.stock} unid.)`;
            const families = (p.aromas || []).length > 0 ? `Familias: ${(p.aromas || []).join(', ')}` : '';
            const keyNotes = (p.notes || []).slice(0, 6).join(', ');
            const freeShip = p.hasFreeShipping ? ' · Envío GRATIS' : '';
            const discount = Number(p.discountPercent || 0) > 0 ? ` · ${p.discountPercent}% OFF` : '';

            const parts = [
                `- **${p.brand} - ${p.name}** (${p.gender || 'unisex'})`,
                formattedPrice + discount,
                stockStatus + freeShip,
                families,
                keyNotes ? `Notas: ${keyNotes}` : '',
                `Link: [Ver ${p.name}](/producto/${p.slug})`,
            ].filter(Boolean);

            return parts.join(' | ');
        })
        .join('\n');
};
