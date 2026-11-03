-- =====================================================================
-- MIGRACIÓN: Pirámide Olfativa en 3 Etapas (Salida, Corazón, Fondo/Base)
-- Aroma Premium · Perfumes Árabes
-- =====================================================================

alter table public.products
    add column if not exists top_notes text[] not null default '{}',
    add column if not exists heart_notes text[] not null default '{}',
    add column if not exists base_notes text[] not null default '{}';

comment on column public.products.top_notes is 'Notas de salida: aromas iniciales percibidos en los primeros minutos';
comment on column public.products.heart_notes is 'Notas de corazón: personalidad y cuerpo medio de la fragancia';
comment on column public.products.base_notes is 'Notas de fondo / base: acordes profundos que fijan y perduran';

-- Índices GIN opcionales para búsquedas rápidas por notas individuales
create index if not exists products_top_notes_idx on public.products using gin (top_notes);
create index if not exists products_heart_notes_idx on public.products using gin (heart_notes);
create index if not exists products_base_notes_idx on public.products using gin (base_notes);

-- =====================================================================
-- RELLENAR AUTOMÁTICAMENTE REGISTROS EXISTENTES
-- Si un producto ya tiene notas pero sus 3 etapas están vacías,
-- distribuye las notas automáticamente en Salida, Corazón y Base.
-- =====================================================================
update public.products
set 
  top_notes = case 
    when cardinality(notes) >= 3 then notes[1:ceil(cardinality(notes)::float / 3)::int]
    when cardinality(notes) > 0 then array[notes[1]]
    else '{}'
  end,
  heart_notes = case 
    when cardinality(notes) >= 3 then notes[(ceil(cardinality(notes)::float / 3)::int + 1):(floor(cardinality(notes)::float * 2 / 3)::int)]
    when cardinality(notes) = 2 then array[notes[2]]
    else '{}'
  end,
  base_notes = case 
    when cardinality(notes) >= 3 then notes[(floor(cardinality(notes)::float * 2 / 3)::int + 1):cardinality(notes)]
    when cardinality(notes) = 2 then array[notes[2]]
    else '{}'
  end
where (top_notes is null or cardinality(top_notes) = 0) and cardinality(notes) > 0;

