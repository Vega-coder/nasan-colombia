// Pasarela de integración con transportadoras y plataformas de envíos de Colombia (Mi Paquete / Envia.com).
// Incluye modo API en vivo con credenciales y simulador de alta fidelidad para pruebas y modo demo.

import { CARRIERS, getCarrierById, calculatePackageSpecs, validateShippingOrder } from '@/domain/orders/shipping.js';

export const SHIPPING_PROVIDERS = Object.freeze({
    MIPAQUETE: 'mipaquete',
    ENVIA: 'envia',
});

// IDs de transportadoras oficiales en Mi Paquete
const MI_PAQUETE_DELIVERY_COMPANIES = Object.freeze({
    coordinadora: '5cb0f5fd244fe2796e65f9fc',
    servientrega: '5fceb46c8229797cb139a7aa',
    envia: '6080a75ef08a770ddd9724fd',
    tcc: '5ca22d9587981510092322f6',
    interrapidisimo: '64baafead968aa4f73ce67c5',
});

// Códigos DANE para las principales ciudades de Colombia
const DANE_CODES = Object.freeze({
    medellin: '05001000',
    bogota: '11001000',
    cali: '76001000',
    barranquilla: '08001000',
    bucaramanga: '68001000',
    cartagena: '13001000',
    pereira: '66001000',
    manizales: '17001000',
    cucuta: '54001000',
    ibague: '73001000',
    santamarta: '47001000',
    villavicencio: '50001000',
    pasto: '52001000',
    monteria: '23001000',
    valledupar: '20001000',
    armenia: '63001000',
    popayan: '19001000',
    neiva: '41001000',
    sincelejo: '70001000',
    tunja: '15001000',
    ocana: '54498000',
    bello: '05088000',
    itagui: '05360000',
    envigado: '05266000',
    soledad: '08758000',
    chia: '25175000',
});

function resolveDaneCode(cityName) {
    if (!cityName) return '11001000';
    const clean = String(cityName)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
    if (/^\d{8}$/.test(clean)) return clean;
    if (clean.includes('ocan')) return '54498000';
    return DANE_CODES[clean] || '11001000';
}

function generateSessionTracker() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'mp-track-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
}

/**
 * Genera un número de guía realista para la transportadora elegida en modo simulado o fallback.
 */
function generateMockGuideNumber(carrierId) {
    const carrier = getCarrierById(carrierId);
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    return `${carrier.prefix}-${randomSuffix}`;
}

/**
 * @param {{
 *   provider?: 'mipaquete' | 'envia',
 *   apiKey?: string,
 *   isSandbox?: boolean,
 *   senderInfo?: {
 *     name?: string,
 *     phone?: string,
 *     email?: string,
 *     address?: string,
 *     city?: string,
 *     nit?: string,
 *   }
 * }} config
 */
