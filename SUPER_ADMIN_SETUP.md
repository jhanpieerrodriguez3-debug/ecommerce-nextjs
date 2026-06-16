# 🛡️ GUÍA DE CONFIGURACIÓN DEL SUPER ADMINISTRADOR REAL (SUPABASE)

Esta guía documenta la forma correcta y segura de crear la cuenta principal de administración de **DigitalMarket** utilizando la base de datos Supabase en producción.

Por razones de seguridad:
- El registro público de la aplicación **nunca** permite crear usuarios con rol `super_admin`.
- No existen contraseñas ni correos mágicos hardcodeados en el código frontend.
- Toda promoción a administrador global se realiza manualmente mediante el Editor de SQL de Supabase o por administración directa de la base de datos.

---

## 📋 Pasos para la Creación del Super Administrador

### Paso 1: Crear el usuario en Supabase Auth

1. Ingresa a tu panel de **Supabase Console** (https://supabase.com/dashboard).
2. Ve a la sección **Authentication** (icono de llave en la barra lateral izquierda) ➔ **Users**.
3. Haz clic en el botón **Add User** ➔ **Create User**.
4. Escribe el correo electrónico institucional del administrador (ej. `superadmin@digitalmarket.cl`) y define una contraseña segura.
5. Haz clic en **Save**.

---

### Paso 2: Obtener el UUID del usuario generado

Una vez creado el usuario en la interfaz de Autenticación de Supabase:
1. En la misma tabla de **Users**, localiza el usuario recién creado.
2. Copia el identificador único bajo la columna **User UID** (un identificador de 36 caracteres similar a `d8a29b4e-83c9-4b47-a89e-9d2112e4fbc8`).

---

### Paso 3: Crear el perfil y asignar el rol de Super Admin

Dado que el trigger de creación automática `handle_new_user()` crea por defecto a todos los usuarios como clientes (`client`), debes actualizar su rol directamente en la base de datos utilizando el editor SQL:

1. Ve a la sección **SQL Editor** en Supabase Console.
2. Abre una nueva pestaña de consulta y ejecuta la siguiente instrucción SQL, reemplazando `'TU_UUID_AQUÍ'` por el identificador real que copiaste en el **Paso 2**:

```sql
-- Promover el perfil existente de Supabase Auth a super_admin
UPDATE public.profiles
SET role = 'super_admin',
    store_id = NULL
WHERE id = 'TU_UUID_AQUÍ';
```

> [!NOTE]
> En caso de que desees registrar el perfil manualmente desde cero por si no se ejecutó el trigger, puedes usar un bloque `INSERT ON CONFLICT`:
>
> ```sql
> INSERT INTO public.profiles (id, email, full_name, role, store_id)
> VALUES (
>   'TU_UUID_AQUÍ', 
>   'superadmin@digitalmarket.cl', 
>   'Super Admin DigitalMarket', 
>   'super_admin', 
>   NULL
> )
> ON CONFLICT (id) 
> DO UPDATE SET role = 'super_admin', store_id = NULL;
> ```

---

## 🔍 Verificación del Funcionamiento

Realiza las siguientes comprobaciones para validar la configuración:

1. **Ingreso al Sistema**:
   - Dirígete a la pantalla de inicio de sesión de la aplicación (`/login`).
   - Ingresa con las credenciales que creaste en el **Paso 1** (ej. `superadmin@digitalmarket.cl` y la contraseña manual).

2. **Acceso al Panel de Control**:
   - Una vez autenticado, el sistema debe redirigirte de manera automática a la ruta `/super-admin`.
   - Si intentas navegar manualmente a `/stores` o a `/store-owner`, el `useAuthGuard` detectará tu nivel de acceso y te reconducirá de vuelta a tu consola administrativa global.

3. **Verificación de Privilegios**:
   - En `/super-admin`, valida que puedas ver:
     - La sección **📋 Solicitudes** de creación de almacenes.
     - La sección **🏪 Almacenes** de la plataforma con opciones de suspensión/activación.
     - La sección **👥 Usuarios** que lista todas las cuentas registradas en el sistema.

4. **Persistencia de Sesión**:
   - Cierra el navegador y vuelve a ingresar. Valida que tu sesión persista correctamente con tu rol correspondiente leyendo el perfil desde Supabase.
