-- =====================================================================
-- Aroma Premium · Esquema de Base de Datos Multitenant (Estilo OcaPlus)
-- Compatible con PostgreSQL 15+ / Supabase
-- Ejecutar en el SQL Editor de Supabase. Luego ejecutar seed.sql.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =====================================================================
-- 1. TABLAS MAESTRAS DE MULTI-TENANCY
-- =====================================================================

-- 1.1 Catálogo de Industrias
create table if not exists public.tenant_industrias (
    id varchar(50) primary key,
    nombre varchar(100) not null,
    descripcion text,
    created_at timestamptz not null default now()
);

-- 1.2 Empresas / Tenants Inquilinos
create table if not exists public.tenant_companias (
    id uuid primary key default gen_random_uuid(),
    nombre varchar(150) not null,
    nit varchar(50),
    slug varchar(100) unique,
    plan_suscripcion varchar(50) not null default 'basic' check (plan_suscripcion in ('basic', 'pro', 'enterprise')),
    activo boolean not null default true,
    logo_url text,
    whatsapp varchar(30),
    email varchar(150),
    created_at timestamptz not null default now()
);

-- 1.3 Departamentos / Áreas operativas
create table if not exists public.tenant_departamentos (
    id varchar(50) primary key,
    nombre varchar(100) not null,
    descripcion text,
    created_at timestamptz not null default now()
);

-- 1.4 Sedes / Sucursales Físicas y Bodegas de Despacho
create table if not exists public.sedes (
    id uuid primary key default gen_random_uuid(),
    tenant_company_id uuid not null references public.tenant_companias (id) on delete cascade,
    tenant_industry_id varchar(50) not null default 'perfumeria' references public.tenant_industrias (id),
    nombre varchar(100) not null,
    direccion text,
    ciudad varchar(100) not null default 'Bogotá',
    telefono varchar(30),
    es_bodega_online boolean not null default true,
    activo boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists sedes_tenant_company_idx on public.sedes (tenant_company_id);

-- =====================================================================
-- 2. SEMILLA DE INQUILINO Y SEDE POR DEFECTO (Aroma Premium)
-- =====================================================================

insert into public.tenant_industrias (id, nombre, descripcion)
values 
    ('perfumeria', 'Perfumería y Cosmética de Lujo', 'Comercio de fragancias finas, perfumería de autor, cosmética y accesorios.'),
    ('retail', 'Comercio Minorista / Retail', 'Venta minorista de artículos generales.')
on conflict (id) do update set nombre = excluded.nombre, descripcion = excluded.descripcion;

insert into public.tenant_departamentos (id, nombre, descripcion)
values 
    ('administracion', 'Administración General', 'Gestión corporativa, compras y configuración.'),
    ('ventas_online', 'Ventas Online y E-Commerce', 'Atención de tienda virtual, redes y WhatsApp.'),
    ('bodega', 'Bodega y Despacho', 'Inventario, empaque y logística de envíos.'),
    ('caja', 'Caja y Facturación', 'Cobros, transferencias y cuadres de caja.')
on conflict (id) do update set nombre = excluded.nombre;

-- Tenant maestro inicial: Aroma Premium S.A.S.
insert into public.tenant_companias (id, nombre, nit, slug, plan_suscripcion, activo, whatsapp, email)
values (
    '00000000-0000-0000-0000-000000000001',
    'Aroma Premium S.A.S.',
    '901.876.543-2',
    'aroma-premium',
    'enterprise',
    true,
    '573000000000',
    'contacto@aromapremium.co'
)
on conflict (id) do update set nombre = excluded.nombre, activo = excluded.activo;

-- Sede principal por defecto para despacho online
insert into public.sedes (id, tenant_company_id, tenant_industry_id, nombre, direccion, ciudad, telefono, es_bodega_online, activo)
values (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'perfumeria',
    'Sede Principal - Bodega Online',
    'Cra. 15 # 85-30',
    'Bogotá',
    '573000000000',
    true,
    true
)
on conflict (id) do update set nombre = excluded.nombre;

-- =====================================================================
-- 3. PERFILES DE USUARIO Y ROLES (Vinculados a Auth de Supabase)
-- =====================================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    tenant_company_id uuid references public.tenant_companias (id) on delete set null default '00000000-0000-0000-0000-000000000001',
    sede_id uuid references public.sedes (id) on delete set null default '00000000-0000-0000-0000-000000000010',
    tenant_department_id varchar(50) references public.tenant_departamentos (id) on delete set null default 'ventas_online',
    full_name text,
    email text,
    phone text,
    role text not null default 'customer' check (role in ('superadmin', 'admin', 'gerente', 'vendedor', 'cajero', 'customer')),
    pin_acceso varchar(6),
    activo boolean not null default true,
    created_at timestamptz not null default now()
);

