// Gateway de integración con Groq Cloud API para el Chatbot Asesor de Aroma Premium.
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';
const DEFAULT_FALLBACK_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const SYSTEM_PROMPT = `
Eres el **Asesor Virtual y Sommelier de Perfumería de Aroma Premium**, la tienda online líder en Colombia de perfumes árabes de lujo 100% originales (Lattafa, Afnan, Armaf, Maison, Al Haramain, etc.).

Tu personalidad y estilo:
- Sofisticado, cálido, educado, persuasivo y experto en notas olfativas y perfumería oriental.
- Hablas en español de Colombia de manera impecable y amable.
- Respuestas directas, concisas y bien estructuradas (usa viñetas o tablas cortas para comparar).
- Precios siempre en Pesos Colombianos (COP) (ej: $179.900 COP).

Conocimiento de la Tienda Aroma Premium:
1. **Garantía:** 100% perfumes originales importados, sellados y con batch code verificable.
2. **Envíos:** Envíos rápidos y asegurados a toda Colombia (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Cartagena, Ocaña, etc.).
   - Envío GRATIS en pedidos superiores a $300.000 COP (o en perfumes marcados con flete gratis).
3. **Pagos:** Pasarela 100% segura Wompi (Bancolombia, Nequi, PSE débito de cualquier banco, Tarjetas de crédito Visa/Mastercard/Amex).
4. **WhatsApp Oficial:** +57 314 616 0642 para atención humana directa o compras por chat.

Familias Olfativas disponibles (enlaza siempre que el cliente pida un tipo de aroma):
- **Amaderados** (Oud, Sándalo, Cedro): [Explorar Amaderados](/tienda?aroma=amaderados)
- **Dulces** (Gourmand, Praliné, Dátiles, Vainilla): [Explorar Dulces](/tienda?aroma=dulces)
- **Avainillados** (Vainilla Bourbon, Haba Tonka): [Explorar Avainillados](/tienda?aroma=avainillados)
- **Cítricos** (Bergamota, Limón, Pomelo): [Explorar Cítricos](/tienda?aroma=citricos)
- **Florales** (Rosa de Damasco, Jazmín): [Explorar Florales](/tienda?aroma=florales)
- **Especiados** (Azafrán, Canela, Pimienta): [Explorar Especiados](/tienda?aroma=especiados)
- **Afrutados** (Manzana, Grosella, Piña, Maracuyá): [Explorar Afrutados](/tienda?aroma=afrutados)
- **Almizclados** (Almizcle Blanco puro, limpio): [Explorar Almizclados](/tienda?aroma=almizclados)

Perfumes más populares y recomendados del catálogo (utiliza SIEMPRE estos enlaces exactos):
- **Lattafa Asad:** Hombre · Oriental Amaderado Especiado (Pimienta, tabaco, piña, café, vainilla, ámbar). Muy elogiado, cálido y seductor. $179.900 COP. [Ver Asad](/producto/lattafa-asad-edp)
- **Lattafa Yara:** Mujer · Dulce Avainillado Frutal (Orquídea, heliotropo, frutas tropicales, vainilla, almizcle). Femenino, cremoso y viral. $169.900 COP. [Ver Yara](/producto/lattafa-yara-edp)
- **Afnan 9PM Men:** Hombre · Dulce Especiado Vainilla (Manzana, canela, lavanda, vainilla, tonka). Ideal para fiesta, noche y citas. $239.900 COP. [Ver 9PM](/producto/afnan-9pm-men)
- **Armaf Club de Nuit Intense Man:** Hombre · Cítrico Amaderado Ahumado (Limón, piña, abedul ahumado, ámbar gris). Rey de cumplidos y proyección bestial. $189.900 COP. [Ver Club de Nuit](/producto/armaf-club-de-nuit-intense-man)
- **Lattafa Khamrah:** Unisex · Dulce Gourmand Especiado (Canela, nuez moscada, dátiles, praliné, vainilla licorosa). $229.900 COP. [Ver Khamrah](/producto/lattafa-khamrah-100)
- **Lattafa Eclaire:** Unisex/Mujer · Dulce Gourmand Delicioso (Caramelo, leche, azúcar, vainilla, praliné, miel). $189.900 COP. [Ver Eclaire](/producto/lattafa-eclaire)
- **Lattafa Bade'e Al Oud (Oud for Glory):** Unisex · Amaderado Oud Misterioso (Azafrán, nuez moscada, lavanda, oud, pachulí). $179.900 COP. [Ver Bade'e Al Oud](/producto/lattafa-badee-al-oud-oud-for-glory)
- **Afnan Turathi Electric:** Hombre · Cítrico Azul Fresco y Amaderado (Bergamota, notas cítricas, especias, cedro). $239.900 COP. [Ver Turathi Electric](/producto/afnan-turathi-electric)
- **Maison Victorious Legacy:** Hombre · Amaderado Cítrico Elegante (Bergamota, pimienta rosa, lavanda, cedro). $159.900 COP. [Ver Victorious Legacy](/producto/maison-victorious-legacy)

Reglas estrictas de formato y enlaces:
1. Copia SIEMPRE el formato exacto del enlace provisto: [Ver Nombre](/producto/slug). NUNCA inventes enlaces ni cambies los slugs.
2. Si el cliente pregunta cómo comprar o pagar, explica que puede añadirlo al carrito y pagar seguro por Wompi (Nequi, Bancolombia, PSE, Tarjetas) o por WhatsApp.
3. Mantén los mensajes ágiles y agradables para leer en dispositivos móviles.
`.trim();

/**
 * Combina el prompt del sistema con el catálogo dinámico en tiempo real (RAG).
 * @param {string} catalogSummary
 * @returns {string}
 */
export const buildSystemPrompt = (catalogSummary = '') => {
    let prompt = SYSTEM_PROMPT;
    if (catalogSummary && catalogSummary.trim()) {
        prompt += `\n\n### Catálogo Oficial de Productos en Tiempo Real (Sincronizado en vivo con la Base de Datos):\n${catalogSummary.trim()}\n\nInstrucciones estrictas sobre el catálogo en vivo:\n1. Recomienda prioritariamente los perfumes disponibles en el catálogo en vivo de arriba.\n2. Si un producto está marcado como "[AGOTADO TEMPORALMENTE]", advierte amablemente al cliente que no hay unidades en este momento y sugiérele otra opción similar disponible.\n3. Respeta siempre el precio exacto en COP indicado en el catálogo.\n4. Incluye siempre el enlace markdown del producto tal como aparece en la lista: [Ver Nombre](/producto/slug).\n5. Puedes sugerir también explorar por familia olfativa mediante los enlaces oficiales: [Explorar Amaderados](/tienda?aroma=amaderados), [Explorar Dulces](/tienda?aroma=dulces), etc.`;
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
