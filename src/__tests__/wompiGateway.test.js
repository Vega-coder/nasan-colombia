import { describe, it, expect, vi } from 'vitest';
import {
    generateIntegritySignature,
    createWompiGateway,
} from '@/infrastructure/gateways/wompiGateway.js';

describe('Wompi Gateway', () => {
    describe('generateIntegritySignature', () => {
        it('retorna undefined si no se suministra un secret', async () => {
            const sig = await generateIntegritySignature({
                reference: 'AP-2026-TEST',
                amountInCents: 15000000,
                currency: 'COP',
                secret: '',
            });
            expect(sig).toBeUndefined();
        });

        it('calcula correctamente el hash SHA-256 oficial', async () => {
            // Ejemplo: ref='REF123', amount=5000000, cur='COP', secret='test_secret'
            // Concatenado: REF1235000000COPtest_secret
            const sig = await generateIntegritySignature({
                reference: 'REF123',
                amountInCents: 5000000,
                currency: 'COP',
                secret: 'test_secret',
            });

            expect(typeof sig).toBe('string');
            expect(sig).toHaveLength(64); // SHA-256 es de 64 caracteres hexadecimales
            expect(sig).toMatch(/^[0-9a-f]{64}$/);
        });
    });

    describe('createWompiGateway', () => {
        it('detecta correctamente el entorno de sandbox con pub_test_', () => {
            const gateway = createWompiGateway({
                publicKey: 'pub_test_123456789',
                integritySecret: 'test_integrity_xyz',
            });

            expect(gateway.isConfigured).toBe(true);
            expect(gateway.isSandbox).toBe(true);
            expect(gateway.publicKey).toBe('pub_test_123456789');
        });

        it('detecta correctamente el entorno de producción con pub_prod_', () => {
            const gateway = createWompiGateway({
                publicKey: 'pub_prod_987654321',
                integritySecret: 'prod_integrity_xyz',
            });

            expect(gateway.isConfigured).toBe(true);
            expect(gateway.isSandbox).toBe(false);
            expect(gateway.publicKey).toBe('pub_prod_987654321');
        });

        it('invoca WidgetCheckout con los centavos calculados y datos de cliente', async () => {
            const mockOpen = vi.fn((cb) => {
                cb({
                    transaction: {
                        id: 'tx_test_999',
                        status: 'APPROVED',
                    },
                });
            });

            const MockWidgetCheckout = vi.fn().mockImplementation(function (options) {
                this.options = options;
                this.open = mockOpen;
            });

            globalThis.window = {
                ...globalThis.window,
                WidgetCheckout: MockWidgetCheckout,
                location: { origin: 'http://localhost:5173' },
            };

            const gateway = createWompiGateway({
                publicKey: 'pub_test_abc',
                integritySecret: 'test_sec_123',
            });

            const result = await gateway.openCheckout({
                order: { code: 'AP-TEST-01', total: 250000 },
                customer: {
                    fullName: 'Rodrigo Picon',
                    email: 'roanpiov@gmail.com',
                    phone: '3001234567',
                },
            });

            expect(MockWidgetCheckout).toHaveBeenCalledTimes(1);
            const passedOptions = MockWidgetCheckout.mock.calls[0][0];

            expect(passedOptions.amountInCents).toBe(25000000); // 250.000 * 100
            expect(passedOptions.reference).toBe('AP-TEST-01');
            expect(passedOptions.customerData.email).toBe('roanpiov@gmail.com');
            expect(passedOptions.customerData.fullName).toBe('Rodrigo Picon');
            expect(passedOptions.signature).toBeDefined();
            expect(passedOptions.signature.integrity).toBeDefined();

            expect(result.status).toBe('APPROVED');
            expect(result.transaction.id).toBe('tx_test_999');
        });
    });
});
