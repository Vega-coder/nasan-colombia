-- =====================================================================
-- Aroma Premium · Restricción de Reseñas a Clientes Registrados / Autenticados
-- Impide que usuarios invitados o no registrados puedan comentar o calificar.
-- =====================================================================

-- 1. Añadir columna user_id en product_reviews si aún no existe
alter table public.product_reviews
    add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists product_reviews_user_id_idx on public.product_reviews (user_id);

-- 2. Asegurar Row Level Security activo
alter table public.product_reviews enable row level security;

-- 3. Los visitantes (público general) pueden leer todas las opiniones
drop policy if exists "reseñas publicas" on public.product_reviews;
drop policy if exists "Reseñas visibles para todos" on public.product_reviews;
create policy "Reseñas visibles para todos"
    on public.product_reviews for select
    using (true);

-- 4. Restricción estricta: Sólo clientes autenticados pueden insertar reseñas y calificaciones
drop policy if exists "reseñas insertar" on public.product_reviews;
drop policy if exists "Cualquiera puede publicar una reseña" on public.product_reviews;
drop policy if exists "Solo usuarios registrados pueden comentar y calificar" on public.product_reviews;

create policy "Solo usuarios registrados pueden comentar y calificar"
    on public.product_reviews for insert
    to authenticated
    with check (auth.uid() is not null);

-- 5. Votos de utilidad: restringidos o permitidos
drop policy if exists "reseñas votos" on public.product_reviews;
drop policy if exists "Permitir votos útiles" on public.product_reviews;
create policy "Permitir votos útiles"
    on public.product_reviews for update
    using (true)
    with check (true);
