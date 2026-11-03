// Pasarela de pago Wompi (Bancolombia) para Colombia.
// Soporta Widget Checkout en modal para: Tarjetas de crédito/débito, PSE, Nequi y Botón Bancolombia.

export const WOMPI_CREDENTIALS = Object.freeze({
    sandbox: {
        publicKey: 'pub_test_okFSxlsS5IiKxOQ6aWqew8RbjhCQ4BVZ',
        integritySecret: 'test_integrity_009kAkcTvRHGvRrePcmUJgSi0iMDyEXb',
    },
    production: {
        publicKey: 'pub_prod_JGxQxLRJtWfnFvdswPuWKUlVGWUsDape',
        integritySecret: 'prod_integrity_t9Et9Efm7qiBC3mjMGIOaVfT1H9CRyIx',
    },
});

// Por defecto usa las variables de entorno (.env) o la llave pública de producción
const DEFAULT_PUBLIC_KEY = WOMPI_CREDENTIALS.production.publicKey;
const DEFAULT_INTEGRITY_SECRET = WOMPI_CREDENTIALS.production.integritySecret;

/**
 * Calcula la firma de integridad SHA-256 requerida por Wompi cuando se tiene activo el secreto de integridad.
 * Fórmula oficial de Wompi: SHA256(cadenaConcatenada) donde:
 * cadena = `${referencia}${montoEnCentavos}${moneda}${secretoIntegridad}`
 */
export async function generateIntegritySignature({ reference, amountInCents, currency = 'COP', secret }) {
    if (!secret) return undefined;
    const raw = `${reference}${amountInCents}${currency}${secret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Carga de forma asíncrona el script oficial del Widget de Wompi si aún no está presente en el DOM.
 */
export function loadWompiScript() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('Window no disponible'));
        if (window.WidgetCheckout) return resolve(window.WidgetCheckout);

        const existing = document.getElementById('wompi-widget-script');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.WidgetCheckout));
            existing.addEventListener('error', () => reject(new Error('No se pudo cargar el script de Wompi')));
            return;
        }

        const script = document.createElement('script');
        script.id = 'wompi-widget-script';
        script.src = 'https://checkout.wompi.co/widget.js';
        script.async = true;
        script.onload = () => resolve(window.WidgetCheckout);
        script.onerror = () => reject(new Error('No se pudo conectar con los servidores de Wompi'));
        document.head.appendChild(script);
    });
}

/**
 * @param {{
 *   publicKey?: string,
 *   integritySecret?: string,
 * }} config
 */
export const createWompiGateway = ({
    publicKey = import.meta.env?.VITE_WOMPI_PUBLIC_KEY || DEFAULT_PUBLIC_KEY,
    integritySecret = import.meta.env?.VITE_WOMPI_INTEGRITY_SECRET || DEFAULT_INTEGRITY_SECRET,
} = {}) => {
    const isSandbox = publicKey.startsWith('pub_test_');

    return {
        isConfigured: Boolean(publicKey),
        isSandbox,
        publicKey,

        /**
         * Abre el modal oficial de Wompi para realizar el pago de un pedido.
         * @param {{
         *   order: { code: string, total: number },
         *   customer: { email: string, fullName: string, phone?: string },
         *   redirectUrl?: string
         * }} params
         * @returns {Promise<{ transaction: Object, status: string }>}
         */
        openCheckout: async ({ order, customer, redirectUrl }) => {
            const WidgetCheckout = await loadWompiScript();
            if (!WidgetCheckout) throw new Error('El servicio de Wompi no está disponible en este momento');

            const amountInCents = Math.round(order.total * 100);
            const signature = integritySecret
                ? await generateIntegritySignature({
                    reference: order.code,
                    amountInCents,
                    currency: 'COP',
                    secret: integritySecret,
                })
                : undefined;

            return new Promise((resolve) => {
                const checkout = new WidgetCheckout({
                    currency: 'COP',
                    amountInCents,
                    reference: order.code,
                    publicKey,
                    signature: signature ? { integrity: signature } : undefined,
                    redirectUrl: redirectUrl || `${window.location.origin}/pedido/${order.code}`,
                    customerData: {
                        email: customer.email,
                        fullName: customer.fullName,
                        phoneNumber: String(customer.phone || '').replace(/\D/g, ''),
                        phoneNumberPrefix: '+57',
                    },
                });

                checkout.open((result) => {
                    const transaction = result?.transaction;
                    resolve({
                        transaction,
                        status: transaction?.status || (transaction ? 'PENDING' : 'CANCELLED_BY_USER'),
                    });
                });
            });
        },

        /**
         * Consulta el estado de una transacción directamente a la API pública de Wompi.
         */
        getTransactionStatus: async (transactionId) => {
            if (!transactionId) return null;
            const baseUrl = isSandbox ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';
            try {
                const res = await fetch(`${baseUrl}/transactions/${transactionId}`);
                if (!res.ok) return null;
                const json = await res.json();
                return json.data;
            } catch {
                return null;
            }
        },
    };
};
