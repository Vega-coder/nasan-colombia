import { describe, it, expect } from 'vitest';
import { createProduct, getFinalPrice, slugify } from '@/domain/catalog/product.js';
import { filterProducts, sortProducts, matchesAroma } from '@/domain/catalog/filters.js';
import { AROMAS, getAromaBySlug } from '@/domain/catalog/aromas.js';
import { addItem, updateQuantity, removeItem, calculateTotals, FREE_SHIPPING_THRESHOLD, SHIPPING_COST, MAX_QTY_PER_ITEM } from '@/domain/cart/cart.js';
import { buildOrder, validateCustomer, canTransition } from '@/domain/orders/order.js';
import { brandToSlug, buildBrandsCatalog, resolveBrandBySlug, getBrandMetadata } from '@/domain/catalog/brands.js';

const libre = createProduct({ id: 'libre', name: 'Libre', brand: 'YSL', gender: 'mujer', price: 100000, stock: 5, notes: ['Lavanda'], shippingCost: SHIPPING_COST });
const sauvage = createProduct({ id: 'sauvage', name: 'Sauvage', brand: 'Dior', gender: 'hombre', price: 200000, discountPercent: 50, stock: 2, isFeatured: true });

const customer = { fullName: 'Ana Gómez', email: 'ana@correo.com', phone: '300 123 4567', city: 'Medellín', address: 'Calle 10 # 43-12' };

describe('Producto', () => {
    it('normaliza slugs sin tildes', () => {
        expect(slugify('Lancôme La Vie Est Belle')).toBe('lancome-la-vie-est-belle');
    });
    it('aplica el descuento al precio final', () => {
        expect(getFinalPrice(sauvage)).toBe(100000);
    });
    it('rechaza productos sin nombre o con precio inválido', () => {
        expect(() => createProduct({ price: 10 })).toThrow();
        expect(() => createProduct({ name: 'X', price: -1 })).toThrow();
    });
    it('calcula métricas de reseñas dinámicas de la tabla de comentarios', () => {
        const withReviews = createProduct({
            name: 'Khamrah',
            price: 150000,
            reviews: [{ rating: 5 }, { rating: 4 }]
        });
        expect(withReviews.reviewsCount).toBe(2);
        expect(withReviews.ratingAverage).toBe(4.5);

        const withoutReviews = createProduct({
            name: 'Asad',
            price: 150000,
            reviews: []
        });
        expect(withoutReviews.reviewsCount).toBe(0);
        expect(withoutReviews.ratingAverage).toBeNull();
    });
    it('soporta la pirámide olfativa estructurada en 3 etapas (salida, corazón, base)', () => {
        const product = createProduct({
            name: 'Club de Nuit Intense',
            brand: 'Armaf',
            price: 189900,
            topNotes: ['Limón', 'Piña', 'Bergamota'],
            heartNotes: ['Abedul', 'Jazmín'],
            baseNotes: ['Ámbar gris', 'Almizcle', 'Vainilla'],
        });
        expect(product.topNotes).toEqual(['Limón', 'Piña', 'Bergamota']);
        expect(product.heartNotes).toEqual(['Abedul', 'Jazmín']);
        expect(product.baseNotes).toEqual(['Ámbar gris', 'Almizcle', 'Vainilla']);
    });
    it('deduce automáticamente la pirámide en 3 etapas cuando solo existen notas planas (como productos antiguos en BD)', () => {
        const product = createProduct({
            name: 'Set Afnan 9PM Rebel',
            brand: 'Afnan',
            price: 289900,
            notes: ['Piña asada', 'Lavanda', 'Cuero oscuro', 'Musgo', 'Ámbar'],
        });
        expect(product.topNotes).toEqual(['Piña asada', 'Lavanda']);
        expect(product.heartNotes).toEqual(['Cuero oscuro']);
        expect(product.baseNotes).toEqual(['Musgo', 'Ámbar']);
        expect(product.notes).toEqual(['Piña asada', 'Lavanda', 'Cuero oscuro', 'Musgo', 'Ámbar']);
    });
});

