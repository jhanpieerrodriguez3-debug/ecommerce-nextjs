-- =====================================================================
-- MIGRATION: ELIMINACIÓN SEGURA DE USUARIOS (BYPASS RLS EN AUTH.USERS)
-- =====================================================================
-- Ejecuta este script en el SQL Editor de Supabase.
-- Versión 2 — corrige el error FK 23503 al eliminar en orden correcto:
--   orders → store_members → store_requests → profiles → auth.users
-- =====================================================================

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_super_admin_count INT;
  v_user_role TEXT;
BEGIN
  -- 1. Obtener ID del usuario que llama
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No autenticado');
  END IF;

  -- 2. Verificar que el que llama sea Super Admin
  IF NOT public.is_super_admin(v_caller_id) THEN
    RETURN json_build_object('success', FALSE, 'message', 'No tienes permisos de Super Admin para realizar esta acción');
  END IF;

  -- 3. Evitar que un Super Admin se elimine a sí mismo
  IF v_caller_id = p_user_id THEN
    RETURN json_build_object('success', FALSE, 'message', 'No puedes eliminar tu propia cuenta de administrador');
  END IF;

  -- 4. Obtener el rol del usuario a eliminar
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;

  -- 5. Si el usuario a eliminar es Super Admin, verificar que no sea el único
  IF v_user_role = 'super_admin' THEN
    SELECT count(*) INTO v_super_admin_count FROM public.profiles WHERE role = 'super_admin';
    IF v_super_admin_count <= 1 THEN
      RETURN json_build_object('success', FALSE, 'message', 'No puedes eliminar al único Super Admin del sistema. Debe quedar al menos un administrador global.');
    END IF;
  END IF;

  -- 6. Eliminar datos relacionados en orden correcto (FK constraints sin CASCADE)
  -- Primero órdenes (orders_user_id_fkey no tiene ON DELETE CASCADE)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    DELETE FROM public.orders WHERE user_id = p_user_id;
  END IF;
  -- Luego membresías de tienda y solicitudes (tienen CASCADE pero limpiamos explícitamente)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_members') THEN
    DELETE FROM public.store_members WHERE user_id = p_user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_requests') THEN
    DELETE FROM public.store_requests WHERE user_id = p_user_id;
  END IF;

  -- 7. Eliminar el usuario de public.profiles y auth.users de forma atómica
  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN json_build_object('success', TRUE, 'message', 'Usuario eliminado exitosamente');
END;
$$;
