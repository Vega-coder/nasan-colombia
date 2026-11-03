-- =====================================================================
-- MIGRACIÓN: PROGRAMA DE AFILIADOS · AROMA PREMIUM PARTNERS
-- =====================================================================

-- 1. Tabla de Afiliados / Creadores de Contenido
create table if not exists public.affiliates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users (id) on delete set null,
    full_name text not null,
    email text not null unique,
    phone text not null,
    platform text not null default 'instagram' check (platform in ('instagram', 'tiktok', 'facebook', 'youtube', 'other')),
    social_handle text not null,
    coupon_code text not null unique,
    commission_pct numeric(5,2) not null default 5.00 check (commission_pct >= 0 and commission_pct <= 50),
    discount_pct numeric(5,2) not null default 3.00 check (discount_pct >= 0 and discount_pct <= 50),
    tier text not null default 'principiante' check (tier in ('principiante', 'intermedio', 'alto_rendimiento')),
    status text not null default 'pending_approval' check (status in ('pending_approval', 'active', 'rejected', 'suspended')),
    bank_name text,
    bank_account_type text default 'Ahorros',
    bank_account_number text,
    bank_document_id text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists affiliates_coupon_code_idx on public.affiliates (upper(coupon_code));
create index if not exists affiliates_user_id_idx on public.affiliates (user_id);
create index if not exists affiliates_status_idx on public.affiliates (status);

-- 2. Columnas de atribución en la tabla de Pedidos (orders)
alter table public.orders add column if not exists affiliate_id uuid references public.affiliates(id) on delete set null;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_amount numeric(12,2) default 0;

-- 3. Tabla de Comisiones por Venta (Referrals / Comisiones)
create table if not exists public.affiliate_referrals (
    id uuid primary key default gen_random_uuid(),
    affiliate_id uuid not null references public.affiliates(id) on delete cascade,
    order_id uuid not null references public.orders(id) on delete cascade,
    order_code text not null,
    subtotal_net numeric(12,2) not null,
    discount_applied numeric(12,2) not null default 0,
    commission_pct numeric(5,2) not null,
    commission_amount numeric(12,2) not null,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'paid')),
    holding_until timestamptz,
    confirmed_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists aff_referrals_affiliate_id_idx on public.affiliate_referrals (affiliate_id);
create index if not exists aff_referrals_order_id_idx on public.affiliate_referrals (order_id);
create index if not exists aff_referrals_status_idx on public.affiliate_referrals (status);

