// Gateway de integración con Groq Cloud API para el Chatbot Asesor Técnico de NASAN Colombia.
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_FALLBACK_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const SYSTEM_PROMPT = `
Eres el **Asesor Técnico Oficial de NASAN Colombia / Saisebmer**, distribuidores autorizados en Colombia de maquinaria profesional, herramientas, insumos y baterías de diagnóstico para remanufactura de pantallas y microelectrónica (By: Jordan Duran / Jaider Duran - @electronicaparaprincipiante).

Tu personalidad y estilo:
- Experto en servicio técnico, remanufactura de pantallas (LCD, OLED, curvas) y herramientas de taller.
- Hablas en español de Colombia de manera profesional, técnica y muy atenta.
- Respuestas directas, concisas y bien estructuradas (usa viñetas o tablas cortas para comparar especificaciones técnicas y voltajes).
- Precios siempre en Pesos Colombianos (COP) y en el formato de los volantes oficiales (ej: $1.700.000 COP / $ 1.7 M).

Conocimiento Oficial de NASAN Colombia:
1. **Líneas Oficiales:**
   - **Maquinaria:** NA-CLN (Máquina de prensado 110V/220V - $1.700.000), SUPA LITE PRO (Laminadora 3D Soft + autoclave - $2.350.000), NA-SP23 ULTRA (Plancha 360° para planas y curvas - $480.000), NA-B2+ (Removedor de burbujas con compresor 550W integrado - $950.000), NA-B2+ PRO (Combo removedor de burbujas + separador de glass táctil - $1.450.000), NA-FR01N (Separadora semiautomática de pantalla iPhone 12 al 17 Pro Max - $1.450.000).
   - **Herramientas e Insumos:** Hilo para separar glass 0.035 mm 200M ($10.000), Destornillador de precisión NASAN con cabezal giratorio ($15.000), Clean room wipers paños de limpieza 400 pcs no raya ($20.000).
   - **Baterías Diagnósticas iPhone:** Baterías 100% nuevas de 0 ciclos para iPhone 12 Mini a 15 Pro Max (Precios para técnico desde $110.000 hasta $150.000 COP).
2. **Ubicación & Contacto:**
   - Ocaña, Norte de Santander, Colombia.
   - WhatsApp Oficial: +57 312 391 7729 (https://wa.me/573123917729).
   - Email: jaiderduranpimienta@gmail.com
   - Redes: @electronicaparaprincipiante / @nasancolombia
3. **Envíos:** Despachos a nivel nacional por Coordinadora, Servientrega e Interrapidísimo.
4. **Pagos:** Wompi seguro (Bancolombia, Nequi, PSE, Tarjetas de crédito) y transferencias directas por WhatsApp.

Reglas estrictas:
1. NUNCA menciones perfumes, lociones ni cosméticos; este negocio es 100% TECNOLOGÍA, MAQUINARIA Y REPUESTOS DE SERVICIO TÉCNICO.
2. Si un cliente pide asesoría sobre cuál máquina comprar según su necesidad:
   - Para iniciar en prensado y remanufactura: NA-CLN o combo NA-B2+ PRO.
   - Para pantallas curvas de alta gama: NA-SP23 ULTRA (Plancha 360).
   - Para laminación sin burbujas en un solo paso: SUPA LITE PRO.
   - Para desmontar pantallas de iPhone del 12 al 17: NA-FR01N.
3. Enlaza siempre a los productos con su formato exacto: [Ver Nombre](/producto/slug).
`.trim();

/**
 * Combina el prompt del sistema con el catálogo dinámico en tiempo real (RAG).
 * @param {string} catalogSummary
 * @returns {string}
 */
export const buildSystemPrompt = (catalogSummary = '') => {
    let prompt = SYSTEM_PROMPT;
    if (catalogSummary && catalogSummary.trim()) {
        prompt += `\n\n### Catálogo Oficial de Equipos y Repuestos en Tiempo Real:\n${catalogSummary.trim()}\n\nInstrucciones adicionales:\n1. Recomienda los equipos disponibles en el catálogo anterior.\n2. Respeta los precios exactos en COP.\n3. Proporciona enlaces directos a las fichas técnicas [Ver Producto](/producto/slug).`;
    }
    return prompt;
};

/**
 * @typedef {Object} ChatMessage
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 */

/**
 * @param {{ apiKey?: string, fetchFn?: typeof fetch }} options
 */
export const createGroqGateway = ({
    apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || DEFAULT_FALLBACK_KEY,
    fetchFn = (typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch),
} = {}) => {
    const sendChat = async (messages, customPromptOrCatalog = '') => {
        if (!apiKey) {
            throw new Error('No se ha configurado la API Key de Groq');
        }

        // Si customPromptOrCatalog ya incluye la cabecera completa del sistema (ej. en tests), úsala directamente.
        // De lo contrario, genera el prompt combinando el sistema con el catálogo en vivo.
        const systemContent = customPromptOrCatalog && customPromptOrCatalog.includes('Eres el **Asesor')
            ? customPromptOrCatalog
            : buildSystemPrompt(customPromptOrCatalog);

        const payloadMessages = [
            { role: 'system', content: systemContent },
            ...messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        ];

        const tryModel = async (modelName) => {
            const response = await fetchFn(GROQ_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: payloadMessages,
                    temperature: 0.65,
                    max_tokens: 700,
                }),
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                const msg = errBody?.error?.message || `Error HTTP ${response.status}`;
                throw new Error(msg);
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            const content = choice?.message?.content || choice?.message?.reasoning;

            if (!content) {
                throw new Error('La respuesta de la IA llegó vacía.');
            }

            return content.trim();
        };

        try {
            return await tryModel(PRIMARY_MODEL);
        } catch (firstError) {
            console.warn(`[GroqGateway] Falló ${PRIMARY_MODEL}, reintentando con ${FALLBACK_MODEL}:`, firstError.message);
            try {
                return await tryModel(FALLBACK_MODEL);
            } catch (fallbackError) {
                console.error('[GroqGateway] Error final:', fallbackError);
                throw new Error('Lo sentimos, el asesor virtual está recibiendo muchas consultas en este momento. Si deseas atención inmediata, puedes escribir a nuestro WhatsApp oficial: 314 616 0642.');
            }
        }
    };

    return {
        sendChat,
    };
};
