# 🗄️ DATABASE SETUP — DIGITALMARKET SUPABASE

> **Documento generado para:** DIGITALMARKET SaaS Platform  
> **Motor de base de datos:** Supabase (PostgreSQL)  
> **Estado:** Actualizado con soporte Multi-Tenant de 4 Roles (Client, Seller, Store Owner, Super Admin)

---

## 📐 Arquitectura de Datos Multi-Tenant

DIGITALMARKET es una plataforma SaaS multitienda organizada en una jerarquía empresarial coherente:
- **Super Admin (`super_admin`)**: Administra de forma global la plataforma, aprueba o rechaza solicitudes de tiendas y supervisa todas las transacciones.
- **Dueños de Almacén (`store_owner`)**: Tienen control absoluto sobre su almacén (`stores`), gestionan catálogo (`products`), finanzas (`caja_sessions`), ventas presenciales (`sales`), y su equipo de vendedores (`store_members`).
- **Vendedores (`seller`)**: Personal contratado por un dueño, asociado mediante `store_members` a un almacén. Tiene permisos limitados: vender en POS Express, cambiar estado de pedidos, y ver catálogo en modo lectura (ajustes de stock permitidos, creación/eliminación denegada).
- **Clientes (`client`)**: Compran en los almacenes aprobados, gestionan sus pedidos e información personal.

```
auth.users (Supabase Auth)
    └── profiles           ← role: super_admin | store_owner | seller | client
          ├── store_requests  ← Solicitudes de almacén (status: pending/approved/rejected)
          └── stores          ← Almacenes de barrio
                ├── store_members    ← Vincula vendedores a almacenes
                ├── products         ← Catálogo e inventario
                ├── orders           ← Pedidos del cliente
                ├── sales            ← Ventas (físicas/online)
                └── caja_sessions    ← Arqueo y balance de caja
profiles └── addresses     ← Direcciones de envío
```

---

## 📋 Tablas del Sistema Actualizadas

### 1. `profiles` — Perfiles de Usuario
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK — igual al `id` de `auth.users` |
| `email` | TEXT | Email del usuario |
| `full_name` | TEXT | Nombre completo |
| `role` | TEXT | `super_admin`, `store_owner`, `seller`, `client` |
| `store_id` | INTEGER | FK → `stores.id` (para owners y sellers) |
| `created_at` | TIMESTAMPTZ | Fecha de registro |

### 2. `stores` — Almacenes de Barrio
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL | PK auto-incremental |
| `name` | TEXT | Nombre del almacén |
| `description` | TEXT | Descripción del negocio |
| `address` | TEXT | Dirección física |
| `city` | TEXT | Ciudad |
| `phone` | TEXT | Teléfono de contacto |
| `image` | TEXT | URL de la imagen |
| `owner_id` | UUID | FK → `profiles.id` del dueño |
| `status` | TEXT | `'pending'`, `'approved'`, `'suspended'` |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### 3. `store_requests` — Solicitudes de Almacén
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK auto-generado |
| `user_id` | UUID | FK → `profiles.id` del solicitante (cliente) |
| `store_name` | TEXT | Nombre comercial propuesto |
| `description` | TEXT | Detalle del negocio |
| `address` | TEXT | Dirección comercial |
| `city` | TEXT | Ciudad |
| `phone` | TEXT | Teléfono |
| `status` | TEXT | `'pending'`, `'approved'`, `'rejected'` |
| `reviewed_by` | UUID | FK → `profiles.id` del super admin que revisó |
| `review_note` | TEXT | Nota del rechazo o comentario |
| `store_id` | INTEGER | FK → `stores.id` creado (si se aprobó) |
| `created_at` | TIMESTAMPTZ | Fecha de solicitud |
| `reviewed_at` | TIMESTAMPTZ | Fecha de revisión |

### 4. `store_members` — Vendedores de Tienda
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK auto-generado |
| `store_id` | INTEGER | FK → `stores.id` |
| `user_id` | UUID | FK → `profiles.id` del vendedor |
| `role` | TEXT | `'seller'` |
| `created_at` | TIMESTAMPTZ | Fecha de vinculación |

---

## ⚙️ SQL COMPLETO DE INSTALACIÓN / MIGRACIÓN

> Ejecuta estas sentencias en el editor SQL de Supabase para habilitar las nuevas tablas, triggers y políticas RLS.

