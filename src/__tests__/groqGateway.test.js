import { describe, it, expect, vi } from 'vitest';
import { createGroqGateway, SYSTEM_PROMPT } from '@/infrastructure/gateways/groqGateway.js';
import { buildCatalogSummary } from '@/domain/catalog/catalogSummary.js';
import { createProduct } from '@/domain/catalog/product.js';

describe('Groq Gateway & Catálogo RAG', () => {
    it('formatea el catálogo dinámico en vivo en un resumen estructurado con precios, stock y links', () => {
        const prod1 = createProduct({
            id: 'test-asad',
            slug: 'lattafa-asad-100',
            name: 'Asad',
            brand: 'Lattafa',
            gender: 'hombre',
            price: 180000,
            discountPercent: 10,
            stock: 5,
            aromas: ['amaderados', 'especiados'],
            notes: ['Pimienta', 'Tabaco', 'Café'],
            hasFreeShipping: true,
        });

        const prodAgotado = createProduct({
            id: 'test-agotado',
            slug: 'lattafa-yara-100',
            name: 'Yara',
            brand: 'Lattafa',
            gender: 'mujer',
            price: 150000,
            stock: 0,
            aromas: ['dulces'],
            notes: ['Vainilla'],
        });

        const summary = buildCatalogSummary([prod1, prodAgotado]);

        expect(summary).toContain('**Lattafa - Asad** (hombre)');
        expect(summary).toContain('162.000 COP · 10% OFF');
        expect(summary).toContain('En stock (5 unid.) · Envío GRATIS');
        expect(summary).toContain('Familias: amaderados, especiados');
        expect(summary).toContain('Link: [Ver Asad](/producto/lattafa-asad-100)');

        expect(summary).toContain('**Lattafa - Yara** (mujer)');
        expect(summary).toContain('[AGOTADO TEMPORALMENTE]');
    });

    it('inyecta el catálogo dinámico en el prompt del sistema al consultar Groq', async () => {
        let capturedSystemPrompt = '';

        const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
            const body = JSON.parse(opts.body);
            capturedSystemPrompt = body.messages[0].content;
            return {
                ok: true,
                json: async () => ({
                    choices: [
                        { message: { role: 'assistant', content: 'Recomiendo Asad.' } },
                    ],
                }),
            };
        });

        const gateway = createGroqGateway({
            apiKey: 'test-api-key',
            fetchFn: mockFetch,
        });

        const catalog = '- **Lattafa - Asad** (hombre) | $179.900 COP | En stock | Link: [Ver Asad](/producto/lattafa-asad-100)';
        await gateway.sendChat([{ role: 'user', content: 'Qué perfume tienes?' }], catalog);

        expect(capturedSystemPrompt).toContain('Catálogo Oficial de Productos en Tiempo Real');
        expect(capturedSystemPrompt).toContain('Lattafa - Asad');
    });
    it('incluye el prompt del sistema y envía los mensajes a Groq', async () => {
        let capturedUrl = '';
        let capturedBody = null;

        const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
            capturedUrl = url;
            capturedBody = JSON.parse(opts.body);
            return {
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Te recomiendo Asad de Lattafa.',
                            },
                        },
                    ],
                }),
            };
        });

        const gateway = createGroqGateway({
            apiKey: 'test-api-key',
            fetchFn: mockFetch,
        });

        const reply = await gateway.sendChat([{ role: 'user', content: 'Quiero un perfume amaderado' }]);

        expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
        expect(capturedBody.messages[0].role).toBe('system');
        expect(capturedBody.messages[0].content).toBe(SYSTEM_PROMPT);
        expect(capturedBody.messages[1].content).toBe('Quiero un perfume amaderado');
        expect(reply).toBe('Te recomiendo Asad de Lattafa.');
    });

    it('reintenta con el modelo de respaldo si el principal falla', async () => {
        let callCount = 0;
        const modelsCalled = [];

        const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
            callCount++;
            const body = JSON.parse(opts.body);
            modelsCalled.push(body.model);

            if (callCount === 1) {
                return {
                    ok: false,
                    status: 503,
                    json: async () => ({ error: { message: 'Service unavailable' } }),
                };
            }

            return {
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                role: 'assistant',
                                content: 'Respuesta desde modelo de respaldo.',
                            },
                        },
                    ],
                }),
            };
        });

        const gateway = createGroqGateway({
            apiKey: 'test-api-key',
            fetchFn: mockFetch,
        });

        const reply = await gateway.sendChat([{ role: 'user', content: 'Hola' }]);

        expect(modelsCalled).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b']);
        expect(reply).toBe('Respuesta desde modelo de respaldo.');
    });

    it('devuelve mensaje amigable con contacto a WhatsApp si fallan ambos modelos', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Fatal error' } }),
        });

        const gateway = createGroqGateway({
            apiKey: 'test-api-key',
            fetchFn: mockFetch,
        });

        await expect(gateway.sendChat([{ role: 'user', content: 'Hola' }])).rejects.toThrow(
            /WhatsApp oficial: 314 616 0642/
        );
    });
});
