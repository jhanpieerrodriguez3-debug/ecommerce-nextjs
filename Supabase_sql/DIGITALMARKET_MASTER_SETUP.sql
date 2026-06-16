-- =====================================================================
-- DIGITALMARKET — SCRIPT MAESTRO UNIFICADO v3
-- =====================================================================
-- Ejecuta ESTE ÚNICO ARCHIVO en el SQL Editor de Supabase.
-- Corrige el error: column "status" does not exist en tabla stores.
--
-- ORDEN DE EJECUCIÓN:
--   1. Funciones básicas (sin dependencia de tablas faltantes)
--   2. Completar tabla stores (columnas faltantes: status, owner_id, etc.)
--   3. Completar tabla profiles (columna faltante: store_id)
--   4. Crear tablas faltantes: store_requests, store_members
--   5. Función is_seller_of_store (ahora store_members existe)
--   6. Función decrement_product_stock
--   7. Políticas RLS para todas las tablas
-- =====================================================================


-- =====================================================================
-- PASO 1 — FUNCIONES BÁSICAS (sin referencia a tablas faltantes)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_my_store_id(user_uuid UUID)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT store_id FROM public.profiles WHERE id = user_uuid;
$$;


-- =====================================================================
-- PASO 2 — COMPLETAR TABLA: stores
-- =====================================================================
-- Agrega las columnas que el frontend necesita y que pueden no existir aún.
-- IF NOT EXISTS evita error si la columna ya existe.
-- =====================================================================

-- status: usado en RLS (status = 'approved') y en dbService.updateStoreStatus()
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'suspended'));

-- owner_id: FK al propietario del almacén (store_owner)
-- Usado en RLS (owner_id = auth.uid()), en approveStoreRequest() y en store-owner/page.tsx
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS owner_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- description: usado en approveStoreRequest() y en la página de tiendas
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- city: usado en approveStoreRequest()
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';

-- phone: usado en approveStoreRequest()
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- image: usado en getStores() y en la UI de tiendas
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT '';

-- created_at: estándar para ordenar registros
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Índice para búsquedas por owner_id (store-owner necesita su tienda)
CREATE INDEX IF NOT EXISTS idx_stores_owner_id
  ON public.stores (owner_id);

-- Índice para filtrar por status (consulta pública: status = 'approved')
CREATE INDEX IF NOT EXISTS idx_stores_status
  ON public.stores (status);


-- =====================================================================
-- PASO 3 — COMPLETAR TABLA: profiles
-- =====================================================================
-- Agrega columnas que pueden faltar si profiles fue creada minimalmente.
-- =====================================================================

-- role: columna central del sistema multi-tenant
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client'
    CHECK (role IN ('super_admin', 'store_owner', 'seller', 'client'));

-- full_name: usado en getAllStoreRequests() y en todos los dashboards
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';

-- email: usado en getAllStoreRequests() y en el panel de usuarios
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- store_id: FK al almacén del usuario (para store_owner y seller)
-- Usado en get_my_store_id(), approveStoreRequest(), addSellerToStore()
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS store_id BIGINT
    REFERENCES public.stores(id) ON DELETE SET NULL;

-- created_at: para ordenar en getAllUsers()
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Índice para búsquedas por role (getAllUsers filtra por rol)
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

-- Índice para búsquedas por store_id (get_my_store_id)
CREATE INDEX IF NOT EXISTS idx_profiles_store_id
  ON public.profiles (store_id);


-- =====================================================================
-- PASO 4 — CREAR TABLAS FALTANTES
-- =====================================================================