export const createShippingGateway = ({
    provider = import.meta.env?.VITE_SHIPPING_PROVIDER || SHIPPING_PROVIDERS.MIPAQUETE,
    apiKey = import.meta.env?.VITE_SHIPPING_API_KEY || '',
    isSandbox = import.meta.env?.VITE_SHIPPING_SANDBOX === 'true' || false,
    senderInfo = {
        name: import.meta.env?.VITE_STORE_ORIGIN_NAME || 'Rodrigo Andres Picon Ovalle',
        phone: (import.meta.env?.VITE_STORE_ORIGIN_PHONE && !import.meta.env?.VITE_STORE_ORIGIN_PHONE.includes('300'))
            ? import.meta.env.VITE_STORE_ORIGIN_PHONE
            : '3146160642',
        email: import.meta.env?.VITE_STORE_ORIGIN_EMAIL || 'roanpiov@hotmail.com',
        address: import.meta.env?.VITE_STORE_ORIGIN_ADDRESS || 'Calle 1 # 29 A 40 barrio el lago primera etapa',
        city: import.meta.env?.VITE_STORE_ORIGIN_CITY || 'Ocaña',
        daneCode: import.meta.env?.VITE_STORE_ORIGIN_DANE || '54498000',
        nit: import.meta.env?.VITE_STORE_ORIGIN_NIT || '1148441082',
    },
} = {}) => {
    const isLiveConfigured = Boolean(apiKey && apiKey.trim().length > 15);

    return {
        isConfigured: isLiveConfigured,
        provider,
        senderInfo,

        /**
         * Retorna la lista de transportadoras soportadas.
         */
        getCarriers: () => CARRIERS,

        /**
         * Cotiza en vivo las tarifas de las transportadoras para la ruta del pedido.
         */
        quoteRates: async ({ order, customSpecs }) => {
            const specs = customSpecs || calculatePackageSpecs(order);
            const originDane = senderInfo.daneCode || resolveDaneCode(senderInfo.city || 'Ocaña');
            const destDane = resolveDaneCode(order.customer?.city);

            if (isLiveConfigured && provider === SHIPPING_PROVIDERS.MIPAQUETE) {
                try {
                    const res = await fetch('https://api.mipaquete.com/quoteShipping', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            apikey: apiKey,
                            'session-tracker': generateSessionTracker(),
                        },
                        body: JSON.stringify({
                            originLocationCode: originDane,
                            destinyLocationCode: destDane,
                            height: specs.heightCm,
                            width: specs.widthCm,
                            length: specs.lengthCm,
                            weight: specs.weightKg,
                            quantity: 1,
                            declaredValue: specs.declaredValue,
                        }),
                    });
                    if (res.ok) {
                        const list = await res.json();
                        if (Array.isArray(list) && list.length > 0) {
                            return list.map((q) => {
                                const name = (q.deliveryCompanyName || '').toLowerCase();
                                let carrierId = 'coordinadora';
                                if (name.includes('servi')) carrierId = 'servientrega';
                                else if (name.includes('envia')) carrierId = 'envia';
                                else if (name.includes('tcc')) carrierId = 'tcc';
                                else if (name.includes('inter')) carrierId = 'interrapidisimo';

                                return {
                                    carrierId,
                                    carrierName: q.deliveryCompanyName,
                                    cost: q.shippingCost,
                                    deliveryDays: Math.max(1, Math.round((q.shippingTime || 1440) / 1440)),
                                    score: q.score,
                                };
                            });
                        }
                    }
                } catch (e) {
                    console.warn('[Quote Rates Error]', e);
                }
            }

            // Fallback de cotización estándar nacional
            return [
                { carrierId: 'envia', carrierName: 'Envía Colvanes', cost: 14500, deliveryDays: 2 },
                { carrierId: 'tcc', carrierName: 'TCC', cost: 21300, deliveryDays: 1 },
                { carrierId: 'coordinadora', carrierName: 'Coordinadora Mercantil', cost: 22670, deliveryDays: 1 },
                { carrierId: 'servientrega', carrierName: 'Servientrega', cost: 27357, deliveryDays: 1 },
            ];
        },

        /**
         * Genera la guía de transporte para un pedido.
         * Envía los datos automáticamente a Mi Paquete o Envia.com si hay API key configurada,
         * o genera la guía con trazabilidad y etiqueta oficial en modo demostración/desarrollo.
         */
        generateGuide: async ({ order, carrierId = 'coordinadora', customSpecs }) => {
            // 1. Validaciones previas de negocio
            const validationErrors = validateShippingOrder(order);
            if (Object.keys(validationErrors).length > 0) {
                const firstErr = Object.values(validationErrors)[0];
                throw new Error(firstErr);
            }

            const carrier = getCarrierById(carrierId);
            const specs = customSpecs || calculatePackageSpecs(order);

            // 2. Si hay credenciales reales de API configuradas, invocar el servicio en vivo
            if (isLiveConfigured) {
                try {
                    if (provider === SHIPPING_PROVIDERS.MIPAQUETE) {
                        return await callMiPaqueteApi({ apiKey, isSandbox, senderInfo, order, carrier, specs });
                    }
                    if (provider === SHIPPING_PROVIDERS.ENVIA) {
                        return await callEnviaApi({ apiKey, senderInfo, order, carrier, specs });
                    }
                } catch (apiError) {
                    console.error('[Shipping API Error]', apiError);
                    throw new Error(`La transportadora rechazó la solicitud: ${apiError.message}`);
                }
            }

            // 3. Fallback inteligente / Modo Simulado
            const guideNumber = generateMockGuideNumber(carrier.id);
            const trackingUrl = carrier.trackingUrl(guideNumber);

            return {
                guideNumber,
                carrier: carrier.name,
                carrierId: carrier.id,
                labelUrl: '',
                trackingUrl,
                status: 'generada',
                specs: {
                    ...specs,
                    dimensions: `${specs.lengthCm}x${specs.widthCm}x${specs.heightCm} cm`,
                },
                provider: isLiveConfigured ? provider : 'simulated',
                raw: {
                    generatedAt: new Date().toISOString(),
                    mode: isLiveConfigured ? 'live' : 'simulated',
                    orderCode: order.code,
                },
            };
        },

        /**
         * Consulta el estado de rastreo de una guía.
         */
        getTracking: async (guideNumber, carrierId) => {
            const carrier = getCarrierById(carrierId);

            // Si es un envío real con código de Mi Paquete (MP-...)
            if (isLiveConfigured && guideNumber?.startsWith('MP-')) {
                const mpCode = guideNumber.replace('MP-', '');
                try {
                    const res = await fetch(`https://api.mipaquete.com/getSendingTracking?mpCode=${mpCode}`, {
                        headers: {
                            apikey: apiKey,
                            'session-tracker': generateSessionTracker(),
                        },
                    });
                    if (res.ok) {
                        const json = await res.json();
                        const checkpoints = (json.tracking || []).map((t) => ({
                            date: t.date,
                            status: t.updateState,
                            description: t.updateState,
                            city: json.destiny || json.origin || senderInfo.city,
                        }));
                        return {
                            guideNumber,
                            carrier: json.deliveryCompanyName || carrier.name,
                            trackingUrl: `https://app.mipaquete.com/seguimiento?mpCode=${mpCode}`,
                            checkpoints: checkpoints.length > 0 ? checkpoints : [
                                {
                                    date: new Date().toISOString(),
                                    status: 'En proceso',
                                    description: 'Envío registrado en Mi Paquete.',
                                    city: senderInfo.city,
                                },
                            ],
                        };
                    }
                } catch {
                    // Si falla el endpoint en vivo, continúa con el fallback
                }
            }

            return {
                guideNumber,
                carrier: carrier.name,
                trackingUrl: carrier.trackingUrl(guideNumber),
                checkpoints: [
                    {
                        date: new Date().toISOString(),
                        status: 'Guía generada',
                        description: 'La orden de despacho ha sido creada y está lista para recolección en bodega.',
                        city: senderInfo.city,
                    },
                ],
            };
        },
    };
};