-- Funciones auxiliares de verificación de roles
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from public.profiles 
        where id = auth.uid() 
          and role in ('superadmin', 'admin', 'gerente')
          and activo = true
    );
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from public.profiles 
        where id = auth.uid() 
          and role = 'superadmin' 
          and activo = true
    );
$$;

create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
    select tenant_company_id from public.profiles where id = auth.uid();
$$;

-- =====================================================================
-- 4. REGISTROS DE AUDITORÍA (Trazabilidad estilo OcaPlus)
-- =====================================================================

create table if not exists public.registros_auditoria (
    id uuid primary key default gen_random_uuid(),
    tenant_company_id uuid references public.tenant_companias (id) on delete cascade,
    usuario_id uuid references public.profiles (id) on delete set null,
    entidad varchar(50) not null,
    entidad_id text,
    accion varchar(50) not null,
    detalles jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists auditoria_tenant_idx on public.registros_auditoria (tenant_company_id);
create index if not exists auditoria_entidad_idx on public.registros_auditoria (entidad, entidad_id);

-- =====================================================================
-- 5. CATÁLOGO (Marcas y Productos multitenant)
-- =====================================================================

create table if not exists public.brands (
    id uuid primary key default gen_random_uuid(),
    tenant_company_id uuid not null default '00000000-0000-0000-0000-000000000001' references public.tenant_companias (id) on delete cascade,
    name text not null unique,
    created_at timestamptz not null default now()
);

create table if not exists public.products (
    id text primary key,
    tenant_company_id uuid not null default '00000000-0000-0000-0000-000000000001' references public.tenant_companias (id) on delete cascade,
    sede_id uuid default '00000000-0000-0000-0000-000000000010' references public.sedes (id) on delete set null,
    slug text not null unique,
    name text not null,
    brand_id uuid not null references public.brands (id),
    description text not null default '',
    gender text not null default 'unisex' check (gender in ('mujer', 'hombre', 'unisex')),
    type text not null default 'fragancia' check (type in ('fragancia', 'set', 'accesorio')),
    concentration text check (concentration in ('parfum', 'edp', 'edt', 'edc')),
    volume_ml int check (volume_ml > 0),
    price int not null check (price >= 0),
    discount_percent int not null default 0 check (discount_percent between 0 and 90),
    stock int not null default 0 check (stock >= 0),
    notes text[] not null default '{}',
    top_notes text[] not null default '{}',
    heart_notes text[] not null default '{}',
    base_notes text[] not null default '{}',
    images text[] not null default '{}',
    palette jsonb not null default '{}'::jsonb,
    is_new boolean not null default false,
    is_featured boolean not null default false,
    is_active boolean not null default true,
    has_free_shipping boolean not null default false,
    shipping_cost int not null default 0 check (shipping_cost >= 0),
    created_at timestamptz not null default now()
);

create index if not exists products_gender_idx on public.products (gender);
create index if not exists products_type_idx on public.products (type);
create index if not exists products_tenant_idx on public.products (tenant_company_id);

-- =====================================================================
-- 6. PEDIDOS Y VENTAS (Orders)
-- =====================================================================

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    tenant_company_id uuid not null default '00000000-0000-0000-0000-000000000001' references public.tenant_companias (id) on delete cascade,
    sede_id uuid default '00000000-0000-0000-0000-000000000010' references public.sedes (id) on delete set null,
    canal varchar(20) not null default 'online' check (canal in ('online', 'whatsapp', 'pos', 'telefonico')),
    code text not null unique,
    status text not null default 'pending'
        check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    customer jsonb not null,
    payment_method text not null check (payment_method in ('transfer', 'cod', 'nequi', 'daviplata', 'efectivo', 'tarjeta')),
    subtotal int not null,
    shipping int not null,
    total int not null,
    user_id uuid references auth.users (id),
    created_at timestamptz not null default now()
);

