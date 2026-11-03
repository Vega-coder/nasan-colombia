// Composition root: único lugar donde se eligen las implementaciones concretas
// y se inyectan en los casos de uso. La UI solo importa `useCases` / `adminUseCases` desde aquí.
import { supabase, isSupabaseConfigured } from './supabase/client.js';
import { SEED_PRODUCTS } from './data/seedProducts.js';
import { createInMemoryProductRepository } from './repositories/inMemoryProductRepository.js';
import { createLocalOrderRepository } from './repositories/localOrderRepository.js';
import { createSupabaseProductRepository } from './repositories/supabaseProductRepository.js';
import { createSupabaseOrderRepository } from './repositories/supabaseOrderRepository.js';
import { createSupabaseReviewRepository } from './repositories/supabaseReviewRepository.js';
import { createSupabaseAffiliateRepository } from './repositories/supabaseAffiliateRepository.js';
import { createInMemoryAffiliateRepository } from './repositories/inMemoryAffiliateRepository.js';
import { makeAffiliateUseCases } from '@/application/affiliates/affiliateUseCases.js';
import { createWhatsappGateway } from './gateways/whatsappGateway.js';
import { createWompiGateway } from './gateways/wompiGateway.js';
import { createShippingGateway } from './gateways/shippingGateway.js';
import { createGroqGateway } from './gateways/groqGateway.js';
import { buildCatalogSummary } from '@/domain/catalog/catalogSummary.js';
import { createSupabaseAuthGateway, createDemoAuthGateway } from './gateways/authGateways.js';
import { createSupabaseImageStorage, createDataUrlImageStorage } from './gateways/imageStorage.js';
import {
    makeBrowseCatalog, makeGetProductDetail, makeGetHomeShowcase,
    makeGetBrandsCatalog, makeGetBrandDetail,
} from '@/application/catalog/catalogUseCases.js';
import { makePlaceOrder, makeGetOrder } from '@/application/orders/placeOrder.js';
import {
    makeGenerateShippingGuide, makeGetShippingTracking, makePrintShippingLabel,
} from '@/application/orders/shippingUseCases.js';
import { calculatePackageSpecs, CARRIERS } from '@/domain/orders/shipping.js';
import {
    makeListProductsForAdmin, makeGetProductForAdmin, makeSaveProduct, makeDeleteProduct, makeToggleProductActive,
} from '@/application/admin/productAdmin.js';
import { makeListOrders, makeChangeOrderStatus, makeGetDashboard } from '@/application/admin/orderAdmin.js';
import {
    makeSignInAdmin, makeGetCurrentAdmin, makeSignOut,
    makeSignInCustomer, makeSignUpCustomer, makeGetCurrentUser, makeGetUserOrders,
    makeResetPassword, makeUpdatePassword,
} from '@/application/auth/authUseCases.js';
import { makeSubmitProductReview } from '@/application/reviews/reviewUseCases.js';

const env = import.meta.env ?? {};

// WhatsApp oficial de atención al cliente de NASAN Colombia / Saisebmer (+57 312 391 7729).
const envPhone = String(env.VITE_STORE_WHATSAPP || '').trim().replace(/\D/g, '');
export const STORE_WHATSAPP = (!envPhone || envPhone.includes('3000000000') || envPhone === '573000000000' || envPhone === '3000000000' || envPhone.startsWith('573000'))
    ? '573123917729'
    : (envPhone.startsWith('57') ? envPhone : `57${envPhone}`);
export const isDemoMode = !isSupabaseConfigured;
export const isAutoShippingEnabled = env.VITE_SHIPPING_AUTO_GENERATE !== 'false';
export const defaultCarrierId = env.VITE_SHIPPING_DEFAULT_CARRIER || 'coordinadora';

// Credenciales del panel en modo demo (ver .env.example).
export const DEMO_ADMIN = Object.freeze({
    email: env.VITE_DEMO_ADMIN_EMAIL || 'admin@nasancolombia.co',
    password: env.VITE_DEMO_ADMIN_PASSWORD || 'NasanDemo2026!',
});

