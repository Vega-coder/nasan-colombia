-- =====================================================================
-- MIGRACIÓN: Configuración de Envíos por Producto (Envío Gratis o Costo Específico)
-- Aroma Premium · Perfumes Árabes
-- =====================================================================

-- 1. Agregar columnas has_free_shipping y shipping_cost a la tabla products
alter table public.products
    add column if not exists has_free_shipping boolean not null default false,
    add column if not exists shipping_cost int not null default 0 check (shipping_cost >= 0);

comment on column public.products.has_free_shipping is 'Indica si el producto tiene envío gratis garantizado ($0)';
comment on column public.products.shipping_cost is 'Costo de envío individual en COP (0 si no cobra o si tiene envío gratis)';

-- 2. Actualizar función RPC place_order para respetar la configuración de envíos por producto
-- y no cobrar 15.000 COP indiscriminadamente cuando los productos no tienen costo de envío configurado.
create or replace function public.place_order(p_order jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
    v_order_id uuid;
    v_item jsonb;
    v_product public.products;
    v_unit int;
    v_qty int;
    v_subtotal int := 0;
    v_max_item_shipping int := 0;
    v_item_shipping int := 0;
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

        -- Calcular costo de envío por producto
        v_item_shipping := case 
            when coalesce(v_product.has_free_shipping, false) = true then 0
            when coalesce(v_product.shipping_cost, 0) <= 0 then 0
            else coalesce(v_product.shipping_cost, 0)
        end;
        if v_item_shipping > v_max_item_shipping then
            v_max_item_shipping := v_item_shipping;
        end if;

        insert into public.order_items (order_id, product_id, name, brand, unit_price, quantity, line_total)
        values (v_order_id, v_product.id, v_product.name, v_item ->> 'brand', v_unit, v_qty, v_unit * v_qty);

        -- SOLO descontar stock inmediatamente para métodos manuales (contra entrega o transferencia)
        -- Para Wompi, el inventario se descuenta en update_order_wompi_payment únicamente cuando el pago es 'APPROVED'.
        if v_payment_method <> 'wompi' then
            update public.products set stock = stock - v_qty where id = v_product.id;
        end if;
    end loop;

    -- Si el subtotal supera el umbral de envío gratis ($250.000 COP) -> $0.
    -- Si el payload especifica el shipping calculado por las reglas del dominio -> se usa ese valor.
    -- En caso contrario, se aplica el costo máximo configurado de los productos en el pedido.
    v_shipping := case 
        when v_subtotal >= 250000 then 0
        when (p_order ->> 'shipping') is not null then greatest(0, (p_order ->> 'shipping')::int)
        else v_max_item_shipping
    end;

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