```sql
-- =====================================================================
-- 1. EXTENSIONES Y MIGRACIÓN DE ROLES
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modificar restricción de roles en profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'store_owner', 'seller', 'client'));

-- Migrar usuarios existentes con rol 'admin' al nuevo 'store_owner'
UPDATE public.profiles SET role = 'store_owner' WHERE role = 'admin';

-- =====================================================================
-- 2. MODIFICACIONES A STORES
-- =====================================================================
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CONSTRAINT stores_status_check CHECK (status IN ('pending', 'approved', 'suspended')),
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

-- Marcar almacenes previos como aprobados
UPDATE public.stores SET status = 'approved' WHERE status IS NULL OR status = 'pending';

CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);

-- =====================================================================
-- 3. TABLA DE SOLICITUDES DE CREACIÓN (store_requests)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.store_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name  TEXT NOT NULL,
  description TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  city        TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending'
              CONSTRAINT store_requests_status_check
              CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note TEXT DEFAULT '',
  store_id    INTEGER REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_store_requests_user_id ON public.store_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_store_requests_status ON public.store_requests(status);

-- =====================================================================
-- 4. TABLA DE VENDEDORES (store_members)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.store_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'seller'
             CONSTRAINT store_members_role_check CHECK (role IN ('seller')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_members_store_id ON public.store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user_id ON public.store_members(user_id);

-- =====================================================================
-- 5. TRIGGER ACTUALIZADO PARA NUEVOS REGISTROS (handle_new_user)
-- =====================================================================
-- Todos los usuarios registrados por la web entran como 'client'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, store_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'client',
    NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 6. CREACIÓN DE FUNCIONES AUXILIARES (SECURITY DEFINER)
-- =====================================================================
-- Nota: Al ser SECURITY DEFINER, se ejecutan con los privilegios del creador (postgres),
-- saltándose el RLS de forma controlada y evitando recursión infinita en las políticas.

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
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
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_my_store_id(user_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT store_id FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_seller_of_store(user_uuid UUID, p_store_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE user_id = user_uuid AND store_id = p_store_id
  );
$$;

-- =====================================================================
-- 6.1. ELIMINACIÓN SEGURA DE USUARIOS (SECURITY DEFINER)
-- =====================================================================
-- Permite a un Super Admin eliminar usuarios de profiles y auth.users.
-- Previene la auto-eliminación y garantiza que siempre exista al menos
-- 1 Super Admin en el sistema.
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
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'No autenticado');
  END IF;

  IF NOT public.is_super_admin(v_caller_id) THEN
    RETURN json_build_object('success', FALSE, 'message', 'No tienes permisos de Super Admin para realizar esta acción');
  END IF;

  IF v_caller_id = p_user_id THEN
    RETURN json_build_object('success', FALSE, 'message', 'No puedes eliminar tu propia cuenta de administrador');
  END IF;

  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;

  IF v_user_role = 'super_admin' THEN
    SELECT count(*) INTO v_super_admin_count FROM public.profiles WHERE role = 'super_admin';
    IF v_super_admin_count <= 1 THEN
      RETURN json_build_object('success', FALSE, 'message', 'No puedes eliminar al único Super Admin del sistema. Debe quedar al menos un administrador global.');
    END IF;
  END IF;

  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN json_build_object('success', TRUE, 'message', 'Usuario eliminado exitosamente');
END;
$$;

-- =====================================================================
-- 6.2. AUTOMATIZACIÓN DE PEDIDOS ONLINE (TRIGGER)
-- =====================================================================
-- Reduce stock, registra la venta e incrementa saldo de caja abierta
-- de forma segura tras insertar un pedido (evita errores RLS en cliente)
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
  -- 1. Decrementar stock de productos
  IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      UPDATE public.products
      SET stock = GREATEST(0, stock - (v_item->>'quantity')::int)
      WHERE id = (v_item->>'id')::bigint;
    END LOOP;
  END IF;

  -- 2. Insertar registro de venta
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

  -- 3. Actualizar balance e historial de la caja abierta
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
-- 7. POLÍTICAS ROW LEVEL SECURITY (RLS) ACTUALIZADAS (LIBRES DE RECURSIÓN)
-- =====================================================================

-- Asegurar RLS en todas las tablas
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_sessions  ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas antiguas
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_profiles_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_policy" ON public.profiles;

DROP POLICY IF EXISTS "public_read_stores" ON public.stores;
DROP POLICY IF EXISTS "public_read_approved_stores" ON public.stores;
DROP POLICY IF EXISTS "super_admin_read_all_stores" ON public.stores;
DROP POLICY IF EXISTS "admin_update_own_store" ON public.stores;
DROP POLICY IF EXISTS "owner_manage_own_store" ON public.stores;
DROP POLICY IF EXISTS "super_admin_manage_stores" ON public.stores;
DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_update_policy" ON public.stores;
DROP POLICY IF EXISTS "stores_all_super_admin" ON public.stores;

DROP POLICY IF EXISTS "client_read_own_requests" ON public.store_requests;
DROP POLICY IF EXISTS "client_insert_requests" ON public.store_requests;
DROP POLICY IF EXISTS "super_admin_manage_requests" ON public.store_requests;
DROP POLICY IF EXISTS "store_requests_select_policy" ON public.store_requests;
DROP POLICY IF EXISTS "store_requests_insert_policy" ON public.store_requests;
DROP POLICY IF EXISTS "store_requests_super_admin_policy" ON public.store_requests;

DROP POLICY IF EXISTS "members_read" ON public.store_members;
DROP POLICY IF EXISTS "owner_manage_members" ON public.store_members;
DROP POLICY IF EXISTS "store_members_select_policy" ON public.store_members;
DROP POLICY IF EXISTS "store_members_all_policy" ON public.store_members;

DROP POLICY IF EXISTS "public_read_products" ON public.products;
DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
DROP POLICY IF EXISTS "admin_update_products" ON public.products;
DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
DROP POLICY IF EXISTS "staff_manage_products" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_all_policy" ON public.products;

DROP POLICY IF EXISTS "clients_read_own_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_read_store_orders" ON public.orders;
DROP POLICY IF EXISTS "clients_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_update_order_status" ON public.orders;
DROP POLICY IF EXISTS "staff_manage_orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;

DROP POLICY IF EXISTS "admins_read_own_sales" ON public.sales;
DROP POLICY IF EXISTS "admins_insert_sales" ON public.sales;
DROP POLICY IF EXISTS "staff_manage_sales" ON public.sales;
DROP POLICY IF EXISTS "sales_all_policy" ON public.sales;

DROP POLICY IF EXISTS "admins_manage_caja" ON public.caja_sessions;
DROP POLICY IF EXISTS "staff_manage_caja" ON public.caja_sessions;
DROP POLICY IF EXISTS "caja_all_policy" ON public.caja_sessions;

-- -- POLÍTICAS DE PROFILES
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_super_admin(auth.uid()));
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_super_admin(auth.uid()));
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_super_admin_policy" ON public.profiles FOR ALL USING (public.is_super_admin(auth.uid()));

-- -- POLÍTICAS DE STORES
CREATE POLICY "stores_select_policy" ON public.stores FOR SELECT USING (status = 'approved' OR auth.uid() = owner_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "stores_update_policy" ON public.stores FOR UPDATE USING (auth.uid() = owner_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "stores_all_super_admin" ON public.stores FOR ALL USING (public.is_super_admin(auth.uid()));

-- -- POLÍTICAS DE STORE REQUESTS
CREATE POLICY "store_requests_select_policy" ON public.store_requests FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "store_requests_insert_policy" ON public.store_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "store_requests_super_admin_policy" ON public.store_requests FOR ALL USING (public.is_super_admin(auth.uid()));

-- -- POLÍTICAS DE STORE MEMBERS
CREATE POLICY "store_members_select_policy" ON public.store_members FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "store_members_all_policy" ON public.store_members FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()) OR public.is_super_admin(auth.uid()));

-- -- POLÍTICAS DE PRODUCTS
CREATE POLICY "products_select_policy" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_all_policy" ON public.products FOR ALL USING (
  (public.get_my_role(auth.uid()) = 'store_owner' AND public.get_my_store_id(auth.uid()) = store_id) OR
  public.is_seller_of_store(auth.uid(), store_id) OR
  public.is_super_admin(auth.uid())
);

-- -- POLÍTICAS DE ORDERS
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR
  (public.get_my_role(auth.uid()) = 'store_owner' AND public.get_my_store_id(auth.uid()) = store_id) OR
  public.is_seller_of_store(auth.uid(), store_id) OR
  public.is_super_admin(auth.uid())
);
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE USING (
  (public.get_my_role(auth.uid()) = 'store_owner' AND public.get_my_store_id(auth.uid()) = store_id) OR
  public.is_seller_of_store(auth.uid(), store_id) OR
  public.is_super_admin(auth.uid())
);

-- -- POLÍTICAS DE SALES
CREATE POLICY "sales_all_policy" ON public.sales FOR ALL USING (
  (public.get_my_role(auth.uid()) = 'store_owner' AND public.get_my_store_id(auth.uid()) = store_id) OR
  public.is_seller_of_store(auth.uid(), store_id) OR
  public.is_super_admin(auth.uid())
);

-- -- POLÍTICAS DE CAJA SESSIONS
CREATE POLICY "caja_all_policy" ON public.caja_sessions FOR ALL USING (
  (public.get_my_role(auth.uid()) = 'store_owner' AND public.get_my_store_id(auth.uid()) = store_id) OR
  public.is_seller_of_store(auth.uid(), store_id) OR
  public.is_super_admin(auth.uid())
);
```

