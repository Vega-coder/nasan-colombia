// Implementación de OrderRepository sobre Supabase.
// El pedido se crea con la función RPC `place_order` (supabase/schema.sql), que inserta
// cabecera + líneas y descuenta stock en una sola transacción.

const toDomain = (row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    customer: row.customer,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    createdAt: row.created_at,
    wompiTransactionId: row.wompi_transaction_id,
    paymentStatus: row.payment_status,
    shippingCarrier: row.shipping_carrier,
    shippingGuideNumber: row.shipping_guide_number,
    shippingLabelUrl: row.shipping_label_url,
    shippingStatus: row.shipping_status,
    shippingTrackingUrl: row.shipping_tracking_url,
    shippingData: row.shipping_data,
    shippingError: row.shipping_error,
    items: (row.order_items ?? []).map((i) => ({
        productId: i.product_id,
        name: i.name,
        brand: i.brand,
        unitPrice: i.unit_price,
        quantity: i.quantity,
        lineTotal: i.line_total,
    })),
});

/** @returns {import('@/application/ports.js').OrderRepository} */
export const createSupabaseOrderRepository = (supabase) => ({
    save: async (order) => {
        const { data, error } = await supabase.rpc('place_order', { p_order: order });
        if (error) throw error;
        return { ...order, id: data };
    },
    findByCode: async (code) => {
        const { data, error } = await supabase.rpc('get_order_by_code', { p_code: code });
        if (error) {
            // Si el RPC falla o no incluye los campos nuevos, consultar directamente la tabla orders
            const { data: direct, error: directErr } = await supabase
                .from('orders')
                .select('*, order_items (*)')
                .eq('code', code)
                .maybeSingle();
            if (directErr || !direct) return null;
            return toDomain(direct);
        }
        return data ?? null;
    },
    // Requiere sesión de administrador (RLS en `orders`).
    findAll: async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items (*)')
            .order('created_at', { ascending: false })
            .limit(500);
        if (error) throw error;
        return data.map(toDomain);
    },
    updateStatus: async (code, status) => {
        const { error } = await supabase.from('orders').update({ status }).eq('code', code);
        if (error) throw error;
    },
    updateWompiPayment: async (code, transactionId, status) => {
        try {
            await supabase.rpc('update_order_wompi_payment', {
                p_code: code,
                p_transaction_id: transactionId,
                p_status: status,
            });
        } catch {
            await supabase.from('orders').update({
                status: status === 'APPROVED' ? 'confirmed' : 'pending',
                wompi_transaction_id: transactionId,
                payment_status: status,
            }).eq('code', code);
        }
    },
    updateShippingGuide: async (code, shippingData) => {
        try {
            await supabase.rpc('update_order_shipping', {
                p_code: code,
                p_carrier: shippingData.carrier,
                p_guide_number: shippingData.guideNumber,
                p_label_url: shippingData.labelUrl,
                p_status: shippingData.status || 'generada',
                p_tracking_url: shippingData.trackingUrl,
                p_data: shippingData.raw || {},
            });
        } catch {
            await supabase.from('orders').update({
                shipping_carrier: shippingData.carrier,
                shipping_guide_number: shippingData.guideNumber,
                shipping_label_url: shippingData.labelUrl,
                shipping_status: shippingData.status || 'generada',
                shipping_tracking_url: shippingData.trackingUrl,
                shipping_data: shippingData.raw || {},
                shipping_error: null,
                status: 'shipped',
            }).eq('code', code);
        }
    },
    updateShippingError: async (code, errorMsg) => {
        await supabase.from('orders').update({
            shipping_error: errorMsg,
        }).eq('code', code);
    },
});
