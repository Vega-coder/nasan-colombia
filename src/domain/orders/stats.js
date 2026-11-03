// Métricas del panel de administración. Funciones puras sobre pedidos y productos.
import { ORDER_STATUS } from './order.js';
import { LOW_STOCK_THRESHOLD } from '../catalog/product.js';

const isCountable = (order) => order.status !== ORDER_STATUS.CANCELLED;

export const summarizeSales = (orders = [], products = []) => {
    const valid = orders.filter(isCountable);
    const revenue = valid.reduce((sum, o) => sum + o.total, 0);

    const unitsByProduct = new Map();
    for (const order of valid) {
        for (const item of order.items) {
            const prev = unitsByProduct.get(item.productId) ?? { name: `${item.brand} ${item.name}`, units: 0, revenue: 0 };
            unitsByProduct.set(item.productId, {
                ...prev,
                units: prev.units + item.quantity,
                revenue: prev.revenue + item.lineTotal,
            });
        }
    }

    return {
        revenue,
        orderCount: valid.length,
        averageTicket: valid.length ? Math.round(revenue / valid.length) : 0,
        pendingCount: orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
        topProducts: [...unitsByProduct.entries()]
            .map(([productId, data]) => ({ productId, ...data }))
            .sort((a, b) => b.units - a.units)
            .slice(0, 5),
        lowStock: products
            .filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD)
            .sort((a, b) => a.stock - b.stock),
        recentOrders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    };
};