---

## 🛡️ Creación de Super Administrador

La creación de un Super Administrador está completamente restringida desde el frontend por motivos de seguridad. Para inicializar o promover un administrador global en la plataforma, debes realizarlo directamente desde la base de datos en Supabase.

### 📝 Instrucciones Paso a Paso

1. **Crear usuario en Supabase Auth**:
   - Ingresa a Supabase Console ➔ **Authentication** ➔ **Users** ➔ **Add User** ➔ **Create User**.
   - Ingresa el correo electrónico (ej. `superadmin@digitalmarket.cl`) y una contraseña segura.
   - Presiona **Save**.

2. **Obtener el UUID**:
   - Copia el UUID generado para dicho usuario (identificador de 36 caracteres bajo la columna **User UID**).

3. **Ejecutar Consulta en SQL Editor**:
   - Ve a **SQL Editor** en Supabase Console y ejecuta la consulta SQL que se presenta a continuación para asociar correctamente la cuenta de autenticación e insertar el perfil con rol `super_admin`.

### 💾 SQL para crear y promover el Perfil

Ejecuta el siguiente bloque SQL sustituyendo `'TU_UUID_GENERADO_AQUÍ'` por el UUID copiado en el paso anterior:

```sql
-- Asociar auth.users con profiles y establecer el rol de forma segura
INSERT INTO public.profiles (id, email, full_name, role, store_id)
VALUES (
  'TU_UUID_GENERADO_AQUÍ', 
  'superadmin@digitalmarket.cl', 
  'Administrador Global', 
  'super_admin', 
  NULL
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'super_admin', 
  store_id = NULL;
```