-- ------------------------------------------------------------
-- TABLA: store_requests
-- Solicitudes de creación de almacén (cliente → super_admin)
-- ------------------------------------------------------------
-- Join requerido por getAllStoreRequests():
--   .select('*, profiles!store_requests_user_id_fkey(email, full_name)')
-- El nombre exacto de la FK lo determina Supabase para el join embebido.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_requests (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  store_name   TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  address      TEXT        NOT NULL DEFAULT '',
  city         TEXT        NOT NULL DEFAULT '',
  phone        TEXT        NOT NULL DEFAULT '',
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  UUID,
  review_note  TEXT,
  store_id     BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at  TIMESTAMPTZ,

  CONSTRAINT store_requests_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  CONSTRAINT store_requests_reviewed_by_fkey
    FOREIGN KEY (reviewed_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  CONSTRAINT store_requests_store_id_fkey
    FOREIGN KEY (store_id)
    REFERENCES public.stores(id)
    ON DELETE SET NULL
);

COMMENT ON TABLE public.store_requests IS
  'Solicitudes de creación de almacén enviadas por clientes al super_admin';

CREATE INDEX IF NOT EXISTS idx_store_requests_user_id
  ON public.store_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_store_requests_status
  ON public.store_requests (status);
CREATE INDEX IF NOT EXISTS idx_store_requests_created_at
  ON public.store_requests (created_at DESC);


-- ------------------------------------------------------------
-- TABLA: store_members
-- Relación vendedor (seller) ↔ almacén
-- ------------------------------------------------------------
-- Join requerido por getStoreMembersForStore():
--   .select('*, profiles!store_members_user_id_fkey(email, full_name)')
-- UNIQUE(store_id, user_id) necesario porque addSellerToStore() detecta
-- el error duplicate: !memberErr.message.includes('duplicate')
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_members (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id   BIGINT      NOT NULL,
  user_id    UUID        NOT NULL,
  role       TEXT        NOT NULL DEFAULT 'seller'
                         CHECK (role IN ('seller')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT store_members_store_user_unique
    UNIQUE (store_id, user_id),

  CONSTRAINT store_members_store_id_fkey
    FOREIGN KEY (store_id)
    REFERENCES public.stores(id)
    ON DELETE CASCADE,

  CONSTRAINT store_members_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

COMMENT ON TABLE public.store_members IS
  'Relación vendedor (seller) y su almacén asignado por el store_owner';

CREATE INDEX IF NOT EXISTS idx_store_members_store_id
  ON public.store_members (store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user_id
  ON public.store_members (user_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user_store
  ON public.store_members (user_id, store_id);


-- =====================================================================
-- PASO 5 — is_seller_of_store (store_members ya existe)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_seller_of_store(user_uuid UUID, p_store_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE user_id = user_uuid AND store_id = p_store_id
  );
$$;


-- =====================================================================
-- PASO 6 — decrement_product_stock
-- =====================================================================
-- Requerida por dbService.ts → createOrder():
--   supabase.rpc('decrement_product_stock', { p_product_id, p_quantity })
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id BIGINT,
  p_quantity   INT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id;
$$;


-- =====================================================================
-- PASO 6.2 — FUNCIONES DE GESTIÓN DE VENDEDORES (SECURITY DEFINER)
-- =====================================================================
-- Permiten a los store_owner gestionar vendedores en profiles y store_members
-- saltando el RLS estricto de profiles mediante SECURITY DEFINER de forma segura.

CREATE OR REPLACE FUNCTION public.add_seller_to_store(
  p_store_id BIGINT,
  p_seller_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_seller_profile_id UUID;
  v_seller_role TEXT;
BEGIN
  -- 1. Obtener ID del usuario que llama
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No autenticado');
  END IF;

  -- 2. Verificar que el que llama sea el dueño de la tienda o un super_admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = p_store_id AND owner_id = v_caller_id
    ) OR public.is_super_admin(v_caller_id)
  ) THEN
    RETURN json_build_object('success', FALSE, 'message', 'No tienes permisos para agregar vendedores a esta tienda');
  END IF;

  -- 3. Buscar al vendedor por correo
  SELECT id, role INTO v_seller_profile_id, v_seller_role
  FROM public.profiles
  WHERE email = p_seller_email;

  IF v_seller_profile_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No se encontró un usuario con ese correo electrónico');
  END IF;

  -- 4. Validar que no estemos modificando a un super_admin
  IF v_seller_role = 'super_admin' THEN
    RETURN json_build_object('success', FALSE, 'message', 'No puedes cambiar el rol de un Super Admin');
  END IF;

  -- 5. Actualizar el perfil del vendedor
  UPDATE public.profiles
  SET role = 'seller',
      store_id = p_store_id
  WHERE id = v_seller_profile_id;

  -- 6. Insertar en store_members
  INSERT INTO public.store_members (store_id, user_id, role)
  VALUES (p_store_id, v_seller_profile_id, 'seller')
  ON CONFLICT (store_id, user_id) DO UPDATE
  SET role = 'seller';

  RETURN json_build_object('success', TRUE, 'message', p_seller_email || ' agregado como vendedor exitosamente');
END;
$$;


CREATE OR REPLACE FUNCTION public.remove_seller_from_store_by_member_id(
  p_member_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_store_id BIGINT;
  v_user_id UUID;
BEGIN
  -- 1. Obtener ID del usuario que llama
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No autenticado');
  END IF;

  -- 2. Obtener store_id y user_id de store_members
  SELECT store_id, user_id INTO v_store_id, v_user_id
  FROM public.store_members
  WHERE id = p_member_id;

  IF v_store_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'Miembro no encontrado');
  END IF;

  -- 3. Verificar que el que llama sea el dueño de la tienda o un super_admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = v_store_id AND owner_id = v_caller_id
    ) OR public.is_super_admin(v_caller_id)
  ) THEN
    RETURN json_build_object('success', FALSE, 'message', 'No tienes permisos para eliminar vendedores de esta tienda');
  END IF;

  -- 4. Eliminar de store_members
  DELETE FROM public.store_members
  WHERE id = p_member_id;

  -- 5. Restablecer el rol en profiles a 'client' y store_id a NULL
  UPDATE public.profiles
  SET role = 'client',
      store_id = NULL
  WHERE id = v_user_id AND role = 'seller';

  RETURN json_build_object('success', TRUE, 'message', 'Vendedor eliminado exitosamente');
END;
$$;


-- =====================================================================
-- PASO 6.3 — ELIMINACIÓN SEGURA DE USUARIOS (SECURITY DEFINER)
-- =====================================================================
-- Permite a un Super Admin eliminar usuarios de profiles y auth.users de forma atómica.
-- Evita la auto-eliminación y la eliminación del último Super Admin.
-- Elimina datos relacionados en orden correcto para respetar FK constraints:
--   orders (orders_user_id_fkey sin CASCADE) → store_members → store_requests → profiles → auth.users
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


-- =====================================================================
-- PASO 7 — POLÍTICAS RLS
-- =====================================================================

-- ---------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_policy" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile"      ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile"    ON public.profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile"    ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_profiles"    ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_profiles_v2" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_super_admin_policy" ON public.profiles
  FOR ALL USING (
    public.is_super_admin(auth.uid())
  );


-- ---------------------------------------------------------------
-- RLS: stores
-- (ahora status y owner_id ya existen por el PASO 2)
-- ---------------------------------------------------------------
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_select_policy"        ON public.stores;
DROP POLICY IF EXISTS "stores_update_policy"        ON public.stores;
DROP POLICY IF EXISTS "stores_all_super_admin"      ON public.stores;
DROP POLICY IF EXISTS "public_read_stores"          ON public.stores;
DROP POLICY IF EXISTS "public_read_approved_stores" ON public.stores;
DROP POLICY IF EXISTS "super_admin_read_all_stores" ON public.stores;
DROP POLICY IF EXISTS "admin_update_own_store"      ON public.stores;
DROP POLICY IF EXISTS "owner_manage_own_store"      ON public.stores;
DROP POLICY IF EXISTS "super_admin_manage_stores"   ON public.stores;

CREATE POLICY "stores_select_policy" ON public.stores
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = owner_id
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "stores_update_policy" ON public.stores
  FOR UPDATE USING (
    auth.uid() = owner_id OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "stores_all_super_admin" ON public.stores
  FOR ALL USING (
    public.is_super_admin(auth.uid())
  );


-- ---------------------------------------------------------------
-- RLS: store_requests
-- ---------------------------------------------------------------
ALTER TABLE public.store_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_requests_select_policy"      ON public.store_requests;
DROP POLICY IF EXISTS "store_requests_insert_policy"      ON public.store_requests;
DROP POLICY IF EXISTS "store_requests_update_policy"      ON public.store_requests;
DROP POLICY IF EXISTS "store_requests_delete_policy"      ON public.store_requests;
DROP POLICY IF EXISTS "store_requests_super_admin_policy" ON public.store_requests;
DROP POLICY IF EXISTS "client_read_own_requests"          ON public.store_requests;
DROP POLICY IF EXISTS "client_insert_requests"            ON public.store_requests;
DROP POLICY IF EXISTS "super_admin_manage_requests"       ON public.store_requests;

CREATE POLICY "store_requests_select_policy" ON public.store_requests
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "store_requests_insert_policy" ON public.store_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "store_requests_update_policy" ON public.store_requests
  FOR UPDATE USING (
    public.is_super_admin(auth.uid())
  );

CREATE POLICY "store_requests_delete_policy" ON public.store_requests
  FOR DELETE USING (
    public.is_super_admin(auth.uid())
  );


-- ---------------------------------------------------------------
-- RLS: store_members
-- ---------------------------------------------------------------
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_members_select_policy" ON public.store_members;
DROP POLICY IF EXISTS "store_members_insert_policy" ON public.store_members;
DROP POLICY IF EXISTS "store_members_delete_policy" ON public.store_members;
DROP POLICY IF EXISTS "store_members_all_policy"    ON public.store_members;
DROP POLICY IF EXISTS "members_read"                ON public.store_members;
DROP POLICY IF EXISTS "owner_manage_members"        ON public.store_members;

CREATE POLICY "store_members_select_policy" ON public.store_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "store_members_insert_policy" ON public.store_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "store_members_delete_policy" ON public.store_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
  );


-- ---------------------------------------------------------------
-- RLS: products (si la tabla existe)
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'products') THEN

    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "products_select_policy" ON public.products;
    DROP POLICY IF EXISTS "products_all_policy"    ON public.products;
    DROP POLICY IF EXISTS "public_read_products"   ON public.products;
    DROP POLICY IF EXISTS "admin_insert_products"  ON public.products;
    DROP POLICY IF EXISTS "admin_update_products"  ON public.products;
    DROP POLICY IF EXISTS "admin_delete_products"  ON public.products;
    DROP POLICY IF EXISTS "staff_manage_products"  ON public.products;

    EXECUTE $policy$
      CREATE POLICY "products_select_policy" ON public.products
        FOR SELECT USING (true);
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "products_all_policy" ON public.products
        FOR ALL USING (
          (public.get_my_role(auth.uid()) = 'store_owner'
            AND public.get_my_store_id(auth.uid()) = store_id)
          OR public.is_seller_of_store(auth.uid(), store_id)
          OR public.is_super_admin(auth.uid())
        );
    $policy$;

  END IF;
END $$;


-- ---------------------------------------------------------------
-- RLS: orders (si la tabla existe)
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'orders') THEN

    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "orders_select_policy"       ON public.orders;
    DROP POLICY IF EXISTS "orders_insert_policy"       ON public.orders;
    DROP POLICY IF EXISTS "orders_update_policy"       ON public.orders;
    DROP POLICY IF EXISTS "clients_read_own_orders"    ON public.orders;
    DROP POLICY IF EXISTS "admins_read_store_orders"   ON public.orders;
    DROP POLICY IF EXISTS "clients_insert_orders"      ON public.orders;
    DROP POLICY IF EXISTS "admins_update_order_status" ON public.orders;
    DROP POLICY IF EXISTS "staff_manage_orders"        ON public.orders;

    EXECUTE $policy$
      CREATE POLICY "orders_select_policy" ON public.orders
        FOR SELECT USING (
          auth.uid() = user_id
          OR (public.get_my_role(auth.uid()) = 'store_owner'
              AND public.get_my_store_id(auth.uid()) = store_id)
          OR public.is_seller_of_store(auth.uid(), store_id)
          OR public.is_super_admin(auth.uid())
        );
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "orders_insert_policy" ON public.orders
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "orders_update_policy" ON public.orders
        FOR UPDATE USING (
          (public.get_my_role(auth.uid()) = 'store_owner'
            AND public.get_my_store_id(auth.uid()) = store_id)
          OR public.is_seller_of_store(auth.uid(), store_id)
          OR public.is_super_admin(auth.uid())
        );
    $policy$;

  END IF;
