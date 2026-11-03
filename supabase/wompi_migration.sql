-- =====================================================================
-- MIGRACIÓN: SOPORTE PARA PASARELA DE PAGOS WOMPI (BANCOLOMBIA)
-- =====================================================================

-- 1. Actualizar restricción de métodos de pago en la tabla orders
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check 
    check (payment_method in ('transfer', 'cod', 'nequi', 'daviplata', 'efectivo', 'tarjeta', 'wompi'));

-- 2. Agregar columnas para trazabilidad de transacción Wompi y estado de pago
alter table public.orders add column if not exists wompi_transaction_id text;
alter table public.orders add column if not exists payment_status text default 'pending';

-- 3. Actualizar función RPC place_order para aceptar 'wompi' y asociar datos
create or replace function public.place_order(p_order jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
    v_order_id uuid;
    v_item jsonb;
    v_product public.products;
    v_unit int;
    v_qty int;
    v_subtotal int := 0;
    v_shipping int;
    v_tenant_id uuid;
    v_sede_id uuid;
    v_canal text;
begin
    if jsonb_array_length(coalesce(p_order -> 'items', '[]'::jsonb)) = 0 then
        raise exception 'El pedido no tiene productos';
    end if;

    -- Extraer tenant_id y sede_id con valores seguros por defecto
    v_tenant_id := coalesce((p_order ->> 'tenantCompanyId')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
    v_sede_id := coalesce((p_order ->> 'sedeId')::uuid, '00000000-0000-0000-0000-000000000010'::uuid);
    v_canal := coalesce(p_order ->> 'canal', 'online');

    insert into public.orders (
        tenant_company_id, sede_id, canal, code, customer, payment_method, 
        subtotal, shipping, total, user_id, wompi_transaction_id, payment_status
    )
    values (
        v_tenant_id,
        v_sede_id,
        v_canal,
        p_order ->> 'code',
        p_order -> 'customer',
        coalesce(p_order ->> 'paymentMethod', 'wompi'),
        0, 0, 0,
        auth.uid(),
        p_order ->> 'wompiTransactionId',
        coalesce(p_order ->> 'paymentStatus', 'pending')
    )
    returning id into v_order_id;

    for v_item in select * from jsonb_array_elements(p_order -> 'items') loop
        v_qty := (v_item ->> 'quantity')::int;
        select * into v_product from public.products
            where id = v_item ->> 'productId' and is_active for update;

        if not found then 
            raise exception 'Producto no disponible: %', v_item ->> 'name'; 
        end if;
        if v_qty <= 0 or v_product.stock < v_qty then
            raise exception 'Stock insuficiente para %', v_product.name;
        end if;

        v_unit := round(v_product.price * (1 - v_product.discount_percent / 100.0));
        v_subtotal := v_subtotal + v_unit * v_qty;

        insert into public.order_items (order_id, product_id, name, brand, unit_price, quantity, line_total)
        values (v_order_id, v_product.id, v_product.name, v_item ->> 'brand', v_unit, v_qty, v_unit * v_qty);

        -- SOLO descontar stock inmediatamente si el método de pago no requiere pasarela en línea
        -- Para Wompi, el stock se descuenta en update_order_wompi_payment ÚNICAMENTE cuando el pago es 'APPROVED'.
        if coalesce(p_order ->> 'paymentMethod', '') <> 'wompi' then
            update public.products set stock = stock - v_qty where id = v_product.id;
        end if;
    end loop;

    -- Regla de envío gratis: compras >= 250.000 COP tienen envío a $0, de lo contrario $15.000
    v_shipping := case when v_subtotal >= 250000 then 0 else 15000 end;

    update public.orders
        set subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
        where id = v_order_id;

    -- Registro en auditoría
    insert into public.registros_auditoria (tenant_company_id, usuario_id, entidad, entidad_id, accion, detalles)
    values (
        v_tenant_id,
        auth.uid(),
        'order',
        v_order_id::text,
        'CREAR_PEDIDO',
        jsonb_build_object('code', p_order ->> 'code', 'total', v_subtotal + v_shipping, 'payment_method', p_order ->> 'paymentMethod')
    );

    return v_order_id;
end;
$$;

-- 4. RPC para actualizar el estado del pago Wompi y descontar stock únicamente al aprobarse
create or replace function public.update_order_wompi_payment(
    p_code text,
    p_transaction_id text,
    p_status text
)
returns void language plpgsql security definer set search_path = public as $$
declare
    v_order record;
    v_item record;
begin
    -- Bloquear pedido para actualización concurrente segura
    select * into v_order from public.orders where code = p_code for update;
    if not found then
        return;
    end if;

    -- Si ya fue aprobado previamente, evitar duplicar descuento de inventario
    if v_order.payment_status = 'APPROVED' and p_status = 'APPROVED' then
        return;
    end if;

    -- Si el nuevo estado es APPROVED y antes no lo estaba: Descontar stock real
    if p_status = 'APPROVED' and coalesce(v_order.payment_status, '') <> 'APPROVED' then
        for v_item in select product_id, quantity from public.order_items where order_id = v_order.id loop
            update public.products 
            set stock = greatest(0, stock - v_item.quantity)
            where id = v_item.product_id;
        end loop;
    end if;

    update public.orders
    set 
        wompi_transaction_id = coalesce(p_transaction_id, wompi_transaction_id),
        payment_status = p_status,
        status = case 
            when p_status = 'APPROVED' then 'confirmed'
            when p_status = 'DECLINED' or p_status = 'ERROR' then 'cancelled'
            else status
        end
    where id = v_order.id;
end;
$$;

grant execute on function public.update_order_wompi_payment(text, text, text) to anon, authenticated;

-- 5. Actualizar get_order_by_code para incluir wompi_transaction_id y payment_status
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
            from public.order_items i where i.order_id = o.id
        ), '[]'::jsonb)
    )
    from public.orders o
    left join public.tenant_companias c on c.id = o.tenant_company_id
    left join public.sedes s on s.id = o.sede_id
    where o.code = p_code;
$$;

grant execute on function public.get_order_by_code(text) to anon, authenticated;