-- 4. Tabla de Liquidaciones / Pagos a Afiliados
create table if not exists public.affiliate_payouts (
    id uuid primary key default gen_random_uuid(),
    affiliate_id uuid not null references public.affiliates(id) on delete cascade,
    amount numeric(12,2) not null check (amount > 0),
    payment_method text not null default 'transferencia',
    reference text,
    receipt_url text,
    status text not null default 'completed' check (status in ('pending', 'completed', 'cancelled')),
    created_by uuid references auth.users(id),
    notes text,
    paid_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists aff_payouts_affiliate_id_idx on public.affiliate_payouts (affiliate_id);

-- 5. Row Level Security (RLS)
alter table public.affiliates enable row level security;
alter table public.affiliate_referrals enable row level security;
alter table public.affiliate_payouts enable row level security;

-- Políticas de Affiliates
drop policy if exists "affiliates_admin_all" on public.affiliates;
create policy "affiliates_admin_all" on public.affiliates for all
    using (public.is_admin()) with check (public.is_admin());

drop policy if exists "affiliates_owner_select" on public.affiliates;
create policy "affiliates_owner_select" on public.affiliates for select
    using (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'));

-- Políticas de Referrals
drop policy if exists "aff_referrals_admin_all" on public.affiliate_referrals;
create policy "aff_referrals_admin_all" on public.affiliate_referrals for all
    using (public.is_admin()) with check (public.is_admin());

drop policy if exists "aff_referrals_owner_select" on public.affiliate_referrals;
create policy "aff_referrals_owner_select" on public.affiliate_referrals for select
    using (affiliate_id in (select id from public.affiliates where user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

-- Políticas de Payouts
drop policy if exists "aff_payouts_admin_all" on public.affiliate_payouts;
create policy "aff_payouts_admin_all" on public.affiliate_payouts for all
    using (public.is_admin()) with check (public.is_admin());

drop policy if exists "aff_payouts_owner_select" on public.affiliate_payouts;
create policy "aff_payouts_owner_select" on public.affiliate_payouts for select
    using (affiliate_id in (select id from public.affiliates where user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

-- 6. RPC: Validar Cupón de Afiliado (Uso público en checkout)
create or replace function public.validate_affiliate_coupon(p_coupon_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
    v_affiliate record;
begin
    if p_coupon_code is null or trim(p_coupon_code) = '' then
        return jsonb_build_object('valid', false, 'error', 'Código vacío');
    end if;

    select id, full_name, coupon_code, discount_pct, commission_pct, status, email, phone
    into v_affiliate
    from public.affiliates
    where upper(coupon_code) = upper(trim(p_coupon_code));

    if not found then
        return jsonb_build_object('valid', false, 'error', 'El cupón ingresado no existe');
    end if;

    if v_affiliate.status <> 'active' then
        return jsonb_build_object('valid', false, 'error', 'Este código promocional no se encuentra activo');
    end if;

    return jsonb_build_object(
        'valid', true,
        'affiliateId', v_affiliate.id,
        'affiliateName', v_affiliate.full_name,
        'couponCode', v_affiliate.coupon_code,
        'discountPct', v_affiliate.discount_pct,
        'commissionPct', v_affiliate.commission_pct,
        'affiliateEmail', v_affiliate.email,
        'affiliatePhone', v_affiliate.phone
    );
end;
$$;

grant execute on function public.validate_affiliate_coupon(text) to anon, authenticated;

-- 7. RPC: Solicitud de Registro de Influencer ("Trabaja con nosotros")
create or replace function public.register_affiliate_application(p_application jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
    v_email text := lower(trim(p_application ->> 'email'));
    v_coupon text := upper(trim(p_application ->> 'couponCode'));
    v_id uuid;
begin
    if exists (select 1 from public.affiliates where lower(email) = v_email) then
        return jsonb_build_object('success', false, 'error', 'Ya existe una solicitud o cuenta con este correo electrónico');
    end if;

    if exists (select 1 from public.affiliates where upper(coupon_code) = v_coupon) then
        return jsonb_build_object('success', false, 'error', 'El código solicitado ya está en uso. Por favor elige otro.');
    end if;

    insert into public.affiliates (
        user_id, full_name, email, phone, platform, social_handle,
        coupon_code, commission_pct, discount_pct, tier, status,
        bank_name, bank_account_type, bank_account_number, bank_document_id
    ) values (
        auth.uid(),
        trim(p_application ->> 'fullName'),
        v_email,
        trim(p_application ->> 'phone'),
        coalesce(p_application ->> 'platform', 'instagram'),
        trim(p_application ->> 'socialHandle'),
        v_coupon,
        coalesce((p_application ->> 'commissionPct')::numeric, 5.00),
        coalesce((p_application ->> 'discountPct')::numeric, 3.00),
        'principiante',
        'pending_approval',
        p_application ->> 'bankName',
        coalesce(p_application ->> 'bankAccountType', 'Ahorros'),
        p_application ->> 'bankAccountNumber',
        p_application ->> 'bankDocumentId'
    ) returning id into v_id;

    return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

grant execute on function public.register_affiliate_application(jsonb) to anon, authenticated;

-- 8. Actualizar place_order para integrar atribución, descuento y comisiones
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
    v_coupon_code text;
    v_affiliate record;
    v_discount_amount int := 0;
    v_subtotal_net int := 0;
    v_commission_amount int := 0;
    v_customer_email text;
    v_customer_phone text;
begin
    if jsonb_array_length(coalesce(p_order -> 'items', '[]'::jsonb)) = 0 then
        raise exception 'El pedido no tiene productos';
    end if;

    v_tenant_id := coalesce((p_order ->> 'tenantCompanyId')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
    v_sede_id := coalesce((p_order ->> 'sedeId')::uuid, '00000000-0000-0000-0000-000000000010'::uuid);
    v_canal := coalesce(p_order ->> 'canal', 'online');
    v_coupon_code := nullif(upper(trim(coalesce(p_order ->> 'couponCode', ''))), '');

    v_customer_email := lower(trim(coalesce(p_order -> 'customer' ->> 'email', '')));
    v_customer_phone := regexp_replace(coalesce(p_order -> 'customer' ->> 'phone', ''), '\D', '', 'g');

    -- Validar cupón si fue provisto
    if v_coupon_code is not null then
        select * into v_affiliate from public.affiliates
        where upper(coupon_code) = v_coupon_code and status = 'active';

        -- Regla Anti-fraude: No autocompra
        if found then
            if lower(v_affiliate.email) = v_customer_email or regexp_replace(v_affiliate.phone, '\D', '', 'g') = v_customer_phone then
                v_affiliate := null;
                v_coupon_code := null;
            end if;
        end if;
    end if;

    insert into public.orders (
        tenant_company_id, sede_id, canal, code, customer, payment_method, 
        subtotal, shipping, total, user_id, wompi_transaction_id, payment_status,
        affiliate_id, coupon_code, discount_amount
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
        coalesce(p_order ->> 'paymentStatus', 'pending'),
        v_affiliate.id,
        v_coupon_code,
        0
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

        if coalesce(p_order ->> 'paymentMethod', '') <> 'wompi' then
            update public.products set stock = stock - v_qty where id = v_product.id;
        end if;
    end loop;

    -- Aplicar descuento del afiliado sobre los productos
    if v_affiliate.id is not null and coalesce(v_affiliate.discount_pct, 0) > 0 then
        v_discount_amount := round(v_subtotal * (v_affiliate.discount_pct / 100.0));
    end if;

    v_subtotal_net := greatest(0, v_subtotal - v_discount_amount);

    -- Envío gratis si el subtotal neto es >= $250.000 COP
    v_shipping := case when v_subtotal_net >= 250000 then 0 else 15000 end;

    update public.orders
        set subtotal = v_subtotal,
            discount_amount = v_discount_amount,
            shipping = v_shipping,
            total = v_subtotal_net + v_shipping
        where id = v_order_id;

    -- Si hay afiliado válido, registrar comisión estimada en pending
    if v_affiliate.id is not null and coalesce(v_affiliate.commission_pct, 0) > 0 then
        v_commission_amount := round(v_subtotal_net * (v_affiliate.commission_pct / 100.0));

        insert into public.affiliate_referrals (
            affiliate_id, order_id, order_code, subtotal_net,
            discount_applied, commission_pct, commission_amount,
            status, holding_until
        ) values (
            v_affiliate.id,
            v_order_id,
            p_order ->> 'code',
            v_subtotal_net,
            v_discount_amount,
            v_affiliate.commission_pct,
            v_commission_amount,
            'pending',
            now() + interval '15 days'
        );
    end if;

    -- Registro en auditoría
    insert into public.registros_auditoria (tenant_company_id, usuario_id, entidad, entidad_id, accion, detalles)
    values (
        v_tenant_id,
        auth.uid(),
        'order',
        v_order_id::text,
        'CREAR_PEDIDO',
        jsonb_build_object(
            'code', p_order ->> 'code',
            'subtotal', v_subtotal,
            'discount', v_discount_amount,
            'total', v_subtotal_net + v_shipping,
            'coupon', v_coupon_code,
            'affiliate_id', v_affiliate.id
        )
    );

    return v_order_id;
end;
$$;

-- 9. Actualizar update_order_wompi_payment para confirmar o cancelar la comisión del afiliado
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
    select * into v_order from public.orders where code = p_code for update;
    if not found then
        return;
    end if;

    if v_order.payment_status = 'APPROVED' and p_status = 'APPROVED' then
        return;
    end if;

    -- Si es aprobado: Descontar stock real y confirmar comisión de afiliado
    if p_status = 'APPROVED' and coalesce(v_order.payment_status, '') <> 'APPROVED' then
        for v_item in select product_id, quantity from public.order_items where order_id = v_order.id loop
            update public.products 
            set stock = greatest(0, stock - v_item.quantity)
            where id = v_item.product_id;
        end loop;

        -- Confirmar la comisión del afiliado e iniciar cuenta de retención de 15 días
        update public.affiliate_referrals
        set status = 'confirmed',
            confirmed_at = now(),
            holding_until = now() + interval '15 days'
        where order_id = v_order.id and status = 'pending';
    end if;

    -- Si es declinado o error: Cancelar comisión asociada
    if p_status in ('DECLINED', 'ERROR') then
        update public.affiliate_referrals
        set status = 'cancelled'
        where order_id = v_order.id and status = 'pending';
    end if;

    update public.orders
    set 
        wompi_transaction_id = coalesce(p_transaction_id, wompi_transaction_id),
        payment_status = p_status,
        status = case 
            when p_status = 'APPROVED' then 'confirmed'
            when p_status in ('DECLINED', 'ERROR') then 'cancelled'
            else status
        end
    where id = v_order.id;
end;
$$;
