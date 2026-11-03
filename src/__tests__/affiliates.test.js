import { describe, it, expect, beforeEach } from 'vitest';
import {
    validateAffiliateRegistration,
    normalizeCoupon,
    isSelfPurchase,
    calculateAffiliateCommission,
    calculateCustomerDiscount,
    AFFILIATE_TIERS,
} from '@/domain/affiliates/affiliate.js';
import { buildOrder } from '@/domain/orders/order.js';
import { createInMemoryAffiliateRepository } from '@/infrastructure/repositories/inMemoryAffiliateRepository.js';
import { makeAffiliateUseCases } from '@/application/affiliates/affiliateUseCases.js';
import { getStoredReferralCode, setStoredReferralCode } from '@/presentation/hooks/useReferralTracking.js';

describe('Dominio de Afiliados · Reglas de Negocio y Normalización', () => {
    it('normaliza códigos de cupones eliminando espacios y convirtiendo a mayúsculas', () => {
        expect(normalizeCoupon('  laura10  ')).toBe('LAURA10');
        expect(normalizeCoupon('promo-2026!')).toBe('PROMO2026');
        expect(normalizeCoupon('  carlos_5  ')).toBe('CARLOS5');
        expect(normalizeCoupon(null)).toBe('');
        expect(normalizeCoupon(undefined)).toBe('');
        expect(normalizeCoupon(12345)).toBe('');
    });

    it('valida datos obligatorios en el registro de un nuevo creador', () => {
        const invalid = validateAffiliateRegistration({
            fullName: 'L',
            email: 'no-es-correo',
            phone: '123',
            socialHandle: '',
            couponCode: 'A',
        });

        expect(invalid.fullName).toBeDefined();
        expect(invalid.email).toBeDefined();
        expect(invalid.phone).toBeDefined();
        expect(invalid.socialHandle).toBeDefined();
        expect(invalid.couponCode).toBeDefined();

        const valid = validateAffiliateRegistration({
            fullName: 'Laura Martínez',
            email: 'laura@instagram.com',
            phone: '3001234567',
            socialHandle: '@laurastyle',
            couponCode: 'LAURA10',
        });

        expect(Object.keys(valid).length).toBe(0);
    });

    it('cuenta con los 3 niveles requeridos por la estrategia comercial', () => {
        expect(AFFILIATE_TIERS.PRINCIPIANTE.defaultCommissionPct).toBe(5);
        expect(AFFILIATE_TIERS.PRINCIPIANTE.defaultDiscountPct).toBe(3);

        expect(AFFILIATE_TIERS.INTERMEDIO.defaultCommissionPct).toBe(7);
        expect(AFFILIATE_TIERS.INTERMEDIO.defaultDiscountPct).toBe(5);

        expect(AFFILIATE_TIERS.ALTO_RENDIMIENTO.defaultCommissionPct).toBe(10);
        expect(AFFILIATE_TIERS.ALTO_RENDIMIENTO.defaultDiscountPct).toBe(5);
    });

    it('aplica filtro anti-fraude exhaustivo (celulares con prefijo, espacios y mayúsculas)', () => {
        const affiliate = { email: 'laura@influencer.com', phone: '3001234567' };
        
        // Coincidencia exacta de correo
        expect(isSelfPurchase(affiliate, { email: 'LAURA@influencer.com', phone: '3109999999' })).toBe(true);
        expect(isSelfPurchase(affiliate, { email: '  laura@influencer.com  ', phone: '3109999999' })).toBe(true);

        // Coincidencia de celular con diferentes formatos
        expect(isSelfPurchase(affiliate, { email: 'otro@cliente.com', phone: '3001234567' })).toBe(true);
        expect(isSelfPurchase(affiliate, { email: 'otro@cliente.com', phone: '300 123 4567' })).toBe(true);
        expect(isSelfPurchase(affiliate, { email: 'otro@cliente.com', phone: '+57 (300) 123-4567' })).toBe(true);

        // Cliente legítimo totalmente diferente
        expect(isSelfPurchase(affiliate, { email: 'comprador@cliente.com', phone: '3118888888' })).toBe(false);
    });

    it('calcula la comisión del influencer sobre el subtotal neto después de descuento y sin flete', () => {
        const subtotalNeto = 190000;
        const commissionPct = 8;
        const comision = calculateAffiliateCommission(subtotalNeto, commissionPct);
        expect(comision).toBe(15200);

        // Subtotal cero o negativo no produce comisiones negativas
        expect(calculateAffiliateCommission(0, 10)).toBe(0);
        expect(calculateAffiliateCommission(-50000, 10)).toBe(0);
    });

    it('calcula el descuento otorgado al comprador', () => {
        const subtotal = 200000;
        const discountPct = 5;
        const descuento = calculateCustomerDiscount(subtotal, discountPct);
        expect(descuento).toBe(10000);

        // Protege contra porcentajes inválidos
        expect(calculateCustomerDiscount(200000, 0)).toBe(0);
        expect(calculateCustomerDiscount(200000, 100)).toBe(100000); // Tope de seguridad en 50%
    });
});