END $$;


-- ---------------------------------------------------------------
-- RLS: sales (si la tabla existe)
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'sales') THEN

    ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "sales_all_policy"      ON public.sales;
    DROP POLICY IF EXISTS "admins_read_own_sales"  ON public.sales;
    DROP POLICY IF EXISTS "admins_insert_sales"    ON public.sales;
    DROP POLICY IF EXISTS "staff_manage_sales"     ON public.sales;

    EXECUTE $policy$
      CREATE POLICY "sales_all_policy" ON public.sales
        FOR ALL USING (
          (public.get_my_role(auth.uid()) = 'store_owner'
            AND public.get_my_store_id(auth.uid()) = store_id)
          OR public.is_seller_of_store(auth.uid(), store_id)
          OR public.is_super_admin(auth.uid())
        );
    $policy$;

  END IF;
END $$;


-- ---------------------------------------------------------------
-- RLS: caja_sessions (si la tabla existe)
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'caja_sessions') THEN

    ALTER TABLE public.caja_sessions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "caja_all_policy"    ON public.caja_sessions;
    DROP POLICY IF EXISTS "admins_manage_caja" ON public.caja_sessions;
    DROP POLICY IF EXISTS "staff_manage_caja"  ON public.caja_sessions;

    EXECUTE $policy$
      CREATE POLICY "caja_all_policy" ON public.caja_sessions
        FOR ALL USING (
          (public.get_my_role(auth.uid()) = 'store_owner'
            AND public.get_my_store_id(auth.uid()) = store_id)
          OR public.is_seller_of_store(auth.uid(), store_id)
          OR public.is_super_admin(auth.uid())
        );
    $policy$;

  END IF;