/**
 * Cliente HTTP para la API de Mi Paquete (mipaquete.com).
 * Utiliza el endpoint oficial de producción `POST /createSending`.
 */
async function callMiPaqueteApi({ apiKey, isSandbox, senderInfo, order, carrier, specs }) {
    const baseUrl = 'https://api.mipaquete.com';
    const deliveryCompanyId = MI_PAQUETE_DELIVERY_COMPANIES[carrier.id] || MI_PAQUETE_DELIVERY_COMPANIES.coordinadora;

    const senderParts = String(senderInfo.name || 'Rodrigo Andres Picon Ovalle').trim().split(' ');
    const senderName = senderParts.slice(0, 2).join(' ') || 'Rodrigo Andres';
    const senderSurname = senderParts.slice(2).join(' ') || 'Picon Ovalle';

    const customerParts = String(order.customer?.fullName || 'Cliente Destinatario').trim().split(' ');
    const customerName = customerParts[0] || 'Cliente';
    const customerSurname = customerParts.slice(1).join(' ') || 'Destinatario';

    const cleanCustomerPhone = String(order.customer?.phone || '').replace(/\D/g, '').slice(-10) || '3001234567';
    const cleanSenderPhone = String(senderInfo.phone || '3006238778').replace(/\D/g, '').slice(-10);

    const originDane = senderInfo.daneCode || resolveDaneCode(senderInfo.city || 'Ocaña');
    const destDane = resolveDaneCode(order.customer?.city);

    const payload = {
        sender: {
            name: senderName,
            surname: senderSurname,
            email: senderInfo.email || 'roanpiov@hotmail.com',
            cellPhone: cleanSenderPhone,
            prefix: '+57',
            pickupAddress: senderInfo.address || 'Calle 1 # 29 A 40 barrio el lago primera etapa',
            nit: String(senderInfo.nit || '1148441082').replace(/\D/g, ''),
            nitType: 'CC',
        },
        receiver: {
            name: customerName,
            surname: customerSurname,
            email: order.customer?.email || 'cliente@aromapremium.co',
            cellPhone: cleanCustomerPhone,
            prefix: '+57',
            destinationAddress: order.customer?.address || 'Dirección de entrega',
            nit: '10203040',
            nitType: 'CC',
        },
        productInformation: {
            declaredValue: specs.declaredValue || order.total || 100000,
            weight: specs.weightKg || 1,
            large: specs.lengthCm || 15,
            width: specs.widthCm || 15,
            height: specs.heightCm || 15,
            quantity: 1,
            forbiddenProduct: false,
        },
        locate: {
            originDaneCode: originDane,
            destinyDaneCode: destDane,
        },
        channel: 'api',
        description: 'Fragancias y perfumeria',
        paymentType: 101, // 101: Prepago tradicional con flete descontado de la billetera
        deliveryCompany: deliveryCompanyId,
        requestPickup: true,
        adminTransactionData: {
            saleValue: specs.declaredValue || order.total || 100000,
        },
    };

    const res = await fetch(`${baseUrl}/createSending`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
            'session-tracker': generateSessionTracker(),
        },
        body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.error || (json.message && json.message.code)) {
        const errorMsg = json.message?.detail || json.message?.title || json.error || `Error ${res.status} al conectar con Mi Paquete`;
        throw new Error(errorMsg);
    }

    const mpCode = json.mpCode || json.data?.mpCode || json.deliveryCompany?.mpCode;
    const guideNumber = mpCode ? `MP-${mpCode}` : generateMockGuideNumber(carrier.id);
    const trackingUrl = carrier.trackingUrl(guideNumber);

    return {
        guideNumber,
        carrier: carrier.name,
        carrierId: carrier.id,
        labelUrl: '', // Se genera e imprime directamente en formato térmico 10x15cm con shippingLabel
        trackingUrl,
        status: 'generada',
        specs,
        provider: 'mipaquete',
        raw: json,
    };
}

