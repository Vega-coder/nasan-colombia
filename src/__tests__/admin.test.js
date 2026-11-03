import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryProductRepository } from '@/infrastructure/repositories/inMemoryProductRepository.js';
import { createLocalOrderRepository } from '@/infrastructure/repositories/localOrderRepository.js';
import { createDemoAuthGateway } from '@/infrastructure/gateways/authGateways.js';
import { createWhatsappGateway } from '@/infrastructure/gateways/whatsappGateway.js';
import { makeSaveProduct, makeDeleteProduct, makeToggleProductActive, makeListProductsForAdmin } from '@/application/admin/productAdmin.js';
import { makeChangeOrderStatus, makeGetDashboard } from '@/application/admin/orderAdmin.js';
import { makeSignInAdmin, makeGetCurrentAdmin } from '@/application/auth/authUseCases.js';
import { makePlaceOrder } from '@/application/orders/placeOrder.js';
import { makeBrowseCatalog } from '@/application/catalog/catalogUseCases.js';
import { validateProductInput, createProduct } from '@/domain/catalog/product.js';
import { SEED_PRODUCTS } from '@/infrastructure/data/seedProducts.js';

const memoryStorage = () => {
    const data = new Map();
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
};

const customer = { fullName: 'Marta Ruiz', email: 'marta@correo.com', phone: '3101234567', city: 'Cali', address: 'Av 6N # 23-45' };

const validInput = {
    name: 'NA - CLN Test', brand: 'NASAN', gender: 'maquinaria', type: 'maquinaria', concentration: 'industrial',
    volumeMl: '', price: '1700000', discountPercent: '0', stock: '5', notes: 'Prensado, 110V', images: [],
    isActive: true, isFeatured: false, isNew: true,
};

let productRepository;
let orderRepository;

beforeEach(() => {
    productRepository = createInMemoryProductRepository([
        ...SEED_PRODUCTS,
        createProduct({ id: 'nasan-low-stock-test', name: 'Low Stock Test', brand: 'NASAN', price: 50000, stock: 0 }),
    ], memoryStorage());
    orderRepository = createLocalOrderRepository(memoryStorage(), { onSaved: (o) => productRepository.decrementStock(o.items) });
});

describe('Validación de producto', () => {
    it('acepta un producto completo', () => {
        expect(validateProductInput(validInput)).toEqual({});
    });
    it('marca precio, stock y descuento inválidos', () => {
        const errors = validateProductInput({ ...validInput, price: '0', stock: '-1', discountPercent: '95' });
        expect(errors).toMatchObject({
            price: expect.any(String),
            stock: expect.any(String),
            discountPercent: expect.any(String),
        });
    });
});

