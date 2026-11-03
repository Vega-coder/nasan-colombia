// Repositorio en memoria para pruebas y modo demo del módulo de afiliados

export const createInMemoryAffiliateRepository = (seed = []) => {
    let affiliates = [...seed];
    let referrals = [];
    let payouts = [];

    return {
        async validateCoupon(code) {
            const clean = code.trim().toUpperCase();
            const found = affiliates.find((a) => a.coupon_code?.toUpperCase() === clean);
            if (!found) return { valid: false, error: 'El cupón no existe' };
            if (found.status !== 'active') return { valid: false, error: 'El cupón no está activo' };

            return {
                valid: true,
                affiliateId: found.id,
                affiliateName: found.full_name,
                couponCode: found.coupon_code,
                discountPct: Number(found.discount_pct || 3),
                commissionPct: Number(found.commission_pct || 5),
                affiliateEmail: found.email,
                affiliatePhone: found.phone,
            };
        },

        async register(application) {
            const id = `aff-${Date.now()}`;
            const newAff = {
                id,
                full_name: application.fullName,
                email: application.email,
                phone: application.phone,
                platform: application.platform || 'instagram',
                social_handle: application.socialHandle,
                coupon_code: application.couponCode,
                commission_pct: application.commissionPct || 5.0,
                discount_pct: application.discountPct || 3.0,
                tier: application.tier || 'principiante',
                status: application.status || 'pending_approval',
                notes: application.notes || null,
                created_at: new Date().toISOString(),
            };
            affiliates.push(newAff);
            return { success: true, id };
        },

        async getPortalData(user) {
            const affiliate = affiliates.find((a) => a.email === user.email || a.id === user.id);
            if (!affiliate) return null;

            const myReferrals = referrals.filter((r) => r.affiliate_id === affiliate.id);
            const myPayouts = payouts.filter((p) => p.affiliate_id === affiliate.id);
            const confirmed = myReferrals.filter((r) => r.status === 'confirmed' || r.status === 'paid');

            const totalSalesVolume = confirmed.reduce((acc, r) => acc + (r.subtotal_net || 0), 0);
            const accumulatedCommissions = confirmed.reduce((acc, r) => acc + (r.commission_amount || 0), 0);
            const paidCommissions = myPayouts.reduce((acc, p) => acc + (p.amount || 0), 0);

            return {
                affiliate,
                stats: {
                    couponCode: affiliate.coupon_code,
                    commissionPct: Number(affiliate.commission_pct),
                    discountPct: Number(affiliate.discount_pct),
                    status: affiliate.status,
                    tier: affiliate.tier,
                    confirmedSalesCount: confirmed.length,
                    totalSalesVolume,
                    accumulatedCommissions,
                    paidCommissions,
                    pendingBalance: Math.max(0, accumulatedCommissions - paidCommissions),
                },
                referrals: myReferrals,
                payouts: myPayouts,
            };
        },

        async findAllForAdmin() {
            return affiliates.map((aff) => {
                const myReferrals = referrals.filter((r) => r.affiliate_id === aff.id);
                const myPayouts = payouts.filter((p) => p.affiliate_id === aff.id);
                const confirmed = myReferrals.filter((r) => r.status === 'confirmed' || r.status === 'paid');
                const totalSales = confirmed.reduce((acc, r) => acc + (r.subtotal_net || 0), 0);
                const totalCommissions = confirmed.reduce((acc, r) => acc + (r.commission_amount || 0), 0);
                const paid = myPayouts.reduce((acc, p) => acc + (p.amount || 0), 0);

                return {
                    ...aff,
                    stats: {
                        confirmedSalesCount: confirmed.length,
                        totalSales,
                        totalCommissions,
                        paidCommissions: paid,
                        pendingBalance: Math.max(0, totalCommissions - paid),
                    },
                };
            });
        },

        async updateStatus(id, updates) {
            const idx = affiliates.findIndex((a) => a.id === id);
            if (idx === -1) throw new Error('Afiliado no encontrado');
            affiliates[idx] = {
                ...affiliates[idx],
                status: updates.status || affiliates[idx].status,
                commission_pct: updates.commissionPct ?? affiliates[idx].commission_pct,
                discount_pct: updates.discountPct ?? affiliates[idx].discount_pct,
                tier: updates.tier || affiliates[idx].tier,
                notes: updates.notes ?? affiliates[idx].notes,
            };
            return affiliates[idx];
        },

        async recordPayout({ affiliateId, amount, reference, notes }) {
            const payout = {
                id: `pay-${Date.now()}`,
                affiliate_id: affiliateId,
                amount,
                reference,
                notes,
                status: 'completed',
                paid_at: new Date().toISOString(),
            };
            payouts.push(payout);
            return payout;
        },

        // Métodos de ayuda para tests
        _addReferral(ref) {
            referrals.push(ref);
        },
        _setAffiliates(list) {
            affiliates = [...list];
        },
    };
};