create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders (id) on delete cascade,
    product_id text not null references public.products (id),
    name text not null,
    brand text not null,
    unit_price int not null,
    quantity int not null check (quantity > 0),
    line_total int not null
);

create index if not exists orders_tenant_idx on public.orders (tenant_company_id);
create index if not exists orders_code_idx on public.orders (code);

-- =====================================================================
-- 6.2 RESEÑAS DE PRODUCTOS (Product Reviews)
-- =====================================================================

create table if not exists public.product_reviews (
    id uuid primary key default gen_random_uuid(),
    product_id text not null references public.products (id) on delete cascade,
    user_id uuid references auth.users (id) on delete set null,
    author_name varchar(100) not null,
    city varchar(100) default 'Colombia',
    rating smallint not null check (rating between 1 and 5),
    title varchar(150),
    comment text not null,
    longevity varchar(50) default 'Más de 10 horas',
    sillage varchar(50) default 'Pesada',
    is_verified boolean not null default true,
    helpful_count integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id);
create index if not exists product_reviews_created_at_idx on public.product_reviews (created_at desc);

-- =====================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================================

alter table public.tenant_industrias enable row level security;
alter table public.tenant_companias enable row level security;
alter table public.tenant_departamentos enable row level security;
alter table public.sedes enable row level security;
alter table public.profiles enable row level security;
alter table public.registros_auditoria enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Tenant Industrias & Departamentos: lectura pública
drop policy if exists "industrias publicas" on public.tenant_industrias;
create policy "industrias publicas" on public.tenant_industrias for select using (true);

drop policy if exists "departamentos publicos" on public.tenant_departamentos;
create policy "departamentos publicos" on public.tenant_departamentos for select using (true);

-- Tenant Compañías: lectura pública si están activas o si es admin
drop policy if exists "companias lectura" on public.tenant_companias;
create policy "companias lectura" on public.tenant_companias for select 
    using (activo or public.is_admin());

drop policy if exists "companias admin" on public.tenant_companias;
create policy "companias admin" on public.tenant_companias for all 
    using (public.is_superadmin()) with check (public.is_superadmin());

-- Sedes: lectura si están activas o si es admin
drop policy if exists "sedes lectura" on public.sedes;
create policy "sedes lectura" on public.sedes for select 
    using (activo or public.is_admin());

drop policy if exists "sedes admin" on public.sedes;
create policy "sedes admin" on public.sedes for all 
    using (public.is_admin()) with check (public.is_admin());

-- Perfiles: el usuario puede ver y editar su propio perfil, admins ven de su compañía
drop policy if exists "perfil propio" on public.profiles;
create policy "perfil propio" on public.profiles
    for select using (id = auth.uid() or public.is_admin());

drop policy if exists "perfil update" on public.profiles;
create policy "perfil update" on public.profiles
    for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Auditoría: solo lectura por administradores
drop policy if exists "auditoria admin" on public.registros_auditoria;
create policy "auditoria admin" on public.registros_auditoria for select 
    using (public.is_admin());

-- Marcas: lectura pública, administración restringida
drop policy if exists "marcas publicas" on public.brands;
create policy "marcas publicas" on public.brands for select using (true);

drop policy if exists "marcas admin" on public.brands;
create policy "marcas admin" on public.brands for all 
    using (public.is_admin()) with check (public.is_admin());

-- Productos: públicos si están activos o si es admin
drop policy if exists "productos activos publicos" on public.products;
create policy "productos activos publicos" on public.products
    for select using (is_active or public.is_admin());

drop policy if exists "productos admin" on public.products;
create policy "productos admin" on public.products
    for all using (public.is_admin()) with check (public.is_admin());

-- Pedidos: lectura para dueños y administradores
drop policy if exists "pedidos lectura" on public.orders;
create policy "pedidos lectura" on public.orders
    for select using (public.is_admin() or user_id = auth.uid());

drop policy if exists "pedidos admin" on public.orders;
create policy "pedidos admin" on public.orders
    for update using (public.is_admin()) with check (public.is_admin());

