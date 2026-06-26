# 🚀 VERCEL DEPLOYMENT GUIDE — DIGITALMARKET

> **Documento generado para:** DIGITALMARKET SaaS Platform — Monorepo Turborepo  
> **Destino de despliegue:** Vercel (Frontend Next.js)  
> **Stack:** Next.js 15 + Turborepo + pnpm + Supabase

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta en [vercel.com](https://vercel.com) (gratuita es suficiente)
- [ ] Cuenta en [supabase.com](https://supabase.com) (gratuita es suficiente)
- [ ] El repositorio en GitHub/GitLab/Bitbucket
- [ ] Variables de entorno de Supabase a mano (URL + ANON_KEY)

---

## 🏗️ Estructura del Monorepo (lo que Vercel necesita entender)

```
ecommerce-nextjs/           ← RAÍZ del repositorio (NO es la app)
├── apps/
│   ├── web/               ← ✅ ESTA es la app Next.js a desplegar
│   ├── bff/               ← Express (no se despliega en Vercel)
│   └── users-service/     ← Express (no se despliega en Vercel)
├── packages/
│   ├── eslint-config/
│   └── typescript-config/
├── turbo.json
└── pnpm-workspace.yaml
```

> ⚠️ **Punto crítico**: Vercel necesita saber que la app está en `apps/web`, no en la raíz.

---

## 🔧 Paso a Paso: Configuración en Vercel

### Paso 1 — Importar el Repositorio

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Haz clic en **"Add New Project"**
3. Selecciona **"Import Git Repository"**
4. Conecta tu cuenta de GitHub y selecciona el repositorio `ecommerce-nextjs`
5. Haz clic en **"Import"**

---

### Paso 2 — Configurar el Proyecto (CRÍTICO para monorepos)

En la pantalla "Configure Project", configura los siguientes campos:

#### 📁 Root Directory
```
apps/web
```
> Esto le dice a Vercel que la aplicación Next.js está dentro de `apps/web`, no en la raíz.

#### 🔨 Build Command
```
cd ../.. && pnpm --filter web build
```
> Este comando sube dos niveles (hasta la raíz del monorepo), instala todas las dependencias compartidas de Turborepo y luego construye únicamente el workspace `web`.

**Alternativa con Turborepo:**
```
cd ../.. && pnpm turbo run build --filter=web
```

#### 📦 Install Command
```
pnpm install
```
> pnpm detectará automáticamente el `pnpm-workspace.yaml` e instalará todas las dependencias del monorepo.

#### 📤 Output Directory
```
.next
```
> Next.js genera su output en `.next`. Vercel lo detecta automáticamente si el Root Directory está bien configurado.

#### 🔧 Framework Preset
```
Next.js
```
> Selecciona Next.js en el dropdown de frameworks.

---

### Paso 3 — Variables de Entorno

En la sección **"Environment Variables"** antes de hacer clic en Deploy:

| Variable | Valor | Ambiente |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[tu-project-id].supabase.co` | Production + Preview + Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[tu-anon-key]` | Production + Preview + Development |

#### ¿Dónde encontrar estos valores en Supabase?
1. Ve a tu proyecto en [app.supabase.com](https://app.supabase.com)
2. Haz clic en **"Project Settings"** (ícono de engranaje)
3. Selecciona **"API"**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> ⚠️ **NUNCA** pongas la `service_role` key como variable `NEXT_PUBLIC_*`. Esa clave solo va en servicios backend.

---

### Paso 4 — Hacer el Deploy

Haz clic en **"Deploy"**. Vercel ejecutará:

```
1. git clone [tu-repo]
2. cd apps/web
3. pnpm install         (desde la raíz gracias al workspace)
4. pnpm --filter web build
5. Serve .next output
```

El primer deploy tarda ~2-3 minutos. Los siguientes son más rápidos gracias al caché de Turbopack.

---

## 🔄 Deploys Automáticos (CI/CD)

Vercel configura automáticamente un webhook en tu repositorio:

| Evento | Resultado |
|---|---|
| Push a `main` | Deploy a **Producción** |
| Push a cualquier otra rama | Deploy a **Preview** (URL temporal) |
| Pull Request abierto | Deploy de Preview automático |

### Para forzar un redeploy manual:
1. Ve a tu proyecto en Vercel Dashboard
2. Pestaña **"Deployments"**
3. Haz clic en los tres puntos `...` del último deploy
4. Selecciona **"Redeploy"**

---

## 🌐 Configuración de Dominio Personalizado (Opcional)

### Para agregar tu propio dominio:
1. Ve a **Project Settings → Domains**
2. Haz clic en **"Add Domain"**
3. Escribe tu dominio (ej: `digitalmarket.cl`)
4. Sigue las instrucciones para configurar los DNS

### Agregar dominio a Supabase Auth:
Una vez tengas el dominio definitivo, actualiza en Supabase:
- **Authentication → URL Configuration → Site URL**: `https://digitalmarket.cl`
- **Redirect URLs**: `https://digitalmarket.cl/**`

---

## 🔀 Variables de Entorno por Ambiente

Vercel permite diferentes valores según el ambiente:

```bash
# Production (rama main)
NEXT_PUBLIC_SUPABASE_URL=https://[produccion].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key-produccion]

# Preview (otras ramas)
NEXT_PUBLIC_SUPABASE_URL=https://[staging].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key-staging]

# Development (local)
NEXT_PUBLIC_SUPABASE_URL=https://[dev].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key-dev]
```

Para separar estos en Vercel Dashboard:
- Ve a **Settings → Environment Variables**
- Para cada variable, puedes elegir en qué ambiente aplica

---

## 📁 Variables de Entorno Locales

Para desarrollo local, crea el archivo en `apps/web/.env.local`:

```bash
# apps/web/.env.local — NO subir a git (ya está en .gitignore)
NEXT_PUBLIC_SUPABASE_URL=https://[tu-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu-anon-key]
```

> El archivo `.env.local` está automáticamente en `.gitignore`. No lo subas al repositorio.

---

## ⚙️ Configuración Avanzada: `vercel.json`

Opcionalmente, puedes crear un archivo `vercel.json` en `apps/web/` para configuración adicional:

```json
{
  "buildCommand": "cd ../.. && pnpm --filter web build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

> `gru1` es la región de São Paulo (Brasil) — la más cercana a Chile para menor latencia.

---

## 🐛 Troubleshooting — Problemas Comunes

### ❌ Error: "No se encuentra el módulo @/..."

**Causa**: Vercel no encuentra los path aliases de TypeScript.

**Solución**: Verificar que `apps/web/tsconfig.json` tenga:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### ❌ Error: "supabaseUrl is required"

**Causa**: Las variables de entorno no están configuradas en Vercel.

**Solución**:
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Haz un **Redeploy** para aplicar los cambios

---

### ❌ Error: "Cannot find module '../../packages/...'"

**Causa**: El Build Command no sube hasta la raíz del monorepo.

**Solución**: Asegúrate de que el Build Command sea:
```
cd ../.. && pnpm --filter web build
```
Y que el **Root Directory** sea `apps/web`.

---

### ❌ Error: "ERR_PNPM_WORKSPACE_PKG_NOT_FOUND"

**Causa**: pnpm no encuentra el workspace correctamente.

**Solución**: Verificar que `pnpm-workspace.yaml` en la raíz contenga:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

### ❌ Error durante el build de TypeScript

**Causa**: Errores de tipado en el código.

**Solución local** (antes de pushear):
```bash
cd apps/web
pnpm tsc --noEmit
```

---

### ❌ Las imágenes de Unsplash no cargan en producción

**Causa**: El dominio de Unsplash no está permitido en `next.config.ts`.

**Solución** (ya configurado en el proyecto):
```typescript
// apps/web/next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  }
};
```

---

### ❌ El middleware de rutas da error en producción

**Causa**: El archivo `middleware.ts` tiene código incompatible con el Edge Runtime de Vercel.

**Solución actual**: El middleware actual (`NextResponse.next()`) es compatible. La protección de rutas está correctamente manejada por el hook `useAuthGuard` en el cliente.

---

## 🧪 Checklist Pre-Deploy

Ejecuta esto antes de hacer push a `main`:

```bash
# 1. Verificar que el build funciona localmente
cd apps/web
pnpm build

# 2. Verificar errores TypeScript
pnpm tsc --noEmit

# 3. Verificar que las variables de entorno están en Vercel
# → Revisar en Vercel Dashboard → Settings → Environment Variables

# 4. Verificar que Supabase está configurado
# → Tablas creadas según DATABASE_SETUP.md
# → URLs en Supabase Auth → URL Configuration

# 5. Prueba del flujo completo
# → Login admin@test.com / 123456
# → Acceso a /admin y /dashboard
# → Login client@test.com / 123456
# → Acceso a /stores → /cart → /checkout
```

---

## 📊 URLs del Proyecto Desplegado

Una vez desplegado, tu proyecto estará disponible en:

| Ambiente | URL |
|---|---|
| Producción | `https://[nombre-proyecto].vercel.app` |
| Preview (por rama) | `https://[nombre-proyecto]-[rama]-[usuario].vercel.app` |
| Local | `http://localhost:3000` |

---

## 🔧 Comandos Útiles para el Monorepo Local

```bash
# Instalar todas las dependencias del monorepo
pnpm install

# Levantar todos los servicios (web + bff + users-service)
pnpm dev

# Levantar solo el frontend
pnpm --filter web dev

# Levantar solo el BFF
pnpm --filter bff dev

# Build solo del frontend
pnpm --filter web build

# Lint de todo el monorepo
pnpm lint

# Agregar un paquete solo al frontend
pnpm --filter web add [nombre-paquete]

# Agregar un paquete de desarrollo al frontend
pnpm --filter web add -D [nombre-paquete]
```

---

*Generado para DIGITALMARKET — Plataforma SaaS de Almacenes de Barrio*