/**
 * Cliente HTTP para la API de Envia.com.
 */
async function callEnviaApi({ apiKey, senderInfo, order, carrier, specs }) {
    const res = await fetch('https://api.envia.com/ship/generate/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            origin: {
                name: senderInfo.name,
                company: senderInfo.name,
                email: senderInfo.email,
                phone: senderInfo.phone,
                street: senderInfo.address,
                city: senderInfo.city,
                country: 'CO',
            },
            destination: {
                name: order.customer.fullName,
                email: order.customer.email,
                phone: order.customer.phone,
                street: order.customer.address,
                city: order.customer.city,
                country: 'CO',
            },
            packages: [
                {
                    content: specs.contentDescription,
                    amount: 1,
                    type: 'box',
                    weight: specs.weightKg,
                    dimensions: {
                        length: specs.lengthCm,
                        width: specs.widthCm,
                        height: specs.heightCm,
                    },
                    declaredValue: specs.declaredValue,
                },
            ],
            carrier: carrier.shortName.toLowerCase(),
        }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.error) {
        throw new Error(json.message || `Error ${res.status} al conectar con Envia.com`);
    }

    const shipment = json.data?.[0] || json.data || {};
    const guideNumber = shipment.trackingNumber || generateMockGuideNumber(carrier.id);
    const labelUrl = shipment.label || '';

    return {
        guideNumber,
        carrier: carrier.name,
        carrierId: carrier.id,
        labelUrl,
        trackingUrl: carrier.trackingUrl(guideNumber),
        status: 'generada',
        specs,
        provider: 'envia',
        raw: shipment,
    };
}