describe('Integración con Pedidos (buildOrder + Cupón de Afiliado)', () => {
    const customer = {
        fullName: 'Carlos Perez',
        email: 'carlos@cliente.com',
        phone: '3112223344',
        city: 'Bogotá',
        address: 'Calle 100 # 15-20',
    };

    it('construye pedido con cupón de influencer, calcula descuento y cobra flete si subtotal < 250.000', () => {
        const mockItems = [
            {
                productId: 'p-1',
                slug: 'khamrah',
                name: 'Khamrah',
                brand: 'Lattafa',
                unitPrice: 200000,
                quantity: 1,
                stock: 10,
                hasFreeShipping: false,
                shippingCost: 15000,
            },
        ];

        const order = buildOrder({
            items: mockItems,
            customer,
            paymentMethod: 'wompi',
            couponCode: 'LAURA10',
            discountPct: 5,
        });

        expect(order.couponCode).toBe('LAURA10');
        expect(order.discountAmount).toBe(10000); // 5% de 200.000
        expect(order.subtotal).toBe(200000);
        expect(order.shipping).toBe(15000);
        expect(order.total).toBe(205000); // (200.000 - 10.000) + 15.000
    });

    it('revalida el umbral de envío gratis si el descuento hace caer el subtotal neto por debajo de $250.000', () => {
        // Pedido de $260.000 con envío regular de $15.000.
        // Con 5% de descuento, el subtotal neto queda en $247.000 (< 250.000), por lo que DEBE cobrar flete de $15.000.
        const mockItems = [
            {
                productId: 'p-1',
                slug: 'amber-oud',
                name: 'Amber Oud',
                brand: 'Al Haramain',
                unitPrice: 260000,
                quantity: 1,
                stock: 5,
                hasFreeShipping: false,
                shippingCost: 15000,
            },
        ];

        const order = buildOrder({
            items: mockItems,
            customer,
            paymentMethod: 'wompi',
            couponCode: 'LAURA10',
            discountPct: 5,
        });

        expect(order.discountAmount).toBe(13000); // 5% de 260.000 = 13.000
        expect(order.shipping).toBe(15000); // Subtotal neto = 247.000 (< 250.000) -> cobra flete
        expect(order.total).toBe(247000 + 15000);
    });

    it('mantiene el envío gratis si el subtotal neto después del cupón sigue siendo >= $250.000', () => {
        // Pedido de $300.000 con 5% de descuento ($15.000). Subtotal neto = $285.000 (>= 250.000). Envío gratis ($0).
        const mockItems = [
            {
                productId: 'p-1',
                slug: 'club-de-nuit',
                name: 'Club de Nuit',
                brand: 'Armaf',
                unitPrice: 300000,
                quantity: 1,
                stock: 8,
                hasFreeShipping: false,
                shippingCost: 15000,
            },
        ];

        const order = buildOrder({
            items: mockItems,
            customer,
            paymentMethod: 'wompi',
            couponCode: 'LAURA10',
            discountPct: 5,
        });

        expect(order.discountAmount).toBe(15000);
        expect(order.shipping).toBe(0); // Envío gratis garantizado
        expect(order.total).toBe(285000);
    });
});