// Limpieza proactiva de almacenamiento local para garantizar 0 residuos de lociones o perfumes
if (typeof window !== 'undefined') {
    try {
        const legacyKeys = [
            'ap_products',
            'ap_products_v2',
            'ap_cart',
            'ap_wishlist',
            'ap_recently_viewed',
            'ap_chatbot_history_v2',
            'nasan_products',
            'nasan_products_v2',
            'nasan_products_v3',
            'nasan_products_v4',
        ];
        legacyKeys.forEach((key) => localStorage.removeItem(key));
        sessionStorage.removeItem('ap_chatbot_history_v2');
    } catch {
        // Ignorar si el almacenamiento está restringido en modo incógnito
    }
}

// Catálogo quemado oficial de tecnología NASAN Colombia (Maquinaria, Herramientas, Insumos y Baterías iPhone)
const productRepository = createInMemoryProductRepository(SEED_PRODUCTS, globalThis.localStorage);

let generateShippingGuideFn;

const orderRepository = isDemoMode
    ? createLocalOrderRepository(globalThis.localStorage, {
        onSaved: (order) => productRepository.decrementStock(order.items),
        onWompiApproved: (order) => productRepository.decrementStock(order.items),
        onPaymentApproved: async (order) => {
            if (isAutoShippingEnabled && !order.shippingGuideNumber && generateShippingGuideFn) {
                try {
                    await generateShippingGuideFn({ orderCode: order.code, carrierId: defaultCarrierId });
                } catch (e) {
                    console.warn('[Auto-Shipping] Falló generación local:', e.message);
                }
            }
        },
    })
    : createSupabaseOrderRepository(supabase);

const notificationGateway = createWhatsappGateway(STORE_WHATSAPP);

const wompiGateway = createWompiGateway();

const shippingGateway = createShippingGateway();

const generateShippingGuide = makeGenerateShippingGuide({ orderRepository, shippingGateway });
generateShippingGuideFn = generateShippingGuide;

const getShippingTracking = makeGetShippingTracking({ orderRepository, shippingGateway });
const printShippingLabel = makePrintShippingLabel({ shippingGateway });

const handleUpdateWompiPayment = async (code, transactionId, status) => {
    await orderRepository.updateWompiPayment(code, transactionId, status);
    if (status === 'APPROVED' && isAutoShippingEnabled) {
        try {
            const current = await orderRepository.findByCode(code);
            if (current && !current.shippingGuideNumber) {
                await generateShippingGuide({ orderCode: code, carrierId: defaultCarrierId });
            }
        } catch (shippingErr) {
            console.warn('[Auto-Shipping] No se pudo generar la guía automáticamente:', shippingErr.message);
        }
    }
};

const authGateway = isDemoMode ? createDemoAuthGateway(DEMO_ADMIN) : createSupabaseAuthGateway(supabase);

const imageStorage = isDemoMode ? createDataUrlImageStorage() : createSupabaseImageStorage(supabase);

const reviewRepository = createSupabaseReviewRepository(supabase);
const submitProductReview = makeSubmitProductReview({ reviewRepository, authGateway });

const affiliateRepository = isDemoMode
    ? createInMemoryAffiliateRepository([
        {
            id: 'aff-demo-1',
            full_name: 'Laura Martínez',
            email: 'laura@aromapremium.test',
            phone: '3001234567',
            platform: 'instagram',
            social_handle: '@laurastyle',
            coupon_code: 'LAURA10',
            commission_pct: 8.0,
            discount_pct: 5.0,
            tier: 'intermedio',
            status: 'active',
        },
    ])
    : createSupabaseAffiliateRepository(supabase);

const affiliateUseCases = makeAffiliateUseCases({ affiliateRepository });

const groqGateway = createGroqGateway();

const getDynamicCatalogSummary = async () => {
    try {
        const products = await productRepository.findAll();
        return buildCatalogSummary(products);
    } catch (err) {
        console.warn('[Chatbot RAG] Error al cargar catálogo en vivo:', err);
        return '';
    }
};

