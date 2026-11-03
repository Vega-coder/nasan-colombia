import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryProductRepository } from '@/infrastructure/repositories/inMemoryProductRepository.js';
import { createLocalOrderRepository } from '@/infrastructure/repositories/localOrderRepository.js';
import { makePlaceOrder } from '@/application/orders/placeOrder.js';
import { createWhatsappGateway } from '@/infrastructure/gateways/whatsappGateway.js';

const memoryStorage = () => {
    const data = new Map();
    return {
        getItem: (k) => data.get(k) ?? null,
        setItem: (k, v) => data.set(k, v),
        removeItem: (k) => data.delete(k),
    };
};

const customer = {
    fullName: 'Carlos Gómez',
    email: 'carlos@test.com',
    phone: '3001234567',
    city: 'Bogotá',
    address: 'Calle 100 # 15-20',
};

const TEST_PRODUCT = {
    id: 'lattafa-asad-100',
    name: 'Asad',
    brand: 'Lattafa',
    gender: 'hombre',
    price: 210000,
    discountPercent: 0,
    stock: 10,
    notes: ['Pimienta negra', 'Café', 'Tabaco'],
    images: ['/images/asad.png'],
    isActive: true,
};

describe('Blindaje de Flujo de Stock con Wompi', () => {
    let productRepo;
    let orderRepo;
    let placeOrder;

    beforeEach(() => {
        productRepo = createInMemoryProductRepository([TEST_PRODUCT], memoryStorage());
        orderRepo = createLocalOrderRepository(memoryStorage(), {
            onSaved: (order) => productRepo.decrementStock(order.items),
            onWompiApproved: (order) => productRepo.decrementStock(order.items),
        });
        placeOrder = makePlaceOrder({
            productRepository: productRepo,
            orderRepository: orderRepo,
            notificationGateway: createWhatsappGateway('573000000000'),
        });
    });

    it('NO descuenta inventario si el cliente solo abre Wompi o cierra el modal sin pagar', async () => {
        // Stock inicial
        const initial = await productRepo.findById('lattafa-asad-100');
        expect(initial.stock).toBe(10);

        // Cliente llega al checkout y hace clic en "Pagar con Wompi" (se crea el pedido)
        const { order } = await placeOrder({
            items: [{ productId: 'lattafa-asad-100', name: 'Asad', quantity: 2 }],
            customer,
            paymentMethod: 'wompi',
        });

        // Simulación: El modal de Wompi se abre pero el cliente lo cierra (CANCELLED_BY_USER)
        // El stock en la tienda DEBE seguir intacto en 10
        const stockAfterOpeningModal = await productRepo.findById('lattafa-asad-100');
        expect(stockAfterOpeningModal.stock).toBe(10);

        // El pedido queda en estado pendiente sin haber afectado el inventario
        const savedOrder = await orderRepo.findByCode(order.code);
        expect(savedOrder.status).toBe('pending');
        expect(savedOrder.paymentStatus).toBe('pending');
    });

    it('NO descuenta inventario si la transacción es RECHAZADA (DECLINED) o con ERROR', async () => {
        const { order } = await placeOrder({
            items: [{ productId: 'lattafa-asad-100', name: 'Asad', quantity: 3 }],
            customer,
            paymentMethod: 'wompi',
        });

        // Wompi procesa la tarjeta y el banco la declina
        await orderRepo.updateWompiPayment(order.code, 'tx_declined_123', 'DECLINED');

        // El stock DEBE permanecer en 10 intacto
        const stockAfterDecline = await productRepo.findById('lattafa-asad-100');
        expect(stockAfterDecline.stock).toBe(10);

        // La orden se marca cancelada
        const savedOrder = await orderRepo.findByCode(order.code);
        expect(savedOrder.status).toBe('cancelled');
        expect(savedOrder.paymentStatus).toBe('DECLINED');
    });

    it('DESCUENTA inventario ÚNICAMENTE cuando la transacción es APROBADA (APPROVED)', async () => {
        const { order } = await placeOrder({
            items: [{ productId: 'lattafa-asad-100', name: 'Asad', quantity: 2 }],
            customer,
            paymentMethod: 'wompi',
        });

        // Antes de aprobar: 10 unidades
        expect((await productRepo.findById('lattafa-asad-100')).stock).toBe(10);

        // Wompi confirma pago exitoso
        await orderRepo.updateWompiPayment(order.code, 'tx_approved_999', 'APPROVED');

        // Stock ahora se descuenta a 8 unidades
        const stockAfterApproval = await productRepo.findById('lattafa-asad-100');
        expect(stockAfterApproval.stock).toBe(8);

        // La orden pasa a confirmada
        const savedOrder = await orderRepo.findByCode(order.code);
        expect(savedOrder.status).toBe('confirmed');
        expect(savedOrder.paymentStatus).toBe('APPROVED');
    });

    it('Evita doble descuento si Wompi notifica dos veces (Idempotencia)', async () => {
        const { order } = await placeOrder({
            items: [{ productId: 'lattafa-asad-100', name: 'Asad', quantity: 1 }],
            customer,
            paymentMethod: 'wompi',
        });

        // Primera notificación APPROVED (del widget en el frontend)
        await orderRepo.updateWompiPayment(order.code, 'tx_approved_123', 'APPROVED');
        expect((await productRepo.findById('lattafa-asad-100')).stock).toBe(9);

        // Segunda notificación APPROVED (por ejemplo reintento o webhook)
        await orderRepo.updateWompiPayment(order.code, 'tx_approved_123', 'APPROVED');
        
        // El stock NO debe descontarse dos veces, sigue en 9
        expect((await productRepo.findById('lattafa-asad-100')).stock).toBe(9);
    });

    it('Si el cliente cancela un intento pero reintenta y paga, descuenta solo una vez al pagar exitosamente', async () => {
        // Intento 1: Abre Wompi pero cierra el modal
        const { order } = await placeOrder({
            items: [{ productId: 'lattafa-asad-100', name: 'Asad', quantity: 2 }],
            customer,
            paymentMethod: 'wompi',
        });
        expect((await productRepo.findById('lattafa-asad-100')).stock).toBe(10);

        // Intento 2: El cliente vuelve a intentar desde su pedido y ahora sí aprueba
        await orderRepo.updateWompiPayment(order.code, 'tx_final_ok', 'APPROVED');

        // Solo ahora se descuenta el stock
        expect((await productRepo.findById('lattafa-asad-100')).stock).toBe(8);
    });
});
