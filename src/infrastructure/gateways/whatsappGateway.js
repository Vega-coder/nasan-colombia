// NotificationGateway: arma el mensaje de WhatsApp con el resumen del pedido.
import { formatMoney } from '@/domain/shared/money.js';
import { PAYMENT_METHODS } from '@/domain/orders/order.js';

/** @returns {import('@/application/ports.js').NotificationGateway} */
export const createWhatsappGateway = (storePhone) => ({
    buildOrderMessageUrl: (order) => {
        const payment = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label ?? order.paymentMethod;
        const lines = [
            `Hola Aroma Premium ✨, acabo de hacer el pedido *${order.code}*`,
            '',
            ...order.items.map((i) => `• ${i.quantity} × ${i.brand} ${i.name} — ${formatMoney(i.lineTotal)}`),
            '',
            `Subtotal: ${formatMoney(order.subtotal)}`,
            `Envío: ${order.shipping ? formatMoney(order.shipping) : 'Gratis'}`,
            `*Total: ${formatMoney(order.total)}*`,
            `Pago: ${payment}`,
            '',
            `${order.customer.fullName} · ${order.customer.phone}`,
            `${order.customer.address}, ${order.customer.city}`,
        ];
        return `https://wa.me/${storePhone}?text=${encodeURIComponent(lines.join('\n'))}`;
    },
    // Desde el panel admin: la tienda le escribe al cliente sobre su pedido.
    buildCustomerMessageUrl: (order) => {
        const first = order.customer.fullName.split(' ')[0];
        const text = `Hola ${first}, te escribimos de Aroma Premium ✨ sobre tu pedido *${order.code}* por ${formatMoney(order.total)}.`;
        const digits = String(order.customer.phone || '').replace(/\D/g, '');
        const phoneWithCountry = digits.startsWith('57') ? digits : `57${digits}`;
        return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    },
});