describe('Administración de productos (modo demo)', () => {
    it('crea un producto con notas e id derivado', async () => {
        const save = makeSaveProduct({ productRepository });
        const saved = await save(validInput);
        expect(saved.slug).toContain('nasan-na-cln-test');
        expect(saved.price).toBe(1700000);
        expect(saved.notes).toContain('Prensado');
    });

    it('permite guardar la pirámide olfativa por separado desde el admin (salida, corazón, base)', async () => {
        const save = makeSaveProduct({ productRepository });
        const saved = await save({
            ...validInput,
            name: 'NA - CLN Edición Pro',
            topNotes: '110V / 220V, Prensado',
            heartNotes: 'Manómetro digital',
            baseNotes: 'Chasis reforzado',
        });
        expect(saved.topNotes).toEqual(['110V / 220V', 'Prensado']);
        expect(saved.heartNotes).toEqual(['Manómetro digital']);
        expect(saved.baseNotes).toEqual(['Chasis reforzado']);
        expect(saved.notes).toContain('110V / 220V');
        expect(saved.notes).toContain('Chasis reforzado');
    });

    it('permite configurar si tiene envío gratis o costo específico de envío', async () => {
        const save = makeSaveProduct({ productRepository });
        const withFreeShipping = await save({
            ...validInput,
            name: 'Producto Con Envío Gratis',
            hasFreeShipping: true,
            shippingCost: '0',
        });
        expect(withFreeShipping.hasFreeShipping).toBe(true);
        expect(withFreeShipping.shippingCost).toBe(0);

        const withCustomCost = await save({
            ...validInput,
            name: 'Producto Con Tarifa',
            hasFreeShipping: false,
            shippingCost: '12000',
        });
        expect(withCustomCost.hasFreeShipping).toBe(false);
        expect(withCustomCost.shippingCost).toBe(12000);
    });

    it('permite vincular familias olfativas / aromas (amaderados, cítricos, etc.) y los preserva en el producto', async () => {
        const save = makeSaveProduct({ productRepository });
        const saved = await save({
            ...validInput,
            name: 'Equipo Especializado NASAN',
            brand: 'NASAN',
            aromas: ['amaderados', 'citricos'],
        });
        expect(saved.aromas).toEqual(['amaderados', 'citricos']);
        expect(saved.notes).toContain('Amaderados');
        expect(saved.notes).toContain('Cítricos');
        expect(saved.notes).toContain('aroma:amaderados');
        expect(saved.notes).toContain('aroma:citricos');
    });

    it('edita sin cambiar el slug publicado', async () => {
        const save = makeSaveProduct({ productRepository });
        const original = await productRepository.findById('nasan-na-cln');
        const saved = await save({ ...original, name: 'NA - CLN Edición Nueva', price: '1800000', stock: '4', notes: 'Prensado' });
        expect(saved.slug).toBe(original.slug);
        expect(saved.name).toBe('NA - CLN Edición Nueva');
    });

    it('rechaza duplicados y datos inválidos con errores por campo', async () => {
        const save = makeSaveProduct({ productRepository });
        await save(validInput);
        await expect(save(validInput)).rejects.toMatchObject({ fields: { name: 'Producto duplicado' } });
        await expect(save({ ...validInput, name: '' })).rejects.toMatchObject({ fields: { name: expect.any(String) } });
    });

    it('ocultar un producto lo saca de la tienda pero no del admin', async () => {
        await makeToggleProductActive({ productRepository })('nasan-na-cln');
        const { products } = await makeBrowseCatalog({ productRepository })({});
        expect(products.find((p) => p.id === 'nasan-na-cln')).toBeUndefined();
        const admin = await makeListProductsForAdmin({ productRepository })();
        expect(admin.find((p) => p.id === 'nasan-na-cln').isActive).toBe(false);
    });

    it('elimina un producto', async () => {
        await makeDeleteProduct({ productRepository })('nasan-bateria-titanium-pro');
        expect(await productRepository.findById('nasan-bateria-titanium-pro')).toBeNull();
    });
});

describe('Administración de pedidos', () => {
    const placeFirstOrder = () =>
        makePlaceOrder({ productRepository, orderRepository, notificationGateway: createWhatsappGateway('57') })({
            items: [{ productId: 'nasan-na-sp23-ultra', name: 'NA - SP23 ULTRA Plancha 360', brand: 'NASAN', quantity: 2 }],
            customer,
            paymentMethod: 'wompi',
        });

    it('descuenta stock en modo demo al confirmar el pago del pedido', async () => {
        const { order } = await placeFirstOrder();
        expect((await productRepository.findById('nasan-na-sp23-ultra')).stock).toBe(14);
        await orderRepository.updateWompiPayment(order.code, 'tx-test-123', 'APPROVED');
        expect((await productRepository.findById('nasan-na-sp23-ultra')).stock).toBe(12);
    });

    it('solo permite transiciones válidas', async () => {
        const { order } = await placeFirstOrder();
        const change = makeChangeOrderStatus({ orderRepository });
        await expect(change(order.code, 'delivered')).rejects.toThrow('No se puede pasar');
        await change(order.code, 'confirmed');
        expect((await orderRepository.findByCode(order.code)).status).toBe('confirmed');
    });

    it('resume ventas en el tablero excluyendo cancelados', async () => {
        const { order } = await placeFirstOrder();
        const dashboard = makeGetDashboard({ orderRepository, productRepository });
        expect((await dashboard()).revenue).toBe(order.total);
        expect((await dashboard()).topProducts[0]).toMatchObject({ productId: 'nasan-na-sp23-ultra', units: 2 });

        await makeChangeOrderStatus({ orderRepository })(order.code, 'cancelled');
        const after = await dashboard();
        expect(after.revenue).toBe(0);
        expect(after.lowStock.length).toBeGreaterThan(0);
    });
});

describe('Autenticación demo', () => {
    it('inicia sesión solo con las credenciales configuradas', async () => {
        const authGateway = createDemoAuthGateway({ email: 'admin@test.test', password: 'clave-segura', storage: memoryStorage() });
        const signIn = makeSignInAdmin({ authGateway });
        await expect(signIn('admin@test.test', 'otra')).rejects.toThrow('incorrectos');
        expect(await makeGetCurrentAdmin({ authGateway })()).toBeNull();
        const ok = await signIn('admin@test.test', 'clave-segura');
        expect(ok.email).toBe('admin@test.test');
        expect(await makeGetCurrentAdmin({ authGateway })()).toMatchObject({ email: 'admin@test.test' });
    });
});
