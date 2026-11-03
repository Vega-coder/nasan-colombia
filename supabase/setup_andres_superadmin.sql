-- =====================================================================
-- Aroma Premium · Asignar Superadministrador y Contraseña a Andres Picon
-- Ejecutar en Supabase Dashboard -> SQL Editor -> Run
-- =====================================================================

-- 1. Actualizar contraseña y confirmación de correo en auth.users
UPDATE auth.users
SET 
    encrypted_password = crypt('aromapremium$1986', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = jsonb_build_object('full_name', 'Andres Picon', 'role', 'superadmin'),
    updated_at = now()
WHERE email = 'roanpiov@hotmail.com';

-- 2. Asegurar el rol de superadmin en public.profiles
UPDATE public.profiles
SET 
    role = 'superadmin',
    full_name = 'Andres Picon',
    activo = true
WHERE email = 'roanpiov@hotmail.com';
