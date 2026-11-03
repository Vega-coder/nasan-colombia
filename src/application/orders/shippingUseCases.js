// Casos de uso para el módulo de envíos y guías de transporte.

import { calculatePackageSpecs, validateShippingOrder } from '@/domain/orders/shipping.js';
import { openShippingLabelWindow } from '@/domain/orders/shippingLabel.js';

/**
 * @param {{
 *   orderRepository: import('../ports.js').OrderRepository,
 *   shippingGateway: Object,
 * }} deps
 */
export const makeGenerateShippingGuide = ({ orderRepository, shippingGateway }) =>
    async ({ orderCode, carrierId = 'coordinadora', customSpecs } = {}) => {
        const order = await orderRepository.findByCode(orderCode);
        if (!order) {
            throw new Error(`El pedido ${orderCode} no fue encontrado.`);
        }

        // Control de errores: Prevenir guías duplicadas (Requisito 7)
        if (order.shippingGuideNumber) {
            throw new Error(
                `El pedido ${order.code} ya tiene asignada la guía ${order.shippingGuideNumber} (${order.shippingCarrier}). No se pueden generar guías duplicadas.`
            );
        }

        // Validar datos de destinatario (Requisito 4 y 7)
        const validation = validateShippingOrder(order);
        if (Object.keys(validation).length > 0) {
            throw new Error(Object.values(validation)[0]);
        }

        try {
            // Invocar la API de la transportadora (Mi Paquete / Envia.com o simulador con trazabilidad oficial)
            const result = await shippingGateway.generateGuide({
                order,
                carrierId,
                customSpecs,
            });

            // Guardar los datos de la guía en el repositorio (Requisitos 5 y 6)
            await orderRepository.updateShippingGuide(order.code, result);

            return {
                order: {
                    ...order,
                    shippingCarrier: result.carrier,
                    shippingGuideNumber: result.guideNumber,
                    shippingLabelUrl: result.labelUrl,
                    shippingStatus: result.status,
                    shippingTrackingUrl: result.trackingUrl,
                    shippingData: result.raw,
                    status: 'shipped',
                },
                shipping: result,
            };
        } catch (error) {
            // Registrar el error para visibilidad en el panel
            if (typeof orderRepository.updateShippingError === 'function') {
                await orderRepository.updateShippingError(order.code, error.message).catch(() => {});
            }
            throw error;
        }
    };

/**
 * @param {{
 *   orderRepository: import('../ports.js').OrderRepository,
 *   shippingGateway: Object,
 * }} deps
 */
export const makeGetShippingTracking = ({ orderRepository, shippingGateway }) =>
    async (orderCode) => {
        const order = await orderRepository.findByCode(orderCode);
        if (!order) throw new Error('Pedido no encontrado');
        if (!order.shippingGuideNumber) {
            return {
                hasGuide: false,
                status: 'Pendiente de despacho',
            };
        }

        const tracking = await shippingGateway.getTracking(order.shippingGuideNumber, order.shippingCarrier);
        return {
            hasGuide: true,
            carrier: order.shippingCarrier,
            guideNumber: order.shippingGuideNumber,
            trackingUrl: order.shippingTrackingUrl || tracking.trackingUrl,
            status: order.shippingStatus || 'generada',
            checkpoints: tracking.checkpoints || [],
        };
    };

/**
 * @param {{ shippingGateway: Object }} deps
 */
export const makePrintShippingLabel = ({ shippingGateway }) =>
    (order) => {
        if (!order) return;
        const shippingData = {
            carrier: order.shippingCarrier,
            guideNumber: order.shippingGuideNumber,
            labelUrl: order.shippingLabelUrl,
            specs: order.shippingData?.specs || calculatePackageSpecs(order),
        };
        openShippingLabelWindow({
            order,
            shippingData,
            sender: shippingGateway.senderInfo,
        });
    };
