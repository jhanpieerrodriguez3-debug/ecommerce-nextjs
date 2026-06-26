-- =====================================================================
-- MIGRATION: NOTIFICACIONES, INVITACIONES DE VENDEDOR,
--            HISTORIAL DE ACTIVIDAD Y CÓDIGO DE BARRAS
-- DigitalMarket v2 — Ejecutar en SQL Editor de Supabase
-- =====================================================================

-- =====================================================================
-- 1. COLUMNA BARCODE EN PRODUCTOS
-- =====================================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS barcode TEXT;

CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode)
  WHERE barcode IS NOT NULL;


-- =====================================================================
-- 2. TABLA: notifications
-- Notificaciones para todos los roles del sistema
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL, -- 'seller_invite','invite_accepted','invite_rejected','order_status','low_stock'
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL DEFAULT '',
  data        JSONB       DEFAULT '{}'::jsonb,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON public.notifications (created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "notif_delete" ON public.notifications;

-- Solo el destinatario puede ver sus notificaciones
CREATE POLICY "notif_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Insertar: cualquier usuario autenticado puede crear una notificación para otro
-- (lo controlamos por lógica de negocio en RPCs SECURITY DEFINER)
CREATE POLICY "notif_insert" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Solo el destinatario puede marcar como leída
CREATE POLICY "notif_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notif_delete" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));


