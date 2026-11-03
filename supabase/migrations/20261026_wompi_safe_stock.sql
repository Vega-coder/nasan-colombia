-- =====================================================================
-- MIGRACIÓN: BLINDAJE DE STOCK PARA PASARELA DE PAGOS WOMPI
-- 
-- Problema resuelto:
-- Anteriormente, al hacer clic en "Pagar con Wompi" y abrir la pasarela,
-- se ejecutaba place_order y descontaba el stock inmediatamente, incluso
-- si el cliente cerraba la ventana, cancelaba o la tarjeta era rechazada.
-- 
-- Solución implementada:
-- 1. place_order: Valida que haya stock suficiente, pero NO descuenta el
--    stock si el método es 'wompi'.
-- 2. update_order_wompi_payment: Descuenta el stock atómicamente ÚNICAMENTE
--    cuando Wompi confirma que el pago es 'APPROVED'.
-- 3. Si la transacción es rechazada (DECLINED) o cancelada, el inventario
--    permanece intacto y no se pierde stock fantasma.
-- 4. Idempotencia: Si Wompi envía múltiples confirmaciones, el stock solo
--    se descuenta una sola vez.
-- =====================================================================

-- 1. Actualizar función RPC place_order
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
    v_payment_method text;
begin
    if jsonb_array_length(coalesce(p_order -> 'items', '[]'::jsonb)) = 0 then
        raise exception 'El pedido no tiene productos';
    end if;

    v_tenant_id := coalesce((p_order ->> 'tenantCompanyId')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
    v_sede_id := coalesce((p_order ->> 'sedeId')::uuid, '00000000-0000-0000-0000-000000000010'::uuid);
    v_canal := coalesce(p_order ->> 'canal', 'online');
    v_payment_method := coalesce(p_order ->> 'paymentMethod', 'wompi');

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
        v_payment_method,
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

        -- SOLO descontar stock inmediatamente para métodos manuales (contra entrega o transferencia)
        -- Para Wompi, el inventario se descuenta en update_order_wompi_payment únicamente cuando el pago es 'APPROVED'.
        if v_payment_method <> 'wompi' then
            update public.products set stock = stock - v_qty where id = v_product.id;
        end if;
    end loop;

    v_shipping := case when v_subtotal >= 250000 then 0 else 15000 end;

    update public.orders
        set subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
        where id = v_order_id;

    insert into public.registros_auditoria (tenant_company_id, usuario_id, entidad, entidad_id, accion, detalles)
    values (
        v_tenant_id,
        auth.uid(),
        'order',
        v_order_id::text,
        'CREAR_PEDIDO',
        jsonb_build_object('code', p_order ->> 'code', 'total', v_subtotal + v_shipping, 'payment_method', v_payment_method)
    );

    return v_order_id;
end;
$$;

grant execute on function public.place_order(jsonb) to anon, authenticated;

-- 2. Actualizar función RPC update_order_wompi_payment para descontar inventario de forma segura
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
    -- Bloquear pedido para actualización concurrente
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