END $$;


-- =====================================================================
-- PASO 8 — AUTOMATIZACIÓN DE PEDIDOS ONLINE (TRIGGER)
-- =====================================================================
-- Decrementa stock, crea la venta y actualiza la caja automáticamente
-- tras insertar un pedido en public.orders.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_order_sales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_caja_history JSONB;
  v_history_entry JSONB;
  v_new_history JSONB;
  v_sale_id TEXT;
BEGIN
  -- 1. Decrementar stock de los productos del pedido en la tabla public.products
  IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      UPDATE public.products
      SET stock = GREATEST(0, stock - (v_item->>'quantity')::int)
      WHERE id = (v_item->>'id')::bigint;
    END LOOP;
  END IF;

  -- 2. Insertar el registro de venta en la tabla public.sales
  v_sale_id := 'VENTA-' || floor(100 + random() * 900)::text;
  INSERT INTO public.sales (id, store_id, amount, type, details, created_at)
  VALUES (
    v_sale_id,
    NEW.store_id,
    NEW.total,
    'online',
    'Pedido Online ' || NEW.id || ' - Cliente: ' || NEW.customer_name,
    NEW.created_at
  );

  -- 3. Buscar si hay una caja abierta para esta tienda y actualizar balance e historial
  IF EXISTS (
    SELECT 1 FROM public.caja_sessions
    WHERE store_id = NEW.store_id AND is_open = true
  ) THEN
    SELECT history INTO v_caja_history
    FROM public.caja_sessions
    WHERE store_id = NEW.store_id AND is_open = true
    ORDER BY opened_at DESC
    LIMIT 1;

    v_history_entry := json_build_object(
      'time', to_char(now() AT TIME ZONE 'America/Santiago', 'HH24:MI:SS'),
      'type', 'Ingreso Ventas',
      'amount', NEW.total,
      'description', 'Venta Online Pedido ' || NEW.id
    )::jsonb;

    IF v_caja_history IS NULL OR jsonb_typeof(v_caja_history) <> 'array' THEN
      v_new_history := jsonb_build_array(v_history_entry);
    ELSE
      v_new_history := jsonb_build_array(v_history_entry) || v_caja_history;
    END IF;

    UPDATE public.caja_sessions
    SET current_amount = current_amount + NEW.total,
        history = v_new_history
    WHERE store_id = NEW.store_id AND is_open = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_order_sales();


-- =====================================================================
-- VERIFICACIÓN FINAL
-- =====================================================================
-- Ejecuta esta consulta para confirmar el resultado:
--
--   SELECT table_name, column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--   AND table_name IN ('stores', 'profiles', 'store_requests', 'store_members')
--   AND column_name IN ('status', 'owner_id', 'role', 'store_id', 'user_id')
--   ORDER BY table_name, column_name;
--
-- =====================================================================
