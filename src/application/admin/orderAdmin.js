// Casos de uso de administración de pedidos y del tablero.
import { canTransition, ORDER_STATUS_LABELS } from '@/domain/orders/order.js';
import { summarizeSales } from '@/domain/orders/stats.js';

/** @param {{ orderRepository: import('../ports.js').OrderRepository }} deps */
export const makeListOrders = ({ orderRepository }) => async ({ status } = {}) => {
    const orders = await orderRepository.findAll();
    return status ? orders.filter((o) => o.status === status) : orders;
};

/** @param {{ orderRepository: import('../ports.js').OrderRepository }} deps */
export const makeChangeOrderStatus = ({ orderRepository }) => async (code, nextStatus) => {
    const order = await orderRepository.findByCode(code);
    if (!order) throw new Error('Pedido no encontrado');
    if (!canTransition(order.status, nextStatus)) {
        throw new Error(`No se puede pasar de "${ORDER_STATUS_LABELS[order.status]}" a "${ORDER_STATUS_LABELS[nextStatus]}"`);
    }
    await orderRepository.updateStatus(code, nextStatus);
    return { ...order, status: nextStatus };
};

/**
 * @param {{ orderRepository: import('../ports.js').OrderRepository, productRepository: import('../ports.js').ProductRepository }} deps
 */
export const makeGetDashboard = ({ orderRepository, productRepository }) => async () => {
    const [orders, products] = await Promise.all([orderRepository.findAll(), productRepository.findAllForAdmin()]);
    return {
        ...summarizeSales(orders, products),
        productCount: products.filter((p) => p.isActive).length,
    };
};
