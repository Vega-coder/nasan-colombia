import { describe, it, expect, beforeEach } from 'vitest';
import { calculatePackageSpecs, validateShippingOrder, CARRIERS } from '@/domain/orders/shipping.js';
import { buildShippingLabelHtml } from '@/domain/orders/shippingLabel.js';
import { createShippingGateway } from '@/infrastructure/gateways/shippingGateway.js';
import { createLocalOrderRepository } from '@/infrastructure/repositories/localOrderRepository.js';
import { makeGenerateShippingGuide, makeGetShippingTracking } from '@/application/orders/shippingUseCases.js';

const memoryStorage = () => {
    const data = new Map();
    return {
        getItem: (k) => data.get(k) ?? null,
        setItem: (k, v) => data.set(k, v),
        removeItem: (k) => data.delete(k),
    };
};

const mockOrder = {
    code: 'AP-261026-X7Y8',
    status: 'confirmed',
    paymentMethod: 'wompi',
    paymentStatus: 'APPROVED',
    total: 359800,
    subtotal: 359800,
    shipping: 0,
    customer: {
        fullName: 'Carlos Alberto Valencia',
        email: 'carlos@empresa.com',
        phone: '3157891234',
        city: 'Bogotá',
        address: 'Carrera 7 # 71-21 Torre A Apto 802',
        notes: 'Dejar en portería si no responden',
    },
    items: [
        { productId: 'lattafa-yara-100', name: 'Yara', brand: 'Lattafa', quantity: 2, unitPrice: 179900 },
    ],
    createdAt: '2026-10-26T10:00:00.000Z',
};