describe('Filtros del catálogo', () => {
    it('busca por notas ignorando tildes y mayúsculas', () => {
        expect(filterProducts([libre, sauvage], { query: 'LAVANDA' })).toEqual([libre]);
    });
    it('filtra por aroma / familia olfativa', () => {
        expect(matchesAroma(libre, 'florales')).toBe(true);
        expect(filterProducts([libre, sauvage], { aroma: 'florales' })).toEqual([libre]);
    });
    it('filtra por género y precio final', () => {
        expect(filterProducts([libre, sauvage], { gender: 'hombre' })).toEqual([sauvage]);
        expect(filterProducts([libre, sauvage], { maxPrice: 100000 })).toHaveLength(2);
    });
    it('ordena por precio final', () => {
        const [first] = sortProducts([libre, sauvage], 'price-desc');
        expect(first.id).toBe('libre'); // empatan en 100.000, el orden estable conserva libre primero
        expect(sortProducts([libre, sauvage], 'featured')[0].id).toBe('sauvage');
    });
});

describe('Familias olfativas y aromas', () => {
    it('contiene las 8 familias clave de la perfumería oriental', () => {
        expect(AROMAS).toHaveLength(8);
        const slugs = AROMAS.map((a) => a.slug);
        expect(slugs).toEqual([
            'avainillados',
            'citricos',
            'amaderados',
            'florales',
            'almizclados',
            'especiados',
            'dulces',
            'afrutados',
        ]);
    });
    it('resuelve aroma por slug ignorando mayúsculas', () => {
        expect(getAromaBySlug('CITRICOS')?.name).toBe('Cítricos');
        expect(getAromaBySlug('inexistente')).toBeNull();
    });
    it('comprueba coincidencia de aroma tanto por array explícito de aromas como por palabras clave', () => {
        const prodConAromas = createProduct({
            id: 'test-aroma',
            name: 'Aroma Test',
            brand: 'Test Brand',
            price: 150000,
            aromas: ['amaderados'],
        });
        expect(matchesAroma(prodConAromas, 'amaderados')).toBe(true);
        expect(matchesAroma(prodConAromas, 'dulces')).toBe(false);

        const prodConKeywords = createProduct({
            id: 'test-oud',
            name: 'Oud Royale',
            brand: 'Test Brand',
            price: 150000,
            notes: ['Oud oscuro', 'Sándalo'],
        });
        expect(matchesAroma(prodConKeywords, 'amaderados')).toBe(true);
    });
});

