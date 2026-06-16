# 🏪 DIGITALMARKET — SaaS de Almacenes de Barrio

> Plataforma SaaS que digitaliza la gestión de pequeños negocios mediante control de inventario, caja registradora, ventas, pedidos online y catálogo digital.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-red?logo=turborepo)](https://turbo.build)
[![pnpm](https://img.shields.io/badge/pnpm-Workspaces-orange?logo=pnpm)](https://pnpm.io)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## 🚀 Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/[usuario]/ecommerce-nextjs.git
cd ecommerce-nextjs

# 2. Instalar dependencias del monorepo completo
pnpm install

# 3. Configurar variables de entorno del frontend
cp apps/web/.env.example apps/web/.env.local
# → Editar apps/web/.env.local con tus claves de Supabase

# 4. Levantar el sistema completo
pnpm dev
```

> ✅ **Sin Supabase**: La aplicación funciona con datos locales (localStorage). No necesitas Supabase para desarrollar o hacer una demo.

---

## 🔐 Credenciales de Demostración

| Rol | Email | Contraseña | Acceso |
|---|---|---|---|
| 🏪 Dueño de Almacén | `admin@test.com` | `123456` | /admin, /dashboard (caja, ventas, inventario) |
| 👤 Cliente Vecino | `client@test.com` | `123456` | /stores, /cart, /checkout, /dashboard |

---

## 🏗️ Arquitectura del Monorepo

```
ecommerce-nextjs/                    ← Raíz del Monorepo (Turborepo)
│
├── apps/
│   ├── web/          :3000          ← Next.js 15 — Frontend + lógica de negocio
│   ├── bff/          :4000          ← Express — Backend For Frontend (agregador)
│   └── users-service/ :5000        ← Express — Gestión de usuarios y autenticación
│
├── packages/
│   ├── eslint-config/               ← Configuración ESLint compartida
│   └── typescript-config/           ← tsconfig base compartida
│
├── DATABASE_SETUP.md                ← 📄 SQL completo para Supabase
├── VERCEL_SETUP.md                  ← 📄 Guía de despliegue en Vercel
├── turbo.json                       ← Configuración de Turborepo
└── pnpm-workspace.yaml              ← Definición de workspaces
```

### Comunicación entre servicios

```
Browser ──→ Next.js :3000 ──→ Supabase (Auth + DB)
               │
               └──→ BFF :4000 ──→ users-service :5000
                                └──→ [Futuros servicios]
```

---

## 📦 Servicios

### 1. `apps/web` — Frontend Next.js (Puerto 3000)
**Responsabilidades:**
- Interfaz de usuario completa (React + Tailwind CSS)
- Dashboards: Panel Admin (caja, inventario, POS) y Panel Cliente (pedidos, direcciones)
- Catálogo de almacenes y flujo de compra completo
- Estado de la aplicación (CartContext, ToastContext, useAuthGuard)
- Persistencia híbrida: Supabase → localStorage (fallback automático)

### 2. `apps/bff` — Backend For Frontend (Puerto 4000)
**Responsabilidades:**
- Punto de entrada único para el frontend hacia los servicios backend
- Proxy de autenticación hacia `users-service`
- Agregación de datos de múltiples fuentes (almacenes + estadísticas)
- Health check del sistema completo
- Punto de extensión para futuros servicios

**Endpoints:**
```
GET  /health              → Estado de todos los servicios
POST /api/users/login     → Proxy de login al users-service
POST /api/users/verify    → Verificación de JWT
GET  /api/users/roles     → Roles disponibles del sistema
GET  /api/stores          → Listado de almacenes (agregado)
GET  /api/stores/:id/summary → Resumen agregado de un almacén
```

### 3. `apps/users-service` — Servicio de Usuarios (Puerto 5000)
**Responsabilidades:**
- Autenticación y emisión de JWT para cuentas de demo
- Gestión de perfiles de usuario
- Información de roles del sistema
- Punto de extensión para Supabase Auth en producción

**Endpoints:**
```
GET  /health              → Health check del servicio
POST /auth/login          → Login con credenciales (mock + Supabase)
POST /auth/verify         → Verificación de token JWT
GET  /profiles/me         → Perfil del usuario autenticado
GET  /profiles/roles      → Roles disponibles
```

---

## 🔄 Flujos del Sistema

### Autenticación
```
1. Usuario → /login → ingresa credenciales
2. Next.js → verifica credenciales mock (admin@test.com / client@test.com)
3. Si Supabase disponible → supabase.auth.signInWithPassword()
4. dbService.setCurrentProfile() → guarda perfil en localStorage
5. useAuthGuard() → protege rutas según rol
6. Navbar → detecta el rol → muestra menú correcto
```

### Flujo de Pedido (E2E)
```
1. Cliente → /stores → selecciona almacén
2. → /stores/[id] → ve catálogo con stock
3. → Agrega productos → CartContext (localStorage)
4. → /cart → revisa carrito + total
5. → /checkout → ingresa dirección + "pagar"
6. → dbService.createOrder():
   a. Crea pedido con código PED-XXXX
   b. Deduce stock de cada producto
   c. Suma total a la caja registradora (si está abierta)
   d. Registra la venta en historial
7. → Pantalla de éxito con recibo
8. Admin → /dashboard → ve el pedido en cola
9. Admin → cambia estado: Pendiente → Preparando → Entregado
```

### Flujo de Inventario
```
Admin → /admin → formulario de producto
→ Selecciona imagen de presets (Unsplash)
→ Define precio, stock, stock mínimo
→ dbService.createProduct() → localStorage + Supabase (si disponible)
→ Semáforo en /stores/[id]:
   Verde → stock > minStock
   Amarillo → stock ≤ minStock (alerta)
   Rojo → stock = 0 (sin disponibilidad)
```

### Flujo de Caja Registradora
```
Admin → /dashboard → "Abrir Caja" → ingresa saldo base
→ dbService.openCaja() → registra apertura con timestamp
→ Cada venta online o POS → suma a currentAmount + agrega al historial
→ Cada retiro → resta de currentAmount + agrega al historial
→ "Cerrar Caja" (doble confirmación) → registra cierre + balance final
```

---

## ⚙️ Comandos Disponibles

```bash
# === DESARROLLO ===
pnpm dev                           # Levanta todos los servicios
pnpm --filter web dev              # Solo el frontend (más rápido)
pnpm --filter bff dev              # Solo el BFF
pnpm --filter users-service dev    # Solo el users-service

# === BUILD ===
pnpm build                         # Build de todos los workspaces
pnpm --filter web build            # Build solo del frontend

# === VALIDACIÓN ===
pnpm lint                          # Lint de todo el monorepo
cd apps/web && pnpm tsc --noEmit   # Verificar TypeScript del frontend

# === DEPENDENCIAS ===
pnpm install                       # Instalar todo el monorepo
pnpm --filter web add [paquete]    # Agregar paquete al frontend
pnpm --filter bff add [paquete]    # Agregar paquete al BFF
```

---

## 🌐 Variables de Entorno

### `apps/web/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
```

### `apps/bff/.env`
```bash
PORT=4000
USERS_SERVICE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### `apps/users-service/.env`
```bash
PORT=5000
JWT_SECRET=digitalmarket_secret_dev
```

---

## 📚 Documentación

| Documento | Descripción |
|---|---|
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | SQL completo para crear las tablas de Supabase |
| [VERCEL_SETUP.md](./VERCEL_SETUP.md) | Guía paso a paso para desplegar en Vercel |

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 15 (App Router) | Frontend + Server Components |
| React | 19 | Biblioteca de UI |
| Tailwind CSS | v4 | Estilos utilitarios |
| Supabase | Latest | Auth + PostgreSQL |
| Express | 5 | BFF y users-service |
| Turborepo | 2 | Orquestación del monorepo |
| pnpm | 9 | Gestor de paquetes con workspaces |
| TypeScript | 5.9 | Tipado estático |

---

## 🎓 Nota Académica

Este proyecto demuestra una arquitectura de monorepo progresiva donde:

1. **El frontend (Next.js)** es autosuficiente con persistencia híbrida local-first.
2. **El BFF** centraliza la comunicación y agrega datos para el cliente.
3. **El users-service** encapsula la lógica de identidad y autenticación.
4. **Supabase** actúa como fuente de verdad para producción, pero no es un requisito de ejecución.

La arquitectura está diseñada para ser **explicada, demostrada y escalada** sin complejidad operacional innecesaria.

---

*DIGITALMARKET — Proyecto de Título 2026*
