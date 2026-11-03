import {
    validateAffiliateRegistration,
    normalizeCoupon,
} from '@/domain/affiliates/affiliate.js';

/**
 * Casos de uso para el módulo de afiliados (Aroma Premium Partners)
 */
export const makeAffiliateUseCases = ({ affiliateRepository }) => {
    return {
        /**
         * Valida un cupón de afiliado ingresado en checkout o capturado por URL ?ref=CODIGO
         */
        async validateCoupon(code) {
            const cleanCode = normalizeCoupon(code);
            if (!cleanCode) return { valid: false, error: 'Código de cupón vacío' };
            return affiliateRepository.validateCoupon(cleanCode);
        },

        /**
         * Envía solicitud de registro para un nuevo creador de contenido
         */
        async registerAffiliate(applicationData) {
            const errors = validateAffiliateRegistration(applicationData);
            if (Object.keys(errors).length > 0) {
                const err = new Error('Por favor corrige los datos del formulario');
                err.fields = errors;
                throw err;
            }

            const cleanData = {
                ...applicationData,
                couponCode: normalizeCoupon(applicationData.couponCode),
                email: applicationData.email.trim().toLowerCase(),
                phone: applicationData.phone.replace(/\D/g, ''),
            };

            return affiliateRepository.register(cleanData);
        },

        /**
         * Obtiene los datos del portal privado del influencer (métricas, saldo, ventas)
         */
        async getInfluencerPortalData(user) {
            if (!user) throw new Error('Debes iniciar sesión para acceder al panel de partners');
            return affiliateRepository.getPortalData(user);
        },

        /**
         * Panel de Administración: Lista todos los afiliados para gestión
         */
        async listAffiliatesForAdmin() {
            return affiliateRepository.findAllForAdmin();
        },

        /**
         * Panel de Administración: Actualiza estado, comisiones o nivel de un afiliado
         */
        async updateAffiliateStatus(id, updates) {
            return affiliateRepository.updateStatus(id, updates);
        },

        /**
         * Panel de Administración: Registra una transferencia o pago de comisión
         */
        async recordPayout({ affiliateId, amount, reference, notes, createdBy }) {
            if (!affiliateId || !amount || amount <= 0) {
                throw new Error('Monto y afiliado son requeridos para el pago');
            }
            return affiliateRepository.recordPayout({ affiliateId, amount, reference, notes, createdBy });
        },
    };
};
