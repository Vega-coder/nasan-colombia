// Implementación de AffiliateRepository sobre Supabase con soporte para modo local/demo.

export const createSupabaseAffiliateRepository = (supabase) => {
    return {
        /**
         * Valida un cupón de afiliado en la base de datos
         */
        async validateCoupon(code) {
            const cleanCode = code.trim().toUpperCase();

            // 1. Intentar por RPC
            try {
                const { data, error } = await supabase.rpc('validate_affiliate_coupon', {
                    p_coupon_code: cleanCode,
                });
                if (!error && data) return data;
            } catch {
                // RPC aún no ejecutado o error de conexión
            }

            // 2. Consulta directa a la tabla si RPC no está disponible
            const { data: aff, error: affErr } = await supabase
                .from('affiliates')
                .select('id, full_name, coupon_code, discount_pct, commission_pct, status, email, phone')
                .eq('coupon_code', cleanCode)
                .maybeSingle();

            if (affErr || !aff) {
                return { valid: false, error: 'El cupón no existe' };
            }

            if (aff.status !== 'active') {
                return { valid: false, error: 'El cupón no se encuentra activo' };
            }

            return {
                valid: true,
                affiliateId: aff.id,
                affiliateName: aff.full_name,
                couponCode: aff.coupon_code,
                discountPct: Number(aff.discount_pct),
                commissionPct: Number(aff.commission_pct),
                affiliateEmail: aff.email,
                affiliatePhone: aff.phone,
            };
        },

        /**
         * Registra solicitud de nuevo influencer
         */
        async register(application) {
            try {
                const { data, error } = await supabase.rpc('register_affiliate_application', {
                    p_application: application,
                });
                if (!error && data) {
                    if (data.success === false) throw new Error(data.error);
                    return data;
                }
            } catch (rpcErr) {
                if (rpcErr.message && !rpcErr.message.includes('function')) {
                    throw rpcErr;
                }
            }

            // Fallback directo a insert
            const { data, error } = await supabase
                .from('affiliates')
                .insert({
                    full_name: application.fullName,
                    email: application.email,
                    phone: application.phone,
                    platform: application.platform || 'instagram',
                    social_handle: application.socialHandle,
                    coupon_code: application.couponCode,
                    commission_pct: application.commissionPct || 5.0,
                    discount_pct: application.discountPct || 3.0,
                    status: application.status || 'pending_approval',
                    tier: application.tier || 'principiante',
                    bank_name: application.bankName,
                    bank_account_type: application.bankAccountType || 'Ahorros',
                    bank_account_number: application.bankAccountNumber,
                    bank_document_id: application.bankDocumentId,
                    notes: application.notes || null,
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new Error('El correo o código de descuento ya está en uso');
                }
                throw error;
            }

            return { success: true, id: data.id };
        },

        /**
         * Carga métricas y transacciones para el portal privado del influencer
         */
        async getPortalData(user) {
            // Buscar perfil del afiliado por id de usuario o por email
            let query = supabase.from('affiliates').select('*');
            if (user.id) {
                query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
            } else {
                query = query.eq('email', user.email);
            }

            const { data: affiliate, error: affErr } = await query.maybeSingle();

            if (affErr || !affiliate) {
                return null; // El usuario no está registrado como partner
            }

            // Cargar comisiones / ventas asociadas
            const { data: referrals = [] } = await supabase
                .from('affiliate_referrals')
                .select('*')
                .eq('affiliate_id', affiliate.id)
                .order('created_at', { ascending: false });

            // Cargar pagos registrados
            const { data: payouts = [] } = await supabase
                .from('affiliate_payouts')
                .select('*')
                .eq('affiliate_id', affiliate.id)
                .order('paid_at', { ascending: false });

            const validReferrals = referrals || [];
            const confirmedSales = validReferrals.filter((r) => r.status === 'confirmed' || r.status === 'paid');
            const totalSalesVolume = confirmedSales.reduce((acc, r) => acc + Number(r.subtotal_net || 0), 0);
            const accumulatedCommissions = confirmedSales.reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
            const paidCommissions = (payouts || [])
                .filter((p) => p.status === 'completed')
                .reduce((acc, p) => acc + Number(p.amount || 0), 0);

            const pendingBalance = Math.max(0, accumulatedCommissions - paidCommissions);

            return {
                affiliate,
                stats: {
                    couponCode: affiliate.coupon_code,
                    commissionPct: Number(affiliate.commission_pct),
                    discountPct: Number(affiliate.discount_pct),
                    status: affiliate.status,
                    tier: affiliate.tier,
                    confirmedSalesCount: confirmedSales.length,
                    totalSalesVolume,
                    accumulatedCommissions,
                    paidCommissions,
                    pendingBalance,
                },
                referrals: validReferrals,
                payouts: payouts || [],
            };
        },

        /**
         * Lista todos los afiliados para el panel de administración
         */
        async findAllForAdmin() {
            const { data: affiliates, error } = await supabase
                .from('affiliates')
                .select(`
                    *,
                    affiliate_referrals (*),
                    affiliate_payouts (*)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                // Si la relación anidada falla, consultar solo la tabla base
                const { data: baseList, error: baseErr } = await supabase
                    .from('affiliates')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (baseErr) throw baseErr;
                return baseList || [];
            }

            return (affiliates || []).map((aff) => {
                const referrals = aff.affiliate_referrals || [];
                const payouts = aff.affiliate_payouts || [];
                const confirmed = referrals.filter((r) => r.status === 'confirmed' || r.status === 'paid');
                const totalSales = confirmed.reduce((acc, r) => acc + Number(r.subtotal_net || 0), 0);
                const totalCommissions = confirmed.reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
                const paid = payouts.filter((p) => p.status === 'completed').reduce((acc, p) => acc + Number(p.amount || 0), 0);

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

        /**
         * Actualiza estado, nivel o comisiones de un afiliado
         */
        async updateStatus(id, updates) {
            const { data, error } = await supabase
                .from('affiliates')
                .update({
                    status: updates.status,
                    commission_pct: updates.commissionPct,
                    discount_pct: updates.discountPct,
                    tier: updates.tier,
                    notes: updates.notes,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        /**
         * Registra una transferencia o pago a un afiliado
         */
        async recordPayout({ affiliateId, amount, reference, notes, createdBy }) {
            const { data, error } = await supabase
                .from('affiliate_payouts')
                .insert({
                    affiliate_id: affiliateId,
                    amount: Number(amount),
                    reference: reference || null,
                    notes: notes || null,
                    status: 'completed',
                    created_by: createdBy || null,
                    paid_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            // Actualizar estado de comisiones confirmadas a 'paid'
            await supabase
                .from('affiliate_referrals')
                .update({ status: 'paid' })
                .eq('affiliate_id', affiliateId)
                .eq('status', 'confirmed');

            return data;
        },
    };
};