describe('Módulo de Envíos y Transportadoras', () => {
    let orderRepository;
    let shippingGateway;
    let generateGuide;
    let getTracking;

    beforeEach(async () => {
        const storage = memoryStorage();
        orderRepository = createLocalOrderRepository(storage);
        shippingGateway = createShippingGateway({ apiKey: '' });
        generateGuide = makeGenerateShippingGuide({ orderRepository, shippingGateway });
        getTracking = makeGetShippingTracking({ orderRepository, shippingGateway });

        // Guardar pedido base para las pruebas
        await orderRepository.save(mockOrder);
    });

    it('Requisito 4: Calcula automáticamente peso, dimensiones, valor declarado y contenido', () => {
        const specs = calculatePackageSpecs(mockOrder);

        // 2 unidades de perfume
        expect(specs.totalUnits).toBe(2);
        // Mínimo reglamentario 1kg
        expect(specs.weightKg).toBeGreaterThanOrEqual(1);
        // Dimensiones estándar para 2 botellas
        expect(specs.lengthCm).toBe(22);
        expect(specs.widthCm).toBe(18);
        expect(specs.heightCm).toBe(15);
        // Valor declarado coincide con el total
        expect(specs.declaredValue).toBe(359800);
        // Resumen del contenido
        expect(specs.contentDescription).toContain('2x Lattafa Yara');
    });

    it('Requisito 1 & 5: Genera la guía con la transportadora elegida y devuelve número y tracking', async () => {
        const result = await generateGuide({
            orderCode: mockOrder.code,
            carrierId: 'coordinadora',
        });

        expect(result.shipping.carrier).toBe('Coordinadora Mercantil');
        expect(result.shipping.guideNumber).toMatch(/^COORD-\d{7}$/);
        expect(result.shipping.trackingUrl).toContain('coordinadora.com/rastreo');
        expect(result.shipping.status).toBe('generada');

        // Verifica que se guardó en el repositorio
        const updated = await orderRepository.findByCode(mockOrder.code);
        expect(updated.shippingCarrier).toBe('Coordinadora Mercantil');
        expect(updated.shippingGuideNumber).toBe(result.shipping.guideNumber);
        expect(updated.status).toBe('shipped');
    });

    it('Requisito 7: Previene guías duplicadas en el mismo pedido', async () => {
        // Primera generación exitosa
        await generateGuide({
            orderCode: mockOrder.code,
            carrierId: 'servientrega',
        });

        // Intentar generar nuevamente sobre el mismo pedido debe fallar
        await expect(
            generateGuide({
                orderCode: mockOrder.code,
                carrierId: 'envia',
            })
        ).rejects.toThrow(/ya tiene asignada la guía.*No se pueden generar guías duplicadas/);
    });

    it('Requisito 7: Valida los datos obligatorios del destinatario y rechaza si están incompletos', () => {
        const invalidOrder = {
            code: 'AP-BAD',
            customer: { fullName: '', phone: '123', address: '', city: '' },
        };
        const errors = validateShippingOrder(invalidOrder);
        expect(errors.fullName).toBeDefined();
        expect(errors.phone).toBeDefined();
        expect(errors.address).toBeDefined();
        expect(errors.city).toBeDefined();
    });

    it('Requisito 6: Permite consultar el seguimiento de un envío despachado', async () => {
        await generateGuide({
            orderCode: mockOrder.code,
            carrierId: 'tcc',
        });

        const tracking = await getTracking(mockOrder.code);
        expect(tracking.hasGuide).toBe(true);
        expect(tracking.carrier).toBe('TCC');
        expect(tracking.guideNumber).toMatch(/^TCC-\d{7}$/);
        expect(tracking.trackingUrl).toContain('tcc.com.co');
    });

    it('Requisito 5 & Etiqueta: Genera el HTML de la etiqueta oficial con código de barras y datos de entrega', () => {
        const html = buildShippingLabelHtml({
            order: mockOrder,
            shippingData: {
                carrier: 'Servientrega',
                guideNumber: 'SERVI-8492019',
                specs: calculatePackageSpecs(mockOrder),
            },
            sender: {
                name: 'Aroma Premium Colombia',
                address: 'Calle 10 # 43E-20, El Poblado',
                city: 'Medellín, Antioquia',
                nit: '901.458.291-3',
                phone: '3146160642',
            },
        });

        expect(html).toContain('Servientrega');
        expect(html).toContain('SERVI-8492019');
        expect(html).toContain('Carlos Alberto Valencia');
        expect(html).toContain('Bogotá');
        expect(html).toContain('Aroma Premium Colombia');
        expect(html).toContain('FRÁGIL');
        expect(html).toContain('<svg'); // Código de barras SVG
    });

    it('Requisito 2 & Auto-despacho: Auto-genera la guía al confirmar el pago por Wompi', async () => {
        let autoGeneratedOrder = null;

        const autoStorage = memoryStorage();
        let autoRepo;

        autoRepo = createLocalOrderRepository(autoStorage, {
            onPaymentApproved: async (order) => {
                const autoGuideFn = makeGenerateShippingGuide({
                    orderRepository: autoRepo,
                    shippingGateway,
                });
                autoGeneratedOrder = await autoGuideFn({
                    orderCode: order.code,
                    carrierId: 'coordinadora',
                });
            },
        });

        // Crear pedido pendiente
        const initial = await autoRepo.save({
            ...mockOrder,
            code: 'AP-AUTO-001',
            status: 'pending',
            paymentStatus: 'pending',
            shippingGuideNumber: undefined,
        });
        expect(initial.shippingGuideNumber).toBeUndefined();

        // Wompi aprueba el pago
        await autoRepo.updateWompiPayment('AP-AUTO-001', 'tx_wompi_approved_777', 'APPROVED');

        // La guía debió generarse automáticamente apenas se confirmó el pago
        expect(autoGeneratedOrder).not.toBeNull();
        expect(autoGeneratedOrder.shipping.guideNumber).toMatch(/^COORD-\d{7}$/);

        const saved = await autoRepo.findByCode('AP-AUTO-001');
        expect(saved.shippingGuideNumber).toBe(autoGeneratedOrder.shipping.guideNumber);
        expect(saved.status).toBe('shipped');
    });
});
