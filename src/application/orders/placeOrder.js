// Caso de uso: confirmar un pedido.
// 1) Revalida precios y stock contra el repositorio (el carrito del navegador no es fuente de verdad).
// 2) Construye el pedido con las reglas del dominio.
// 3) Lo persiste y devuelve el enlace para confirmarlo por WhatsApp.
import { buildOrder } from '@/domain/orders/order.js';
import { getFinalPrice } from '@/domain/catalog/product.js';

/**
 * @param {{
 *   productRepository: import('../ports.js').ProductRepository,
 *   orderRepository: import('../ports.js').OrderRepository,
 *   notificationGateway: import('../ports.js').NotificationGateway,
 *   clock?: () => Date,
 * }} deps
 */
export const makePlaceOrder = ({ productRepository, orderRepository, notificationGateway, clock = () => new Date() }) =>
    async ({ items, customer, paymentMethod, couponCode, discountPct }) => {
        const products = await productRepository.findByIds(items.map((i) => i.productId));
        const byId = new Map(products.map((p) => [p.id, p]));

        const verifiedItems = items.map((item) => {
            const product = byId.get(item.productId);
            if (!product) throw new Error(`"${item.name}" ya no está disponible`);
            return {
                ...item,
                unitPrice: getFinalPrice(product),
                stock: product.stock,
                hasFreeShipping: product.hasFreeShipping,
                shippingCost: product.shippingCost,
            };
        });

        const order = buildOrder({ items: verifiedItems, customer, paymentMethod, couponCode, discountPct, now: clock() });
        const saved = await orderRepository.save(order);

        return {
            order: saved,
            confirmationUrl: notificationGateway.buildOrderMessageUrl(saved),
        };
    };

/** @param {{ orderRepository: import('../ports.js').OrderRepository }} deps */
export const makeGetOrder = ({ orderRepository }) => (code) => orderRepository.findByCode(code);