-- Ítems de pedidos: lectura si se puede ver el pedido
drop policy if exists "lineas lectura" on public.order_items;
create policy "lineas lectura" on public.order_items
    for select using (exists (
        select 1 from public.orders o
        where o.id = order_id and (public.is_admin() or o.user_id = auth.uid())
    ));

-- Reseñas de productos: lectura y creación pública, votos útiles
alter table public.product_reviews enable row level security;

drop policy if exists "reseñas publicas" on public.product_reviews;
create policy "reseñas publicas" on public.product_reviews for select using (true);

drop policy if exists "reseñas insertar" on public.product_reviews;
drop policy if exists "Solo usuarios registrados pueden comentar y calificar" on public.product_reviews;
create policy "Solo usuarios registrados pueden comentar y calificar"
    on public.product_reviews for insert
    to authenticated
    with check (auth.uid() is not null);

drop policy if exists "reseñas votos" on public.product_reviews;
create policy "reseñas votos" on public.product_reviews for update using (true) with check (true);

-- =====================================================================
-- 8. RPC: CREAR PEDIDO TRANSACCIONAL (place_order)
-- =====================================================================
-- Recalcula precios y totales en el servidor, valida stock con bloqueo
-- FOR UPDATE, registra auditoría y descuenta inventario de forma atómica.

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
begin
    if jsonb_array_length(coalesce(p_order -> 'items', '[]'::jsonb)) = 0 then
        raise exception 'El pedido no tiene productos';
    end if;

    -- Extraer tenant_id y sede_id con valores seguros por defecto
    v_tenant_id := coalesce((p_order ->> 'tenantCompanyId')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
    v_sede_id := coalesce((p_order ->> 'sedeId')::uuid, '00000000-0000-0000-0000-000000000010'::uuid);
    v_canal := coalesce(p_order ->> 'canal', 'online');

    insert into public.orders (
        tenant_company_id, sede_id, canal, code, customer, payment_method, subtotal, shipping, total, user_id
    )
    values (
        v_tenant_id,
        v_sede_id,
        v_canal,
        p_order ->> 'code',
        p_order -> 'customer',
        coalesce(p_order ->> 'paymentMethod', 'transfer'),
        0, 0, 0,
        auth.uid()
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

        update public.products set stock = stock - v_qty where id = v_product.id;
    end loop;

    -- Regla de envío: gratis si supera $250.000 COP, o el shipping especificado en el payload, o el costo máximo configurado de los productos.
    v_shipping := case 
        when v_subtotal >= 250000 then 0 
        when (p_order ->> 'shipping') is not null then greatest(0, (p_order ->> 'shipping')::int)
        else v_max_item_shipping 
    end;

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
        jsonb_build_object('code', p_order ->> 'code', 'total', v_subtotal + v_shipping, 'items_count', jsonb_array_length(p_order -> 'items'))
    );

    return v_order_id;
end;
$$;

-- =====================================================================
-- 9. RPC: CONSULTAR PEDIDO POR CÓDIGO (Página de Confirmación)
-- =====================================================================

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

grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.get_order_by_code(text) to anon, authenticated;

-- =====================================================================
-- 10. TRIGGER PARA CREACIÓN AUTOMÁTICA DE PERFIL AL REGISTRARSE
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, full_name, email, role, tenant_company_id, sede_id)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        new.email,
        'customer',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000010'
    )
    on conflict (id) do update set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name);
    return new;
end;
$$;

do $$
begin
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
        after insert on auth.users
        for each row execute function public.handle_new_user();
exception when others then
    null;
end $$;

-- =====================================================================
-- 11. BUCKET DE IMÁGENES (Supabase Storage)
-- =====================================================================

do $$
begin
    insert into storage.buckets (id, name, public)
    values ('product-images', 'product-images', true)
    on conflict (id) do nothing;

    drop policy if exists "imagenes publicas" on storage.objects;
    create policy "imagenes publicas" on storage.objects
        for select using (bucket_id = 'product-images');

    drop policy if exists "imagenes admin" on storage.objects;
    create policy "imagenes admin" on storage.objects
        for all using (bucket_id = 'product-images' and public.is_admin())
        with check (bucket_id = 'product-images' and public.is_admin());
exception when others then
    null;
end $$;