-- =====================================================================
-- 3. TABLA: seller_invitations
-- Invitaciones de store_owner a usuarios para convertirse en vendedor
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.seller_invitations (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id        BIGINT      NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  invited_email   TEXT        NOT NULL,
  invited_user_id UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_seller_inv_user    ON public.seller_invitations (invited_user_id);
CREATE INDEX IF NOT EXISTS idx_seller_inv_store   ON public.seller_invitations (store_id);
CREATE INDEX IF NOT EXISTS idx_seller_inv_status  ON public.seller_invitations (status);

ALTER TABLE public.seller_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_select" ON public.seller_invitations;
DROP POLICY IF EXISTS "inv_insert" ON public.seller_invitations;
DROP POLICY IF EXISTS "inv_update" ON public.seller_invitations;

CREATE POLICY "inv_select" ON public.seller_invitations
  FOR SELECT USING (
    auth.uid() = invited_user_id
    OR auth.uid() = invited_by
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "inv_insert" ON public.seller_invitations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "inv_update" ON public.seller_invitations
  FOR UPDATE USING (
    auth.uid() = invited_user_id OR auth.uid() = invited_by
    OR public.is_super_admin(auth.uid())
  );


-- =====================================================================
-- 4. TABLA: seller_profiles
-- Datos adicionales del vendedor (llenado al aceptar invitación)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  user_id      UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rut          TEXT        NOT NULL DEFAULT '',
  full_name    TEXT        NOT NULL DEFAULT '',
  birthdate    DATE,
  phone        TEXT        NOT NULL DEFAULT '',
  address      TEXT        NOT NULL DEFAULT '',
  experience   TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sp_select" ON public.seller_profiles;
DROP POLICY IF EXISTS "sp_insert" ON public.seller_profiles;
DROP POLICY IF EXISTS "sp_update" ON public.seller_profiles;

CREATE POLICY "sp_select" ON public.seller_profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.get_my_role(auth.uid()) = 'store_owner'
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "sp_insert" ON public.seller_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sp_update" ON public.seller_profiles
  FOR UPDATE USING (auth.uid() = user_id);


-- =====================================================================
-- 5. TABLA: activity_logs
-- Historial de movimientos y acciones de negocio
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id     BIGINT      NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type  TEXT        NOT NULL,
  -- 'sale_presencial','sale_online','stock_update','order_status',
  -- 'caja_open','caja_close','invite_sent','invite_accepted','invite_rejected'
  description  TEXT        NOT NULL DEFAULT '',
  metadata     JSONB       DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_store    ON public.activity_logs (store_id);
CREATE INDEX IF NOT EXISTS idx_activity_user     ON public.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created  ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type     ON public.activity_logs (action_type);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "log_select" ON public.activity_logs;
DROP POLICY IF EXISTS "log_insert" ON public.activity_logs;

-- Owner ve todos los logs de su tienda; seller ve solo los suyos; super_admin ve todo
CREATE POLICY "log_select" ON public.activity_logs
  FOR SELECT USING (
    (public.get_my_role(auth.uid()) = 'store_owner' AND public.get_my_store_id(auth.uid()) = store_id)
    OR (auth.uid() = user_id)
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "log_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (true);


-- =====================================================================
-- 6. RPC: send_seller_invite
-- Owner invita a un usuario por email → crea invitación + notificación
-- =====================================================================
CREATE OR REPLACE FUNCTION public.send_seller_invite(
  p_store_id    BIGINT,
  p_email       TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   UUID;
  v_target_id   UUID;
  v_target_role TEXT;
  v_store_name  TEXT;
  v_inv_id      UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No autenticado');
  END IF;

  -- Solo el owner de la tienda o super_admin puede invitar
  IF NOT (
    EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND owner_id = v_caller_id)
    OR public.is_super_admin(v_caller_id)
  ) THEN
    RETURN json_build_object('success', FALSE, 'message', 'No tienes permisos para invitar vendedores a esta tienda');
  END IF;

  -- Buscar usuario por email
  SELECT id, role INTO v_target_id, v_target_role FROM public.profiles WHERE email = p_email;
  IF v_target_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No se encontró un usuario con ese correo electrónico');
  END IF;

  IF v_target_role = 'super_admin' THEN
    RETURN json_build_object('success', FALSE, 'message', 'No puedes invitar a un Super Admin');
  END IF;

  -- Verificar que no haya invitación pendiente
  IF EXISTS (
    SELECT 1 FROM public.seller_invitations
    WHERE store_id = p_store_id AND invited_user_id = v_target_id AND status = 'pending'
  ) THEN
    RETURN json_build_object('success', FALSE, 'message', 'Ya existe una invitación pendiente para este usuario');
  END IF;

  -- Obtener nombre de la tienda
  SELECT name INTO v_store_name FROM public.stores WHERE id = p_store_id;

  -- Crear invitación
  INSERT INTO public.seller_invitations (store_id, invited_email, invited_user_id, invited_by, status)
  VALUES (p_store_id, p_email, v_target_id, v_caller_id, 'pending')
  RETURNING id INTO v_inv_id;

  -- Crear notificación para el usuario invitado
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_target_id,
    'seller_invite',
    '🏪 Invitación de Vendedor',
    'Has sido invitado a unirte como vendedor en ' || v_store_name || '. Acepta para completar tu perfil.',
    json_build_object('invitation_id', v_inv_id, 'store_id', p_store_id, 'store_name', v_store_name)::jsonb
  );

  RETURN json_build_object('success', TRUE, 'message', 'Invitación enviada correctamente a ' || p_email);
END;
$$;


-- =====================================================================
-- 7. RPC: respond_seller_invite
-- Usuario acepta o rechaza la invitación
-- =====================================================================
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


-- =====================================================================
-- 8. RPC: log_activity (helper para el frontend)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.log_activity(
  p_store_id    BIGINT,
  p_action_type TEXT,
  p_description TEXT,
  p_metadata    JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (store_id, user_id, action_type, description, metadata)
  VALUES (p_store_id, auth.uid(), p_action_type, p_description, p_metadata);
END;
$$;


-- =====================================================================
-- 9. TRIGGER: notificar al cliente cuando cambia estado de su pedido
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emoji TEXT;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  v_emoji := CASE NEW.status
    WHEN 'Preparando'  THEN '👨‍🍳'
    WHEN 'Entregado'   THEN '✅'
    WHEN 'Cancelado'   THEN '❌'
    ELSE '📦'
  END;

  -- Notificación al cliente
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.user_id,
    'order_status',
    v_emoji || ' Pedido ' || NEW.status,
    'Tu pedido #' || NEW.id || ' ahora está en estado: ' || NEW.status,
    json_build_object('order_id', NEW.id, 'status', NEW.status)::jsonb
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change();