describe('Casos de Uso de Afiliados (AffiliateUseCases)', () => {
    let repo;
    let useCases;

    beforeEach(() => {
        repo = createInMemoryAffiliateRepository([
            {
                id: 'aff-1',
                full_name: 'Laura Martínez',
                email: 'laura@test.com',
                phone: '3001234567',
                coupon_code: 'LAURA10',
                commission_pct: 8.0,
                discount_pct: 5.0,
                status: 'active',
                tier: 'intermedio',
            },
            {
                id: 'aff-2',
                full_name: 'Pedro Gómez',
                email: 'pedro@test.com',
                phone: '3109876543',
                coupon_code: 'PEDRO5',
                commission_pct: 5.0,
                discount_pct: 3.0,
                status: 'pending_approval',
                tier: 'principiante',
            },
            {
                id: 'aff-3',
                full_name: 'Andrés Bloqueado',
                email: 'bloqueado@test.com',
                phone: '3201112233',
                coupon_code: 'BLOQUEADO',
                commission_pct: 5.0,
                discount_pct: 3.0,
                status: 'suspended',
                tier: 'principiante',
            },
        ]);

        useCases = makeAffiliateUseCases({ affiliateRepository: repo });
    });

    it('valida cupón activo existente en el repositorio', async () => {
        const res = await useCases.validateCoupon('laura10');
        expect(res.valid).toBe(true);
        expect(res.couponCode).toBe('LAURA10');
        expect(res.discountPct).toBe(5);
        expect(res.commissionPct).toBe(8);
    });

    it('rechaza cupón en estado pendiente o suspendido', async () => {
        const resPending = await useCases.validateCoupon('PEDRO5');
        expect(resPending.valid).toBe(false);

        const resSuspended = await useCases.validateCoupon('BLOQUEADO');
        expect(resSuspended.valid).toBe(false);
    });

    it('rechaza cupones inexistentes o vacíos', async () => {
        const resNonExistent = await useCases.validateCoupon('INVENTADO');
        expect(resNonExistent.valid).toBe(false);

        const resEmpty = await useCases.validateCoupon('');
        expect(resEmpty.valid).toBe(false);
    });

    it('permite a un nuevo influencer registrarse y guarda su solicitud en pending_approval', async () => {
        const res = await useCases.registerAffiliate({
            fullName: 'Camila Morales',
            email: 'camila@creadora.com',
            phone: '3015556677',
            socialHandle: '@camilabeauty',
            couponCode: 'CAMI10',
            platform: 'tiktok',
        });

        expect(res.success).toBe(true);

        const all = await useCases.listAffiliatesForAdmin();
        const created = all.find((a) => a.coupon_code === 'CAMI10');
        expect(created).toBeDefined();
        expect(created.status).toBe('pending_approval');
        expect(created.commission_pct).toBe(5.0);
    });

    it('permite al admin aprobar y modificar los porcentajes de un afiliado', async () => {
        await useCases.updateAffiliateStatus('aff-2', {
            status: 'active',
            commissionPct: 7.0,
            discountPct: 5.0,
            tier: 'intermedio',
        });

        // Ahora el cupón de Pedro debe ser válido
        const res = await useCases.validateCoupon('PEDRO5');
        expect(res.valid).toBe(true);
        expect(res.commissionPct).toBe(7.0);
        expect(res.discountPct).toBe(5.0);
    });

    it('calcula métricas de saldo y liquidación de comisiones en el portal', async () => {
        // Registrar 2 ventas confirmadas para Laura
        repo._addReferral({
            id: 'ref-1',
            affiliate_id: 'aff-1',
            order_code: 'AP-261102-0001',
            subtotal_net: 190000,
            discount_applied: 10000,
            commission_amount: 15200,
            status: 'confirmed',
            created_at: new Date().toISOString(),
        });

        repo._addReferral({
            id: 'ref-2',
            affiliate_id: 'aff-1',
            order_code: 'AP-261102-0002',
            subtotal_net: 380000,
            discount_applied: 20000,
            commission_amount: 30400,
            status: 'confirmed',
            created_at: new Date().toISOString(),
        });

        const portal = await useCases.getInfluencerPortalData({ email: 'laura@test.com' });

        expect(portal.stats.confirmedSalesCount).toBe(2);
        expect(portal.stats.totalSalesVolume).toBe(570000);
        expect(portal.stats.accumulatedCommissions).toBe(45600);
        expect(portal.stats.pendingBalance).toBe(45600);

        // Admin registra un pago de $30.000
        await useCases.recordPayout({
            affiliateId: 'aff-1',
            amount: 30000,
            reference: 'NEQUI-998877',
            notes: 'Liquidación quincenal',
        });

        const updatedPortal = await useCases.getInfluencerPortalData({ email: 'laura@test.com' });
        expect(updatedPortal.stats.paidCommissions).toBe(30000);
        expect(updatedPortal.stats.pendingBalance).toBe(15600);
    });
});

describe('Persistencia de Atribución (useReferralTracking helpers)', () => {
    it('almacena y recupera el código de referido en localStorage de forma segura', () => {
        setStoredReferralCode('laura10');
        expect(getStoredReferralCode()).toBe('LAURA10');

        setStoredReferralCode(null);
        expect(getStoredReferralCode()).toBe(null);
    });
});
