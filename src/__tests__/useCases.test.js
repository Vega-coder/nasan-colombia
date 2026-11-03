import { describe, it, expect, vi } from 'vitest';
import { createInMemoryProductRepository } from '@/infrastructure/repositories/inMemoryProductRepository.js';
import { createLocalOrderRepository } from '@/infrastructure/repositories/localOrderRepository.js';
import { createWhatsappGateway } from '@/infrastructure/gateways/whatsappGateway.js';
import { createDemoAuthGateway } from '@/infrastructure/gateways/authGateways.js';
import { makeBrowseCatalog, makeGetProductDetail } from '@/application/catalog/catalogUseCases.js';
import { makePlaceOrder } from '@/application/orders/placeOrder.js';
import {
    makeSignInCustomer, makeSignUpCustomer, makeGetCurrentUser,
    makeResetPassword, makeUpdatePassword,
} from '@/application/auth/authUseCases.js';
import { createProduct } from '@/domain/catalog/product.js';
import { SEED_PRODUCTS } from '@/infrastructure/data/seedProducts.js';

const memoryStorage = () => {
    const data = new Map();
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};

const productRepository = createInMemoryProductRepository([
    ...SEED_PRODUCTS,
    createProduct({ id: 'nasan-agotado', name: 'Agotado Test', brand: 'NASAN', price: 100000, stock: 0 }),
]);
const customer = { fullName: 'Luis Pérez', email: 'luis@correo.com', phone: '3157654321', city: 'Bogotá', address: 'Cra 7 # 72-41' };

describe('Casos de uso del catálogo', () => {
    const browse = makeBrowseCatalog({ productRepository });

    it('filtra por categoría', async () => {
        const { products } = await browse({ category: 'maquinaria' });
        expect(products.length).toBeGreaterThan(0);
        expect(products.every((p) => p.type === 'maquinaria')).toBe(true);
    });

    it('filtra por aroma / familia olfativa', async () => {
        const { products } = await browse({ aroma: 'remanufactura' });
        expect(products.length).toBeGreaterThan(0);
    });

    it('expone las marcas de la categoría aunque haya filtro de marca', async () => {
        const { products, brands } = await browse({ category: 'maquinaria', brands: ['NASAN'] });
        expect(products.every((p) => p.brand === 'NASAN')).toBe(true);
        expect(brands.length).toBeGreaterThanOrEqual(1);
    });

    it('devuelve detalle y relacionados', async () => {
        const getDetail = makeGetProductDetail({ productRepository });
        const { product, related } = await getDetail('nasan-na-cln');
        expect(product.name).toContain('NA - CLN');
        expect(related.find((p) => p.id === product.id)).toBeUndefined();
        expect((await getDetail('no-existe')).product).toBeNull();
    });

    it('resuelve producto por ID o slug flexible para evitar errores 404', async () => {
        const getDetail = makeGetProductDetail({ productRepository });
        const { product: byId } = await getDetail('nasan-na-cln');
        expect(byId?.name).toContain('NA - CLN');

        const { product: sp23 } = await getDetail('nasan-na-sp23-ultra');
        expect(sp23?.name).toContain('NA - SP23');

        const { product: byPartial } = await getDetail('supa-lite-pro');
        expect(byPartial?.name).toContain('SUPA LITE');
    });
});

describe('placeOrder', () => {
    const orderRepository = createLocalOrderRepository(memoryStorage());
    const placeOrder = makePlaceOrder({
        productRepository,
        orderRepository,
        notificationGateway: createWhatsappGateway('573001112233'),
        clock: () => new Date('2026-10-18T10:00:00Z'),
    });

    it('usa el precio del repositorio, no el que viene del navegador', async () => {
        const items = [{ productId: 'nasan-na-cln', name: 'NA - CLN', brand: 'NASAN', unitPrice: 1, quantity: 1, stock: 99 }];
        const { order, confirmationUrl } = await placeOrder({ items, customer, paymentMethod: 'wompi' });
        expect(order.items[0].unitPrice).toBe(1530000);
        expect(confirmationUrl).toContain('https://wa.me/573001112233');
        expect(await orderRepository.findByCode(order.code)).toMatchObject({ code: order.code });
    });

    it('rechaza productos agotados', async () => {
        const items = [{ productId: 'nasan-agotado', name: 'Agotado Test', brand: 'NASAN', unitPrice: 1, quantity: 1, stock: 5 }];
        await expect(placeOrder({ items, customer, paymentMethod: 'wompi' })).rejects.toThrow('stock');
    });

    it('rechaza productos que ya no existen', async () => {
        const save = vi.fn();
        const place = makePlaceOrder({ productRepository, orderRepository: { save }, notificationGateway: createWhatsappGateway('57') });
        const items = [{ productId: 'fantasma', name: 'Fantasma', quantity: 1 }];
        await expect(place({ items, customer, paymentMethod: 'wompi' })).rejects.toThrow('disponible');
        expect(save).not.toHaveBeenCalled();
    });
});

describe('Autenticación de clientes', () => {
    const authGateway = createDemoAuthGateway({ email: 'admin@aroma.test', password: 'admin-password', storage: memoryStorage() });
    const signUp = makeSignUpCustomer({ authGateway });
    const signIn = makeSignInCustomer({ authGateway });
    const getCurrentUser = makeGetCurrentUser({ authGateway });

    it('registra un nuevo cliente con datos válidos', async () => {
        const user = await signUp({
            fullName: 'Camila Morales',
            email: 'camila@correo.com',
            phone: '3009876543',
            password: 'clave-segura-123',
        });
        expect(user).toMatchObject({
            email: 'camila@correo.com',
            fullName: 'Camila Morales',
            role: 'customer',
            isAdmin: false,
        });
    });

    it('rechaza registros con contraseña corta o sin nombre', async () => {
        await expect(signUp({ fullName: '', email: 'a@b.com', password: '123456' })).rejects.toThrow('nombre');
        await expect(signUp({ fullName: 'Pedro', email: 'a@b.com', password: '123' })).rejects.toThrow('6 caracteres');
    });

    it('inicia sesión con el cliente registrado', async () => {
        const user = await signIn('CAMILA@correo.com ', 'clave-segura-123');
        expect(user.fullName).toBe('Camila Morales');
        expect(await getCurrentUser()).toMatchObject({ email: 'camila@correo.com' });
    });

    it('solicita restablecimiento de contraseña validando el correo', async () => {
        const resetPassword = makeResetPassword({ authGateway });
        await expect(resetPassword('')).rejects.toThrow('correo electrónico válido');
        await expect(resetPassword('invalido')).rejects.toThrow('correo electrónico válido');

        const result = await resetPassword('camila@correo.com');
        expect(result).toMatchObject({ success: true });
    });

    it('actualiza la contraseña validando longitud mínima', async () => {
        const updatePassword = makeUpdatePassword({ authGateway });
        await expect(updatePassword('12345')).rejects.toThrow('al menos 6 caracteres');

        const res = await updatePassword('nueva-clave-segura');
        expect(res).toMatchObject({ success: true });
    });
});