describe('Carrito', () => {
    it('acumula cantidades y respeta el stock', () => {
        let cart = addItem([], sauvage, 1);
        cart = addItem(cart, sauvage, 5);
        expect(cart[0].quantity).toBe(2);
    });
    it('no supera el máximo por producto', () => {
        const big = createProduct({ id: 'b', name: 'B', price: 1, stock: 100 });
        expect(addItem([], big, 50)[0].quantity).toBe(MAX_QTY_PER_ITEM);
    });
    it('elimina la línea al dejar cantidad 0', () => {
        const cart = addItem([], libre, 1);
        expect(updateQuantity(cart, 'libre', 0)).toEqual([]);
        expect(removeItem(cart, 'libre')).toEqual([]);
    });
    it('cobra envío por debajo del umbral y lo regala por encima', () => {
        const small = calculateTotals(addItem([], libre, 1));
        expect(small.shipping).toBe(SHIPPING_COST);
        expect(small.missingForFreeShipping).toBe(FREE_SHIPPING_THRESHOLD - 100000);
        const large = calculateTotals(addItem([], libre, 3));
        expect(large.shipping).toBe(0);
        expect(calculateTotals([]).total).toBe(0);
    });
    it('no cobra envío si el producto no tiene costo de envío configurado o tiene envío gratis', () => {
        const decant = createProduct({ id: 'decant', name: 'Muestra Decant', brand: 'Lattafa', price: 1000, stock: 10 });
        const small = calculateTotals(addItem([], decant, 1));
        expect(small.shipping).toBe(0);
        expect(small.total).toBe(1000);
        expect(small.missingForFreeShipping).toBe(0);

        const freeProduct = createProduct({ id: 'fp', name: 'Perfume Gratis', price: 150000, stock: 2, hasFreeShipping: true });
        const freeTotals = calculateTotals(addItem([], freeProduct, 1));
        expect(freeTotals.shipping).toBe(0);
        expect(freeTotals.total).toBe(150000);
        expect(freeTotals.missingForFreeShipping).toBe(0);
    });
    it('combina envíos usando el costo de envío más alto cuando hay varios productos', () => {
        const item1 = createProduct({ id: 'i1', name: 'Item 1', price: 50000, stock: 5, shippingCost: 10000 });
        const item2 = createProduct({ id: 'i2', name: 'Item 2', price: 50000, stock: 5, shippingCost: 15000 });
        const decant = createProduct({ id: 'decant', name: 'Muestra Decant', price: 1000, stock: 10 });

        let cart = addItem([], item1, 1);
        cart = addItem(cart, item2, 1);
        cart = addItem(cart, decant, 1);

        const totals = calculateTotals(cart);
        expect(totals.shipping).toBe(15000);
        expect(totals.subtotal).toBe(101000);
        expect(totals.total).toBe(101000 + 15000);
    });
});

describe('Pedido', () => {
    it('valida los datos del cliente', () => {
        expect(validateCustomer(customer)).toEqual({});
        expect(Object.keys(validateCustomer({ ...customer, phone: '123', email: 'x' }))).toEqual(['email', 'phone']);
    });
    it('construye un pedido con código y totales', () => {
        const order = buildOrder({
            items: addItem([], libre, 2), customer, paymentMethod: 'wompi',
            now: new Date('2026-10-18T12:00:00Z'), random: () => 0.5,
        });
        expect(order.code).toMatch(/^AP-261018-[0-9A-Z]{4}$/);
        expect(order.customer.phone).toBe('3001234567');
        expect(order.total).toBe(200000 + SHIPPING_COST);
        expect(order.status).toBe('pending');
    });
    it('falla con carrito vacío o método de pago inválido', () => {
        expect(() => buildOrder({ items: [], customer, paymentMethod: 'wompi' })).toThrow('vacío');
        expect(() => buildOrder({ items: addItem([], libre), customer, paymentMethod: 'btc' })).toThrow('pago');
    });
    it('solo permite transiciones válidas de estado', () => {
        expect(canTransition('pending', 'confirmed')).toBe(true);
        expect(canTransition('delivered', 'pending')).toBe(false);
    });
});

describe('Marcas (Dinámicas)', () => {
    it('convierte nombres a slugs normalizados', () => {
        expect(brandToSlug('Al Haramain')).toBe('al-haramain');
        expect(brandToSlug('Lattafa Perfumes!')).toBe('lattafa-perfumes');
    });

    it('construye catálogo dinámico de marcas contando productos', () => {
        const catalog = buildBrandsCatalog([libre, sauvage]);
        expect(catalog).toHaveLength(2);
        expect(catalog[0].name).toBe('Dior');
        expect(catalog[0].count).toBe(1);
    });

    it('resuelve metadatos de marcas conocidas o genera valores elegantes por defecto', () => {
        const lattafa = resolveBrandBySlug('lattafa', []);
        expect(lattafa.name).toBe('Lattafa');
        expect(lattafa.description).toContain('Lattafa Perfumes');

        const unknown = getBrandMetadata('Nueva Casa Oriental');
        expect(unknown.name).toBe('Nueva Casa Oriental');
        expect(unknown.country).toBe('Emiratos Árabes Unidos');
    });
});
