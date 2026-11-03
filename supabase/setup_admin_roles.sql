-- =====================================================================
-- Aroma Premium · Configuración de Roles y Creación de Administrador
-- Compatible con Supabase (PostgreSQL 15+)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =====================================================================

-- 1. ACTUALIZAR RESTRICCIÓN DE ROLES PERMITIDOS EN PROFILES
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('superadmin', 'admin', 'gerente', 'vendedor', 'cajero', 'bodega', 'customer'));
END $$;

-- 2. MEJORAR EL TRIGGER PARA ASIGNAR ROL DESDE METADATOS AL CREAR USUARIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role text;
BEGIN
    v_role := COALESCE(NULLIF(new.raw_user_meta_data ->> 'role', ''), 'customer');
    
    -- Validar que el rol sea permitido; si no, asignar 'customer'
    IF v_role NOT IN ('superadmin', 'admin', 'gerente', 'vendedor', 'cajero', 'bodega', 'customer') THEN
        v_role := 'customer';
    END IF;

    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        role, 
        tenant_company_id, 
        sede_id
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
        new.email,
        v_role,
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000010'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = CASE 
            WHEN profiles.role = 'customer' AND v_role <> 'customer' THEN v_role 
            ELSE profiles.role 
        END;

    RETURN new;
END;
$$;

-- 3. CREAR O ACTIVAR EL USUARIO ADMINISTRADOR EN AUTH.USERS Y PROFILES
-- (Credenciales por defecto: admin@aromapremium.com / AromaAdmin2026!*)
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'admin@aromapremium.com';
    v_password text := 'AromaAdmin2026!*';
    v_name text := 'Administrador Aroma';
BEGIN
    -- Si el usuario ya existe en auth.users, confirmamos su correo y actualizamos contraseña
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        UPDATE auth.users
        SET 
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            encrypted_password = crypt(v_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object('full_name', v_name, 'role', 'admin'),
            updated_at = now()
        WHERE email = v_email
        RETURNING id INTO v_user_id;
    ELSE
        -- Si no existe, lo insertamos directamente confirmado
        v_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', v_name, 'role', 'admin'),
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
    END IF;

    -- Asegurar perfil en public.profiles con rol 'admin'
    INSERT INTO public.profiles (
        id,
        tenant_company_id,
        sede_id,
        tenant_department_id,
        full_name,
        email,
        role,
        activo
    )
    VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000010',
        'ventas_online',
        v_name,
        v_email,
        'admin',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        activo = true,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    RAISE NOTICE 'Usuario administrador configurado con éxito: %', v_email;
END $$;
