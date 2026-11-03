-- =====================================================================
-- MIGRACIÓN: MÓDULO DE DESPACHOS Y GUÍAS DE TRANSPORTE
-- (Integración con Mi Paquete, Envia.com, Coordinadora, Servientrega, etc.)
-- =====================================================================

-- 1. Agregar columnas para trazabilidad de envíos en la tabla orders
alter table public.orders add column if not exists shipping_carrier text;
alter table public.orders add column if not exists shipping_guide_number text;
alter table public.orders add column if not exists shipping_label_url text;
alter table public.orders add column if not exists shipping_status text default 'pendiente';
alter table public.orders add column if not exists shipping_tracking_url text;
alter table public.orders add column if not exists shipping_data jsonb default '{}'::jsonb;
alter table public.orders add column if not exists shipping_error text;

-- 2. Índice para búsqueda rápida por número de guía
create index if not exists idx_orders_shipping_guide on public.orders (shipping_guide_number);

-- 3. Función RPC para actualizar los datos de la guía de despacho
create or replace function public.update_order_shipping(
    p_code text,
    p_carrier text,
    p_guide_number text,
    p_label_url text,
    p_status text default 'generada',
    p_tracking_url text default null,
    p_data jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
    update public.orders
    set
        shipping_carrier = p_carrier,
        shipping_guide_number = p_guide_number,
        shipping_label_url = p_label_url,
        shipping_status = coalesce(p_status, 'generada'),
        shipping_tracking_url = p_tracking_url,
        shipping_data = coalesce(p_data, '{}'::jsonb),
        shipping_error = null,
        status = case when status in ('pending', 'confirmed') then 'shipped' else status end
    where code = p_code;
end;
$$;

grant execute on function public.update_order_shipping(text, text, text, text, text, text, jsonb) to authenticated, anon;

-- 4. Actualizar get_order_by_code para incluir todos los campos de envío
create or replace function public.get_order_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
    select jsonb_build_object(
        'id', o.id, 
        'code', o.code, 
        'status', o.status, 
        'customer', o.customer,
        'canal', o.canal,
        'paymentMethod', o.payment_method, 
        'subtotal', o.subtotal, 
        'shipping', o.shipping,
        'total', o.total, 
        'createdAt', o.created_at,
        'wompiTransactionId', o.wompi_transaction_id,
        'paymentStatus', o.payment_status,
        'shippingCarrier', o.shipping_carrier,
        'shippingGuideNumber', o.shipping_guide_number,
        'shippingLabelUrl', o.shipping_label_url,
        'shippingStatus', o.shipping_status,
        'shippingTrackingUrl', o.shipping_tracking_url,
        'shippingData', o.shipping_data,
        'shippingError', o.shipping_error,
        'company', jsonb_build_object(
            'name', c.nombre,
            'whatsapp', c.whatsapp
        ),
        'sede', jsonb_build_object(
            'name', s.nombre,
            'ciudad', s.ciudad
        ),
        'items', coalesce((
            select jsonb_agg(jsonb_build_object(
                'productId', i.product_id, 
                'name', i.name, 
                'brand', i.brand,
                'unitPrice', i.unit_price, 
                'quantity', i.quantity, 
                'lineTotal', i.line_total
            ))
            from public.order_items i
            where i.order_id = o.id
        ), '[]'::jsonb)
    )
    from public.orders o
    join public.tenant_companias c on c.id = o.tenant_company_id
    left join public.sedes s on s.id = o.sede_id
    where o.code = p_code;
$$;

grant execute on function public.get_order_by_code(text) to anon, authenticated;
