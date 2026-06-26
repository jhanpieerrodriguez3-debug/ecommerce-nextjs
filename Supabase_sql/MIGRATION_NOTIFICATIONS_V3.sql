-- =====================================================================
-- MIGRATION V3: ACTUALIZAR RESPOND_SELLER_INVITE Y SINCRONIZAR NOMBRES
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- 1. Actualizar la función para incluir el full_name en profiles al aceptar
CREATE OR REPLACE FUNCTION public.respond_seller_invite(
  p_invitation_id UUID,
  p_accept        BOOLEAN,
  p_rut           TEXT    DEFAULT '',
  p_full_name     TEXT    DEFAULT '',
  p_birthdate     TEXT    DEFAULT NULL,
  p_phone         TEXT    DEFAULT '',
  p_address       TEXT    DEFAULT '',
  p_experience    TEXT    DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   UUID;
  v_inv         RECORD;
  v_store_name  TEXT;
  v_owner_id    UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No autenticado');
  END IF;

  -- Obtener la invitación
  SELECT * INTO v_inv FROM public.seller_invitations WHERE id = p_invitation_id;
  IF v_inv IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'Invitación no encontrada');
  END IF;

  IF v_inv.invited_user_id != v_caller_id THEN
    RETURN json_build_object('success', FALSE, 'message', 'Esta invitación no es para ti');
  END IF;

  IF v_inv.status != 'pending' THEN
    RETURN json_build_object('success', FALSE, 'message', 'Esta invitación ya fue respondida');
  END IF;

  -- Obtener datos de la tienda
  SELECT name, owner_id INTO v_store_name, v_owner_id FROM public.stores WHERE id = v_inv.store_id;

  IF p_accept THEN
    -- Actualizar invitación
    UPDATE public.seller_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = p_invitation_id;

    -- Guardar perfil de vendedor
    INSERT INTO public.seller_profiles (user_id, rut, full_name, birthdate, phone, address, experience)
    VALUES (
      v_caller_id,
      p_rut,
      p_full_name,
      CASE WHEN p_birthdate IS NOT NULL AND p_birthdate != '' THEN p_birthdate::date ELSE NULL END,
      p_phone,
      p_address,
      p_experience
    )
    ON CONFLICT (user_id) DO UPDATE
    SET rut = p_rut, full_name = p_full_name,
        birthdate = CASE WHEN p_birthdate IS NOT NULL AND p_birthdate != '' THEN p_birthdate::date ELSE NULL END,
        phone = p_phone, address = p_address, experience = p_experience, updated_at = now();

    -- Actualizar rol, tienda y nombre completo en profiles
    UPDATE public.profiles
    SET role = 'seller', store_id = v_inv.store_id, full_name = p_full_name
    WHERE id = v_caller_id;

    -- Agregar a store_members
    INSERT INTO public.store_members (store_id, user_id, role)
    VALUES (v_inv.store_id, v_caller_id, 'seller')
    ON CONFLICT (store_id, user_id) DO UPDATE SET role = 'seller';

    -- Notificar al owner
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_owner_id,
      'invite_accepted',
      '✅ Invitación Aceptada',
      p_full_name || ' ha aceptado unirse como vendedor de ' || v_store_name || '.',
      json_build_object('seller_id', v_caller_id, 'store_id', v_inv.store_id)::jsonb
    );

    -- Log de actividad
    INSERT INTO public.activity_logs (store_id, user_id, action_type, description)
    VALUES (v_inv.store_id, v_caller_id, 'invite_accepted', p_full_name || ' aceptó la invitación de vendedor');

  ELSE
    -- Rechazar
    UPDATE public.seller_invitations
    SET status = 'rejected', responded_at = now()
    WHERE id = p_invitation_id;

    -- Notificar al owner
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_owner_id,
      'invite_rejected',
      '❌ Invitación Rechazada',
      'Un usuario rechazó la invitación de vendedor en ' || v_store_name || '.',
      json_build_object('store_id', v_inv.store_id)::jsonb
    );
  END IF;

  RETURN json_build_object('success', TRUE, 'message', CASE WHEN p_accept THEN 'Invitación aceptada exitosamente' ELSE 'Invitación rechazada' END);
END;
$$;


-- 2. Sincronizar nombres para los vendedores existentes (de seller_profiles a profiles)
UPDATE public.profiles p
SET full_name = sp.full_name
FROM public.seller_profiles sp
WHERE p.id = sp.user_id AND (p.full_name IS NULL OR p.full_name = '' OR p.full_name = 'Usuario DigitalMarket');
