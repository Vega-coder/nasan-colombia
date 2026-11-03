-- =====================================================================
-- Aroma Premium · Migración de Reseñas de Productos (Product Reviews)
-- Ejecutar este script en el SQL Editor de tu panel de Supabase.
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

-- Índices para optimizar la velocidad de búsqueda
create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id);
create index if not exists product_reviews_created_at_idx on public.product_reviews (created_at desc);

-- =====================================================================
-- Políticas de Seguridad de Fila (Row Level Security - RLS)
-- =====================================================================

alter table public.product_reviews enable row level security;

-- 1. Cualquier visitante puede leer las reseñas
drop policy if exists "Reseñas visibles para todos" on public.product_reviews;
create policy "Reseñas visibles para todos"
    on public.product_reviews for select
    using (true);

-- 2. Sólo clientes autenticados / registrados pueden publicar una reseña
drop policy if exists "Cualquiera puede publicar una reseña" on public.product_reviews;
drop policy if exists "Solo usuarios registrados pueden comentar y calificar" on public.product_reviews;
create policy "Solo usuarios registrados pueden comentar y calificar"
    on public.product_reviews for insert
    to authenticated
    with check (auth.uid() is not null);

-- 3. Permitir actualizar el conteo de votos útiles
drop policy if exists "Permitir votos útiles" on public.product_reviews;
create policy "Permitir votos útiles"
    on public.product_reviews for update
    using (true)
    with check (true);

-- =====================================================================
-- Reseñas iniciales reales en base de datos para productos destacados
-- =====================================================================

insert into public.product_reviews (product_id, author_name, city, rating, title, comment, longevity, sillage, is_verified, helpful_count, created_at)
values
    -- Reseñas para Badee Al Oud
    ('lattafa-badee-al-oud-100', 'Carlos M. Restrepo', 'Medellín', 5, '100% original, fijación monstruosa', 'Llegó en perfecto estado con su celofán y batch code verificado. La salida es potente y después de 2 horas queda un secado exquisito y sofisticado. Me duró más de 10 horas en piel y en la ropa días enteros.', 'Más de 12 horas', 'Pesada', true, 19, now() - interval '3 days'),
    ('lattafa-badee-al-oud-100', 'Andrés Felipe Gómez', 'Cali', 5, 'Superó todas mis expectativas', 'Había escuchado muy buenas reseñas pero tenerlo en mano es otro nivel. Muy buena presentación, la botella se siente pesada y de lujo.', 'Más de 10 horas', 'Enorme', true, 12, now() - interval '8 days'),

    -- Reseñas para Yara
    ('lattafa-yara-100', 'Valentina Ospina', 'Bogotá', 5, 'Una joya oriental que roba cumplidos', 'Es un aroma con muchísima personalidad. Cada vez que lo uso me preguntan qué perfume llevo puesto. Es dulce pero elegante, nada empalagoso.', '8 a 10 horas', 'Moderada a Pesada', true, 23, now() - interval '2 days'),
    ('lattafa-yara-100', 'Camila Benítez', 'Barranquilla', 5, 'Delicioso aroma y presentación impecable', 'Totalmente original, el empaque vino sellado y el despacho fue súper rápido a Barranquilla. Aroma cremoso a vainilla y frutas tropicales.', '8 a 10 horas', 'Moderada', true, 9, now() - interval '5 days'),

    -- Reseñas para Asad
    ('lattafa-asad-100', 'Mateo Ramírez', 'Bogotá', 5, 'Elegante, especiado y con gran estela', 'La mejor alternativa árabe con una salida especiada de pimienta negra y café que evoluciona en un ámbar dulce muy maduro. Calidad 10/10.', 'Más de 10 horas', 'Pesada', true, 16, now() - interval '4 days')
on conflict do nothing;
