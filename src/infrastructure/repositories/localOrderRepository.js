// Implementación de OrderRepository sobre un Storage (localStorage en el navegador).
// Útil en modo demo: los pedidos quedan en el dispositivo.

const KEY = 'ap_orders';

/**
 * @param {Storage} storage
 * @param {{
 *   onSaved?: (order: Object) => Promise<void>,
 *   onWompiApproved?: (order: Object) => Promise<void>,
 *   onPaymentApproved?: (order: Object) => Promise<void>
 * }} [hooks]
 * @returns {import('@/application/ports.js').OrderRepository}
 */
export const createLocalOrderRepository = (storage = globalThis.localStorage, { onSaved, onWompiApproved, onPaymentApproved } = {}) => {
    const readAll = () => {
        try {
            return JSON.parse(storage?.getItem(KEY) ?? '[]');
        } catch {
            return [];
        }
    };

    const writeAll = (orders) => {
        try {
            storage?.setItem(KEY, JSON.stringify(orders.slice(0, 200)));
        } catch (error) {
            console.warn('No se pudieron guardar los pedidos localmente:', error);
        }
    };

    return {
        save: async (order) => {
            const saved = { ...order, id: order.code, paymentStatus: order.paymentStatus || 'pending' };
            writeAll([saved, ...readAll()]);
            // En Wompi, el inventario NO se descuenta al abrir la pasarela, sino únicamente cuando el pago es aprobado
            if (saved.paymentMethod !== 'wompi' || saved.paymentStatus === 'APPROVED') {
                await onSaved?.(saved);
                if (saved.paymentStatus === 'APPROVED') {
                    await onPaymentApproved?.(saved);
                }
            }
            return saved;
        },
        findByCode: async (code) => readAll().find((o) => o.code === code) ?? null,
        findAll: async () => readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        updateStatus: async (code, status) => {
            writeAll(readAll().map((o) => (o.code === code ? { ...o, status } : o)));
        },
        updateWompiPayment: async (code, transactionId, status) => {
            const all = readAll();
            const existing = all.find((o) => o.code === code);
            const isFirstApproval = existing && status === 'APPROVED' && existing.paymentStatus !== 'APPROVED';

            if (isFirstApproval) {
                await (onWompiApproved || onSaved)?.(existing);
            }

            const updatedList = all.map((o) =>
                o.code === code
                    ? {
                        ...o,
                        wompiTransactionId: transactionId,
                        paymentStatus: status,
                        status: status === 'APPROVED' ? 'confirmed' : status === 'DECLINED' || status === 'ERROR' ? 'cancelled' : o.status,
                    }
                    : o
            );

            writeAll(updatedList);

            if (isFirstApproval) {
                const updated = updatedList.find((o) => o.code === code);
                if (updated) {
                    await onPaymentApproved?.(updated);
                }
            }
        },
        updateShippingGuide: async (code, shippingData) => {
            const all = readAll();
            writeAll(
                all.map((o) =>
                    o.code === code
                        ? {
                            ...o,
                            shippingCarrier: shippingData.carrier,
                            shippingGuideNumber: shippingData.guideNumber,
                            shippingLabelUrl: shippingData.labelUrl,
                            shippingStatus: shippingData.status || 'generada',
                            shippingTrackingUrl: shippingData.trackingUrl,
                            shippingData: shippingData.raw || shippingData,
                            shippingError: null,
                            status: o.status === 'pending' || o.status === 'confirmed' ? 'shipped' : o.status,
                        }
                        : o
                )
            );
        },
        updateShippingError: async (code, error) => {
            const all = readAll();
            writeAll(all.map((o) => (o.code === code ? { ...o, shippingError: error } : o)));
        },
    };
};