### 🔬 Validaciones Necesarias

Una vez ejecutada la consulta, realiza las siguientes validaciones en la base de datos y en la interfaz:
1. **Asociación de tablas**: Verifica que el campo `id` de `public.profiles` sea idéntico al `id` del registro en `auth.users`.
2. **Restricción de Rol**: Ejecuta `SELECT role FROM public.profiles WHERE id = 'TU_UUID_GENERADO_AQUÍ'` y confirma que el valor retornado sea estrictamente `'super_admin'`.
3. **Acceso a Rutas**: Inicia sesión con la cuenta. Confirma que seas redirigido inmediatamente a `/super-admin` y que intentar acceder a otras rutas de backoffice te redireccione de vuelta.
4. **Verificación de Datos**: Comprueba que desde el dashboard de `/super-admin` puedas listar todas las solicitudes, todos los almacenes y todos los usuarios sin restricciones de RLS.


---

## 👥 VINCULAR VENDEDORES (SELLER) A UN ALMACÉN

El flujo para agregar personal a la tienda es el siguiente:
1. El vendedor debe registrarse en la plataforma (obtendrá rol `client` por defecto).
2. El dueño del almacén ingresa a su panel **"Mi Almacén"** → pestaña **"Vendedores"**.
3. Escribe el correo electrónico del vendedor registrado y pulsa **"Agregar"**.
4. Detrás de escena, la base de datos:
   - Modifica el perfil del usuario: `role = 'seller'`, `store_id = [ID_ALMACÉN]`.
   - Crea un registro en la tabla `store_members` asociando ambos ID.
5. A partir de ese momento, el vendedor iniciará sesión y será redirigido a `/seller` con los privilegios limitados de personal.