export const useCases = Object.freeze({
    sendChatMessage: async (messages) => {
        const catalogSummary = await getDynamicCatalogSummary();
        return groqGateway.sendChat(messages, catalogSummary);
    },
    browseCatalog: makeBrowseCatalog({ productRepository }),
    getProductDetail: makeGetProductDetail({ productRepository }),
    getHomeShowcase: makeGetHomeShowcase({ productRepository }),
    getBrandsCatalog: makeGetBrandsCatalog({ productRepository }),
    getBrandDetail: makeGetBrandDetail({ productRepository }),
    getProductReviews: (productId) => reviewRepository.findByProductId(productId),
    submitProductReview: (reviewData) => submitProductReview(reviewData),
    voteReviewHelpful: (reviewId) => reviewRepository.incrementHelpful(reviewId),
    placeOrder: makePlaceOrder({ productRepository, orderRepository, notificationGateway }),
    getOrder: makeGetOrder({ orderRepository }),
    openWompiCheckout: (params) => wompiGateway.openCheckout(params),
    getWompiTransactionStatus: (id) => wompiGateway.getTransactionStatus(id),
    updateWompiPayment: handleUpdateWompiPayment,
    isWompiSandbox: wompiGateway.isSandbox,
    getShippingTracking: (orderCode) => getShippingTracking(orderCode),
    getAvailableCarriers: () => shippingGateway.getCarriers(),
    calculatePackageSpecs: (order) => calculatePackageSpecs(order),
    printShippingLabel: (order) => printShippingLabel(order),
    signInCustomer: makeSignInCustomer({ authGateway }),
    signUpCustomer: makeSignUpCustomer({ authGateway }),
    signOutCustomer: makeSignOut({ authGateway }),
    getCurrentUser: makeGetCurrentUser({ authGateway }),
    getUserOrders: makeGetUserOrders({ authGateway }),
    resetPassword: makeResetPassword({ authGateway }),
    updatePassword: makeUpdatePassword({ authGateway }),
    onAuthStateChange: (cb) => authGateway.onAuthStateChange?.(cb),
    validateCoupon: (code) => affiliateUseCases.validateCoupon(code),
    registerAffiliate: (data) => affiliateUseCases.registerAffiliate(data),
    getInfluencerPortalData: (user) => affiliateUseCases.getInfluencerPortalData(user),
});

export const adminUseCases = Object.freeze({
    signIn: makeSignInAdmin({ authGateway }),
    signOut: makeSignOut({ authGateway }),
    getCurrentAdmin: makeGetCurrentAdmin({ authGateway }),
    getDashboard: makeGetDashboard({ orderRepository, productRepository }),
    listProducts: makeListProductsForAdmin({ productRepository }),
    getProduct: makeGetProductForAdmin({ productRepository }),
    saveProduct: makeSaveProduct({ productRepository }),
    deleteProduct: makeDeleteProduct({ productRepository }),
    toggleProductActive: makeToggleProductActive({ productRepository }),
    listOrders: makeListOrders({ orderRepository }),
    changeOrderStatus: makeChangeOrderStatus({ orderRepository }),
    generateShippingGuide: (params) => generateShippingGuide(params),
    quoteShippingRates: (order) => shippingGateway.quoteRates({ order }),
    getShippingTracking: (orderCode) => getShippingTracking(orderCode),
    printShippingLabel: (order) => printShippingLabel(order),
    getAvailableCarriers: () => shippingGateway.getCarriers(),
    calculatePackageSpecs: (order) => calculatePackageSpecs(order),
    uploadImage: (file) => imageStorage.upload(file),
    customerMessageUrl: (order) => notificationGateway.buildCustomerMessageUrl(order),
    listAffiliates: () => affiliateUseCases.listAffiliatesForAdmin(),
    createAffiliate: (data) => affiliateUseCases.registerAffiliate({ ...data, status: data.status || 'active' }),
    updateAffiliateStatus: (id, updates) => affiliateUseCases.updateAffiliateStatus(id, updates),
    recordAffiliatePayout: (params) => affiliateUseCases.recordPayout(params),
});
