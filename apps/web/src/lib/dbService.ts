import { supabase } from "./supabase";

// ==========================================
// TIPOS CENTRALES DEL SISTEMA
// ==========================================

export type UserRole = "super_admin" | "store_owner" | "seller" | "client";

export type StoreStatus = "pending" | "approved" | "suspended";

export type StoreRequestStatus = "pending" | "approved" | "rejected";

export type Store = {
  id: number;
  name: string;
  image: string;
  description: string;
  address: string;
  city?: string;
  phone?: string;
  owner_id?: string;
  status: StoreStatus;
  created_at?: string;
};

export type Product = {
  id: number;
  store_id: number;
  title: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  minStock: number;
  barcode?: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: "seller_invite" | "invite_accepted" | "invite_rejected" | "order_status" | "low_stock" | string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type SellerProfile = {
  user_id: string;
  rut: string;
  full_name: string;
  birthdate: string | null;
  phone: string;
  address: string;
  experience: string;
  created_at: string;
  updated_at: string;
  // joins
  user_email?: string;
};

export type ActivityLog = {
  id: string;
  store_id: number;
  user_id: string | null;
  action_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  // joins
  user_name?: string;
  user_email?: string;
};

export type OrderItem = {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
};

export type Order = {
  id: string;
  store_id: number;
  user_id: string;
  customer_name: string;
  customer_email: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: "Pendiente" | "Preparando" | "Entregado" | "Cancelado";
  date: string;
};

export type Sale = {
  id: string;
  store_id: number;
  amount: number;
  type: "online" | "presencial";
  date: string;
  details: string;
};

export type CajaSession = {
  store_id: number;
  isOpen: boolean;
  baseAmount: number;
  currentAmount: number;
  openedAt: string;
  closedAt: string | null;
  history: {
    time: string;
    type: "Ingreso Ventas" | "Retiro" | "Apertura" | "Cierre";
    amount: number;
    description: string;
  }[];
};

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  store_id?: number;
};

export type StoreRequest = {
  id: string;
  user_id: string;
  store_name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  status: StoreRequestStatus;
  reviewed_by?: string;
  review_note?: string;
  store_id?: number;
  created_at: string;
  reviewed_at?: string;
  // Joins
  user_email?: string;
  user_name?: string;
};

export type StoreMember = {
  id: string;
  store_id: number;
  user_id: string;
  role: "seller";
  created_at: string;
  // Joins
  user_email?: string;
  user_name?: string;
};

export type GlobalStats = {
  totalStores: number;
  pendingStores: number;
  approvedStores: number;
  suspendedStores: number;
  totalUsers: number;
  pendingRequests: number;
};

// ==========================================
// DATOS MOCK / SEMILLA PARA FALLBACK LOCAL
// ==========================================
const DEFAULT_STORES: Store[] = [
  {
    id: 1,
    name: "Almacén Don Tito",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1974&auto=format&fit=crop",
    description: "El almacén de toda la vida en el barrio. Pan fresco recién salido del horno, abarrotes esenciales, lácteos y la mejor atención de Don Tito.",
    address: "Av. Las Condes 8900, Santiago",
    city: "Santiago",
    phone: "+56 9 1234 5678",
    owner_id: undefined,
    status: "approved"
  },
  {
    id: 2,
    name: "Mini Market La Esquina",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop",
    description: "Tu parada rápida para snacks, bebidas frías, helados y productos congelados. Abierto hasta tarde con todo lo que necesitas para tu día.",
    address: "Calle Los Leones 452, Providencia",
    city: "Providencia",
    phone: "+56 9 8765 4321",
    owner_id: undefined,
    status: "approved"
  },
  {
    id: 3,
    name: "La Vega de Providencia",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?q=80&w=1974&auto=format&fit=crop",
    description: "Frutas de temporada seleccionadas, verduras directamente de la vega, huevos de campo y frutos secos para una vida sana y nutritiva.",
    address: "Av. Francisco Bilbao 1230, Providencia",
    city: "Providencia",
    phone: "+56 9 5555 0000",
    owner_id: undefined,
    status: "approved"
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 101, store_id: 1, title: "Pan Batido Recién Horneado (1kg)", price: 2400, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop", category: "Panadería", stock: 4, minStock: 8 },
  { id: 102, store_id: 1, title: "Leche Entera Soprole (1L)", price: 1100, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1965&auto=format&fit=crop", category: "Lácteos", stock: 22, minStock: 5 },
  { id: 103, store_id: 1, title: "Huevos de Campo Extra (Doce)", price: 3600, image: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?q=80&w=2070&auto=format&fit=crop", category: "Abarrotes", stock: 14, minStock: 6 },
  { id: 104, store_id: 1, title: "Arroz Grano Largo G2 (1kg)", price: 1350, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070&auto=format&fit=crop", category: "Abarrotes", stock: 35, minStock: 10 },
  { id: 105, store_id: 1, title: "Aceite Vegetal Natura (1L)", price: 2990, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=2036&auto=format&fit=crop", category: "Abarrotes", stock: 3, minStock: 5 },
  { id: 106, store_id: 1, title: "Coca-Cola Original Sabor (1.5L)", price: 1950, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop", category: "Bebidas", stock: 18, minStock: 8 }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "PED-8762",
    store_id: 1,
    user_id: "client-id-123",
    customer_name: "Gonzalo Valenzuela",
    customer_email: "gonzalo@gmail.com",
    address: "Av. Providencia 2340, Depto 504",
    items: [
      { id: 102, title: "Leche Entera Soprole (1L)", price: 1100, quantity: 3, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1965&auto=format&fit=crop" },
      { id: 103, title: "Huevos de Campo Extra (Doce)", price: 3600, quantity: 1, image: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?q=80&w=2070&auto=format&fit=crop" }
    ],
    total: 6900,
    status: "Pendiente",
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

const DEFAULT_SALES: Sale[] = [
  { id: "VENTA-001", store_id: 1, amount: 14500, type: "presencial", date: new Date(Date.now() - 1000 * 60 * 90).toISOString(), details: "Venta física de mesón: Abarrotes varios" }
];

const DEFAULT_CAJA: CajaSession = {
  store_id: 1,
  isOpen: true,
  baseAmount: 50000,
  currentAmount: 64500,
  openedAt: new Date().toISOString(),
  closedAt: null,
  history: [
    { time: new Date().toLocaleTimeString("es-CL"), type: "Apertura", amount: 50000, description: "Apertura de caja diaria" }
  ]
};

// ==========================================
// SERVICIO DE BASE DE DATOS CENTRALIZADO
// ==========================================
class DatabaseService {
  private cachedProfile: Profile | null = null;
  private profilePromise: Promise<Profile | null> | null = null;

  private getStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    const value = localStorage.getItem(key);
    if (!value) {
      this.setStorage(key, defaultValue);
      return defaultValue;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  // ============================================
  // STORES
  // ============================================
  async getStores(onlyApproved = true): Promise<Store[]> {
    try {
      const bffUrl = process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:4000";
      const res = await fetch(`${bffUrl}/api/stores`);
      if (!res.ok) throw new Error("BFF returned status " + res.status);
      const data = await res.json();
      if (data.success && Array.isArray(data.stores)) {
        const stores = data.stores as Store[];
        return onlyApproved ? stores.filter(s => s.status === "approved") : stores;
      }
      throw new Error("Invalid response format from BFF");
    } catch (bffErr) {
      console.warn("[dbService] Fallback de BFF a Supabase para getStores:", bffErr);
      // Fallback a Supabase directo
      try {
        let query = supabase.from("stores").select("*");
        if (onlyApproved) query = query.eq("status", "approved");
        const { data, error } = await query;
        if (error) throw error;
        return (data as Store[]) || [];
      } catch (dbErr) {
        console.error("[dbService] Error en getStores (Supabase):", dbErr);
        const stores = this.getStorage<Store[]>("digitalmarket_stores", DEFAULT_STORES);
        return onlyApproved ? stores.filter(s => s.status === "approved") : stores;
      }
    }
  }

  async getAllStores(): Promise<Store[]> {
    return this.getStores(false);
  }

  async getStoreById(id: number): Promise<Store | null> {
    try {
      const { data, error } = await supabase.from("stores").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Store;
    } catch {
      const stores = await this.getStores(false);
      return stores.find((s) => s.id === id) || null;
    }
  }

  async updateStoreStatus(storeId: number, status: StoreStatus): Promise<void> {
    try {
      const { error } = await supabase.from("stores").update({ status }).eq("id", storeId);
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error actualizando estado del almacén:", err);
    }
  }

  async createStore(storeData: {
    name: string;
    description: string;
    address: string;
    city: string;
    phone: string;
    owner_id: string;
    status?: StoreStatus;
    image?: string;
  }): Promise<Store> {
    const newStore = {
      name: storeData.name,
      description: storeData.description || "Almacén gestionado digitalmente",
      address: storeData.address || "Dirección por definir",
      city: storeData.city || "",
      phone: storeData.phone || "",
      image: storeData.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1974",
      owner_id: storeData.owner_id,
      status: storeData.status || "pending" as StoreStatus
    };

    try {
      const { data, error } = await supabase.from("stores").insert(newStore).select().single();
      if (error) throw error;
      return data as Store;
    } catch (err) {
      console.warn("[dbService] Error creando tienda en Supabase, usando local:", err);
      const localStores = this.getStorage<Store[]>("digitalmarket_stores", DEFAULT_STORES);
      const generatedId = Date.now();
      const storeWithId: Store = { ...newStore, id: generatedId };
      localStores.push(storeWithId);
      this.setStorage("digitalmarket_stores", localStores);
      return storeWithId;
    }
  }

  // ============================================
  // STORE REQUESTS (SOLICITUDES DE ALMACÉN)
  // ============================================
  async createStoreRequest(requestData: {
    user_id: string;
    store_name: string;
    description: string;
    address: string;
    city: string;
    phone: string;
  }): Promise<StoreRequest> {
    const newRequest = {
      user_id: requestData.user_id,
      store_name: requestData.store_name,
      description: requestData.description,
      address: requestData.address,
      city: requestData.city,
      phone: requestData.phone,
      status: "pending" as StoreRequestStatus
    };

    try {
      const { data, error } = await supabase.from("store_requests").insert(newRequest).select().single();
      if (error) throw error;
      return {
        id: data.id,
        user_id: data.user_id,
        store_name: data.store_name,
        description: data.description,
        address: data.address,
        city: data.city,
        phone: data.phone,
        status: data.status,
        created_at: data.created_at
      };
    } catch (err) {
      console.error("[dbService] Error creando solicitud:", err);
      // Fallback local
      const localReqs = this.getStorage<StoreRequest[]>("digitalmarket_store_requests", []);
      const localReq: StoreRequest = {
        ...newRequest,
        id: "REQ-" + Date.now(),
        created_at: new Date().toISOString()
      };
      localReqs.push(localReq);
      this.setStorage("digitalmarket_store_requests", localReqs);
      return localReq;
    }
  }

  async getStoreRequestsByUser(userId: string): Promise<StoreRequest[]> {
    try {
      const { data, error } = await supabase
        .from("store_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as StoreRequest[]) || [];
    } catch (err) {
      console.error("[dbService] Error en getStoreRequestsByUser:", err);
      const localReqs = this.getStorage<StoreRequest[]>("digitalmarket_store_requests", []);
      return localReqs.filter(r => r.user_id === userId);
    }
  }

  async getAllStoreRequests(): Promise<StoreRequest[]> {
    try {
      const { data, error } = await supabase
        .from("store_requests")
        .select(`
          *,
          profiles!store_requests_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        store_name: row.store_name,
        description: row.description,
        address: row.address,
        city: row.city,
        phone: row.phone,
        status: row.status,
        reviewed_by: row.reviewed_by,
        review_note: row.review_note,
        store_id: row.store_id,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at,
        user_email: row.profiles?.email,
        user_name: row.profiles?.full_name
      }));
    } catch (err) {
      console.error("[dbService] Error en getAllStoreRequests:", err);
      return this.getStorage<StoreRequest[]>("digitalmarket_store_requests", []);
    }
  }

  async approveStoreRequest(requestId: string, reviewerId: string): Promise<void> {
    try {
      // 1. Obtener la solicitud
      const { data: req, error: reqErr } = await supabase
        .from("store_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      if (reqErr || !req) throw reqErr || new Error("Solicitud no encontrada");

      // 2. Crear el almacén con status APPROVED
      const { data: store, error: storeErr } = await supabase
        .from("stores")
        .insert({
          name: req.store_name,
          description: req.description,
          address: req.address,
          city: req.city,
          phone: req.phone,
          owner_id: req.user_id,
          status: "approved",
          image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1974"
        })
        .select()
        .single();
      if (storeErr) throw storeErr;

      // 3. Actualizar el perfil del usuario a store_owner
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ role: "store_owner", store_id: store.id })
        .eq("id", req.user_id);
      if (profileErr) throw profileErr;

      // 4. Actualizar la solicitud
      const { error: updateErr } = await supabase
        .from("store_requests")
        .update({
          status: "approved",
          reviewed_by: reviewerId,
          store_id: store.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", requestId);
      if (updateErr) throw updateErr;
    } catch (err) {
      console.error("[dbService] Error aprobando solicitud:", err);
      // Fallback local
      const reqs = this.getStorage<StoreRequest[]>("digitalmarket_store_requests", []);
      const updated = reqs.map(r =>
        r.id === requestId ? { ...r, status: "approved" as StoreRequestStatus, reviewed_by: reviewerId } : r
      );
      this.setStorage("digitalmarket_store_requests", updated);
    }
  }

  async rejectStoreRequest(requestId: string, reviewerId: string, note: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("store_requests")
        .update({
          status: "rejected",
          reviewed_by: reviewerId,
          review_note: note,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", requestId);
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error rechazando solicitud:", err);
      const reqs = this.getStorage<StoreRequest[]>("digitalmarket_store_requests", []);
      const updated = reqs.map(r =>
        r.id === requestId ? { ...r, status: "rejected" as StoreRequestStatus, review_note: note } : r
      );
      this.setStorage("digitalmarket_store_requests", updated);
    }
  }

  // ============================================
  // STORE MEMBERS (VENDEDORES)
  // ============================================
  async getStoreMembersForStore(storeId: number): Promise<StoreMember[]> {
    try {
      const { data, error } = await supabase
        .from("store_members")
        .select(`
          *,
          profiles!store_members_user_id_fkey(email, full_name)
        `)
        .eq("store_id", storeId);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        store_id: row.store_id,
        user_id: row.user_id,
        role: row.role,
        created_at: row.created_at,
        user_email: row.profiles?.email,
        user_name: row.profiles?.full_name
      }));
    } catch {
      return [];
    }
  }

  async addSellerToStore(storeId: number, sellerEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc("add_seller_to_store", {
        p_store_id: storeId,
        p_seller_email: sellerEmail
      });

      if (error) throw error;
      const res = data as any;
      if (!res || !res.success) {
        return { success: false, message: res?.message || "Error al agregar vendedor" };
      }

      return { success: true, message: res.message };
    } catch (err: any) {
      console.error("[dbService] Error en addSellerToStore:", err);
      return { success: false, message: err?.message || "Error al agregar vendedor" };
    }
  }

  async removeSellerFromStore(memberId: string, userId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc("remove_seller_from_store_by_member_id", {
        p_member_id: memberId
      });
      if (error) throw error;
      const res = data as any;
      if (res && !res.success) {
        throw new Error(res.message);
      }
    } catch (err) {
      console.error("[dbService] Error eliminando vendedor:", err);
    }
  }

  async getSellerStoreId(userId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from("store_members")
        .select("store_id")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data?.store_id || null;
    } catch {
      return null;
    }
  }

  // ============================================
  // GLOBAL STATS (SUPER_ADMIN)
  // ============================================
  async getGlobalStats(): Promise<GlobalStats> {
    try {
      const [storesRes, usersRes, pendingReqsRes] = await Promise.all([
        supabase.from("stores").select("id, status"),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("store_requests").select("id", { count: "exact" }).eq("status", "pending")
      ]);

      const stores = storesRes.data || [];
      return {
        totalStores: stores.length,
        pendingStores: stores.filter((s: any) => s.status === "pending").length,
        approvedStores: stores.filter((s: any) => s.status === "approved").length,
        suspendedStores: stores.filter((s: any) => s.status === "suspended").length,
        totalUsers: usersRes.count || 0,
        pendingRequests: pendingReqsRes.count || 0
      };
    } catch (err) {
      console.error("[dbService] Error en getGlobalStats:", err);
      const stores = this.getStorage<Store[]>("digitalmarket_stores", DEFAULT_STORES);
      return {
        totalStores: stores.length,
        pendingStores: stores.filter(s => s.status === "pending").length,
        approvedStores: stores.filter(s => s.status === "approved").length,
        suspendedStores: stores.filter(s => s.status === "suspended").length,
        totalUsers: 0,
        pendingRequests: 0
      };
    }
  }

  async getAllUsers(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Profile[]) || [];
    } catch (err) {
      console.error("[dbService] Error en getAllUsers:", err);
      return [];
    }
  }

  // ============================================
  // PRODUCTS & INVENTORY
  // ============================================
  async getProducts(storeId?: number): Promise<Product[]> {
    try {
      let query = supabase.from("products").select("*");
      if (storeId) query = query.eq("store_id", storeId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map((item: any) => ({
          id: item.id,
          store_id: item.store_id,
          title: item.title,
          price: Number(item.price),
          image: item.image,
          category: item.category || "General",
          stock: item.stock !== undefined ? item.stock : 15,
          minStock: item.min_stock || 5,
          barcode: item.barcode || undefined
        }));
      }
    } catch {
      // Fallback local
    }

    const localProducts = this.getStorage<Product[]>("digitalmarket_products", DEFAULT_PRODUCTS);
    if (storeId) return localProducts.filter((p) => p.store_id === Number(storeId));
    return localProducts;
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          store_id: product.store_id,
          title: product.title,
          price: product.price,
          image: product.image,
          category: product.category,
          stock: product.stock,
          min_stock: product.minStock,
          barcode: product.barcode || null
        })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          store_id: data.store_id,
          title: data.title,
          price: Number(data.price),
          image: data.image,
          category: data.category,
          stock: data.stock,
          minStock: data.min_stock,
          barcode: data.barcode || undefined
        };
      }
    } catch (err) {
      console.error("[dbService] Error creando producto:", err);
    }

    const products = this.getStorage<Product[]>("digitalmarket_products", DEFAULT_PRODUCTS);
    const newProduct: Product = { ...product, id: Date.now() };
    products.push(newProduct);
    this.setStorage("digitalmarket_products", products);
    return newProduct;
  }

  async updateProductStock(id: number, newStock: number): Promise<void> {
    try {
      const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error actualizando stock:", err);
    }
    const products = this.getStorage<Product[]>("digitalmarket_products", DEFAULT_PRODUCTS);
    this.setStorage("digitalmarket_products", products.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error eliminando producto:", err);
    }
    const products = this.getStorage<Product[]>("digitalmarket_products", DEFAULT_PRODUCTS);
    this.setStorage("digitalmarket_products", products.filter((p) => p.id !== id));
  }

  // ============================================
  // PERFIL DE USUARIO
  // ============================================
  async getCurrentProfile(forceRefresh = false): Promise<Profile | null> {
    if (this.cachedProfile && !forceRefresh) {
      return this.cachedProfile;
    }
    if (this.profilePromise && !forceRefresh) {
      return this.profilePromise;
    }

    this.profilePromise = (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          this.setStorage("digitalmarket_profile", null);
          this.cachedProfile = null;
          return null;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          const profile = data as Profile;
          // Si es seller y no tiene store_id en el perfil, buscarlo en store_members
          if (profile.role === "seller" && !profile.store_id) {
            const storeId = await this.getSellerStoreId(profile.id);
            if (storeId) profile.store_id = storeId;
          }
          this.setStorage("digitalmarket_profile", profile);
          this.cachedProfile = profile;
          return profile;
        } else {
          const meta = user.user_metadata || {};
          const profile: Profile = {
            id: user.id,
            email: user.email || "",
            role: (meta.role as UserRole) || "client",
            full_name: meta.full_name || "Usuario DigitalMarket",
            store_id: meta.store_id ? Number(meta.store_id) : undefined
          };
          this.setStorage("digitalmarket_profile", profile);
          this.cachedProfile = profile;
          return profile;
        }
      } catch (err) {
        console.warn("[dbService] Supabase no disponible. Usando sesión local.");
        const localProf = this.getStorage<Profile | null>("digitalmarket_profile", null);
        this.cachedProfile = localProf;
        return localProf;
      } finally {
        this.profilePromise = null;
      }
    })();

    return this.profilePromise;
  }

  setCurrentProfile(profile: Profile | null): void {
    this.cachedProfile = profile;
    this.setStorage("digitalmarket_profile", profile);
  }

  // ============================================
  // ADDRESSES
  // ============================================
  async getAddresses(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.from("addresses").select("*").eq("user_id", userId);
      if (!error && data) return data;
    } catch {
      // local
    }
    const all = this.getStorage<any[]>("digitalmarket_addresses", []);
    return all.filter((a) => a.user_id === userId);
  }

  async saveAddress(addressData: any): Promise<void> {
    const all = this.getStorage<any[]>("digitalmarket_addresses", []);
    const newAddr = { ...addressData, id: Math.random().toString(36).substring(7) };
    all.push(newAddr);
    this.setStorage("digitalmarket_addresses", all);
    try {
      await supabase.from("addresses").insert(addressData);
    } catch {
      // Ignorar
    }
  }

  // ============================================
  // ORDERS (PEDIDOS)
  // ============================================
  async getOrders(storeId?: number): Promise<Order[]> {
    try {
      let query = supabase.from("orders").select("*");
      if (storeId) query = query.eq("store_id", storeId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map((item: any) => ({
          id: item.id, store_id: item.store_id, user_id: item.user_id,
          customer_name: item.customer_name, customer_email: item.customer_email,
          address: item.address, items: item.items, total: Number(item.total),
          status: item.status, date: item.created_at
        }));
      }
    } catch {
      // Fallback
    }
    const orders = this.getStorage<Order[]>("digitalmarket_orders", DEFAULT_ORDERS);
    if (storeId) return orders.filter((o) => o.store_id === Number(storeId));
    return orders;
  }

  async getClientOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", userId);
      if (error) throw error;
      if (data) {
        return data.map((item: any) => ({
          id: item.id, store_id: item.store_id, user_id: item.user_id,
          customer_name: item.customer_name, customer_email: item.customer_email,
          address: item.address, items: item.items, total: Number(item.total),
          status: item.status, date: item.created_at
        }));
      }
    } catch {
      // Fallback
    }
    const orders = await this.getOrders();
    return orders.filter((o) => o.user_id === userId);
  }

  async createOrder(order: Omit<Order, "id" | "date" | "status">): Promise<Order> {
    const orderId = "PED-" + Math.floor(1000 + Math.random() * 9000);
    const orderData = {
      id: orderId, store_id: order.store_id, user_id: order.user_id,
      customer_name: order.customer_name, customer_email: order.customer_email,
      address: order.address, items: order.items, total: order.total, status: "Pendiente"
    };

    try {
      const { data, error } = await supabase.from("orders").insert(orderData).select().single();
      if (error) throw error;

      if (data) {
        return {
          id: data.id, store_id: data.store_id, user_id: data.user_id,
          customer_name: data.customer_name, customer_email: data.customer_email,
          address: data.address, items: data.items, total: Number(data.total),
          status: data.status, date: data.created_at
        };
      }
    } catch (err) {
      console.error("[dbService] Error al crear pedido:", err);
    }

    // Fallback local
    const orders = this.getStorage<Order[]>("digitalmarket_orders", DEFAULT_ORDERS);
    const newOrder: Order = { ...order, id: orderId, status: "Pendiente", date: new Date().toISOString() };
    orders.unshift(newOrder);
    this.setStorage("digitalmarket_orders", orders);

    const products = await this.getProducts();
    this.setStorage("digitalmarket_products", products.map((p) => {
      const orderItem = order.items.find((item) => item.id === p.id);
      return orderItem ? { ...p, stock: Math.max(0, p.stock - orderItem.quantity) } : p;
    }));

    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error actualizando pedido:", err);
    }
    const orders = await this.getOrders();
    this.setStorage("digitalmarket_orders", orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  // ============================================
  // SALES & POS
  // ============================================
  async getSales(storeId: number): Promise<Sale[]> {
    try {
      const { data, error } = await supabase.from("sales").select("*").eq("store_id", storeId);
      if (error) throw error;
      if (data) {
        return data.map((item: any) => ({
          id: item.id, store_id: item.store_id, amount: Number(item.amount),
          type: item.type, date: item.created_at, details: item.details
        }));
      }
    } catch {
      // Fallback
    }
    return this.getStorage<Sale[]>("digitalmarket_sales", DEFAULT_SALES).filter(s => s.store_id === Number(storeId));
  }

  async registerPresencialSale(storeId: number, amount: number, details: string, type: "presencial" | "online" = "presencial"): Promise<Sale> {
    const saleId = "VENTA-" + Math.floor(100 + Math.random() * 900);
    const saleData = { id: saleId, store_id: storeId, amount, type, details };

    try {
      const { data, error } = await supabase.from("sales").insert(saleData).select().single();
      if (error) throw error;

      const caja = await this.getCajaSession(storeId);
      if (caja.isOpen) {
        await this.updateCajaBalance(storeId, amount, "Ingreso Ventas", `Venta POS: ${details}`);
      }

      if (data) {
        return {
          id: data.id, store_id: data.store_id, amount: Number(data.amount),
          type: data.type, date: data.created_at, details: data.details
        };
      }
    } catch (err) {
      console.error("[dbService] Error registrando venta:", err);
    }

    // Fallback local
    const sales = this.getStorage<Sale[]>("digitalmarket_sales", DEFAULT_SALES);
    const newSale: Sale = { id: saleId, store_id: storeId, amount, type, date: new Date().toISOString(), details };
    sales.unshift(newSale);
    this.setStorage("digitalmarket_sales", sales);

    const cajaLocal = await this.getCajaSession(storeId);
    if (cajaLocal.isOpen) {
      cajaLocal.currentAmount += amount;
      cajaLocal.history.unshift({
        time: new Date().toLocaleTimeString("es-CL"), type: "Ingreso Ventas", amount,
        description: `Venta POS: ${details}`
      });
      this.setStorage(`digitalmarket_caja_${storeId}`, cajaLocal);
    }

    return newSale;
  }

  // ============================================
  // CAJA (CONTROL DE CAJA REGISTRADORA)
  // ============================================
  async getCajaSession(storeId: number): Promise<CajaSession> {
    try {
      const { data, error } = await supabase
        .from("caja_sessions").select("*").eq("store_id", storeId)
        .order("opened_at", { ascending: false }).limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const dbCaja = data[0];
        return {
          store_id: dbCaja.store_id, isOpen: dbCaja.is_open,
          baseAmount: Number(dbCaja.base_amount), currentAmount: Number(dbCaja.current_amount),
          openedAt: dbCaja.opened_at, closedAt: dbCaja.closed_at, history: dbCaja.history || []
        };
      }
    } catch {
      // Fallback
    }

    const cajaKey = `digitalmarket_caja_${storeId}`;
    const defaultData = storeId === 1 ? DEFAULT_CAJA : {
      store_id: storeId, isOpen: false, baseAmount: 0, currentAmount: 0,
      openedAt: "", closedAt: null, history: []
    };
    return this.getStorage<CajaSession>(cajaKey, defaultData);
  }

  async openCaja(storeId: number, baseAmount: number): Promise<CajaSession> {
    const history = [{
      time: new Date().toLocaleTimeString("es-CL"), type: "Apertura" as const,
      amount: baseAmount, description: "Apertura de caja con fondo base"
    }];

    try {
      await supabase.from("caja_sessions")
        .update({ is_open: false, closed_at: new Date().toISOString() })
        .eq("store_id", storeId).eq("is_open", true);

      const { data, error } = await supabase.from("caja_sessions")
        .insert({ store_id: storeId, is_open: true, base_amount: baseAmount, current_amount: baseAmount, history })
        .select().single();
      if (error) throw error;
      if (data) {
        return {
          store_id: data.store_id, isOpen: data.is_open,
          baseAmount: Number(data.base_amount), currentAmount: Number(data.current_amount),
          openedAt: data.opened_at, closedAt: data.closed_at, history: data.history
        };
      }
    } catch (err) {
      console.error("[dbService] Error abriendo caja:", err);
    }

    const cajaKey = `digitalmarket_caja_${storeId}`;
    const newSession: CajaSession = {
      store_id: storeId, isOpen: true, baseAmount, currentAmount: baseAmount,
      openedAt: new Date().toISOString(), closedAt: null, history
    };
    this.setStorage(cajaKey, newSession);
    return newSession;
  }

  async closeCaja(storeId: number): Promise<CajaSession> {
    const caja = await this.getCajaSession(storeId);
    caja.isOpen = false;
    caja.closedAt = new Date().toISOString();
    caja.history.unshift({
      time: new Date().toLocaleTimeString("es-CL"), type: "Cierre",
      amount: caja.currentAmount, description: "Cierre de caja diario"
    });

    try {
      const { data, error } = await supabase.from("caja_sessions")
        .update({ is_open: false, closed_at: caja.closedAt, history: caja.history })
        .eq("store_id", storeId).eq("is_open", true).select();
      if (error) throw error;
      if (data && data.length > 0) {
        const dbCaja = data[0];
        return {
          store_id: dbCaja.store_id, isOpen: dbCaja.is_open,
          baseAmount: Number(dbCaja.base_amount), currentAmount: Number(dbCaja.current_amount),
          openedAt: dbCaja.opened_at, closedAt: dbCaja.closed_at, history: dbCaja.history
        };
      }
    } catch (err) {
      console.error("[dbService] Error cerrando caja:", err);
    }

    const cajaKey = `digitalmarket_caja_${storeId}`;
    this.setStorage(cajaKey, caja);
    return caja;
  }

  async withdrawCaja(storeId: number, amount: number, description: string): Promise<CajaSession> {
    const caja = await this.getCajaSession(storeId);
    caja.currentAmount = Math.max(0, caja.currentAmount - amount);
    caja.history.unshift({
      time: new Date().toLocaleTimeString("es-CL"), type: "Retiro", amount, description
    });

    try {
      const { data, error } = await supabase.from("caja_sessions")
        .update({ current_amount: caja.currentAmount, history: caja.history })
        .eq("store_id", storeId).eq("is_open", true).select();
      if (error) throw error;
      if (data && data.length > 0) {
        const dbCaja = data[0];
        return {
          store_id: dbCaja.store_id, isOpen: dbCaja.is_open,
          baseAmount: Number(dbCaja.base_amount), currentAmount: Number(dbCaja.current_amount),
          openedAt: dbCaja.opened_at, closedAt: dbCaja.closed_at, history: dbCaja.history
        };
      }
    } catch (err) {
      console.error("[dbService] Error registrando retiro:", err);
    }

    const cajaKey = `digitalmarket_caja_${storeId}`;
    this.setStorage(cajaKey, caja);
    return caja;
  }

  private async updateCajaBalance(storeId: number, amount: number, type: "Ingreso Ventas" | "Retiro" | "Apertura" | "Cierre", description: string): Promise<void> {
    try {
      const caja = await this.getCajaSession(storeId);
      if (!caja.isOpen) return;
      const newAmount = caja.currentAmount + amount;
      const history = [...caja.history];
      history.unshift({ time: new Date().toLocaleTimeString("es-CL"), type, amount, description });
      await supabase.from("caja_sessions")
        .update({ current_amount: newAmount, history })
        .eq("store_id", storeId).eq("is_open", true);
    } catch (err) {
      console.error("[dbService] Error actualizando balance de caja:", err);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc("delete_user_by_admin", { p_user_id: userId });
      if (error) {
        const msg = error.message || error.details || error.hint || JSON.stringify(error);
        console.error("[dbService] Error RPC delete_user_by_admin:", msg, "| code:", error.code);
        throw new Error(msg);
      }
      if (data && !data.success) {
        throw new Error(data.message);
      }
    } catch (err: any) {
      const msg = err?.message || err?.details || JSON.stringify(err);
      console.error("[dbService] Error eliminando usuario:", msg);
      throw new Error(msg);
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as AppNotification[];
    } catch (err) {
      console.error("[dbService] Error en getNotifications:", err);
      return [];
    }
  }

  async markNotificationRead(notifId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notifId);
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error marcando notificación leída:", err);
    }
  }

  async markAllNotificationsRead(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error marcando todas leídas:", err);
    }
  }

  // ============================================
  // SELLER INVITATIONS
  // ============================================
  async sendSellerInvite(storeId: number, email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc("send_seller_invite", {
        p_store_id: storeId,
        p_email: email
      });
      if (error) throw error;
      const res = data as { success: boolean; message: string };
      return res;
    } catch (err: any) {
      console.error("[dbService] Error en sendSellerInvite:", err);
      return { success: false, message: err?.message || "Error al enviar invitación" };
    }
  }

  async respondSellerInvite(
    invitationId: string,
    accept: boolean,
    formData?: {
      rut: string; full_name: string; birthdate: string;
      phone: string; address: string; experience: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc("respond_seller_invite", {
        p_invitation_id: invitationId,
        p_accept: accept,
        p_rut: formData?.rut || "",
        p_full_name: formData?.full_name || "",
        p_birthdate: formData?.birthdate || null,
        p_phone: formData?.phone || "",
        p_address: formData?.address || "",
        p_experience: formData?.experience || ""
      });
      if (error) throw error;
      const res = data as { success: boolean; message: string };
      return res;
    } catch (err: any) {
      console.error("[dbService] Error en respondSellerInvite:", err);
      return { success: false, message: err?.message || "Error al responder invitación" };
    }
  }

  // ============================================
  // SELLER PROFILES
  // ============================================
  async getSellerProfiles(storeId: number): Promise<SellerProfile[]> {
    try {
      // Query 1: store_members → profiles (email)
      const { data: members, error: membersError } = await supabase
        .from("store_members")
        .select(`
          user_id,
          profiles!store_members_user_id_fkey(email, full_name)
        `)
        .eq("store_id", storeId)
        .eq("role", "seller");
      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const userIds = members.map((m: any) => m.user_id);

      // Query 2: seller_profiles para esos user_ids (tabla independiente, sin join indirecto)
      const { data: spData, error: spError } = await supabase
        .from("seller_profiles")
        .select("*")
        .in("user_id", userIds);
      // spError no fatal: puede que aún no existan perfiles
      if (spError) console.warn("[dbService] seller_profiles query warn:", spError.message);

      return members.map((member: any) => {
        const sp = (spData || []).find((p: any) => p.user_id === member.user_id);
        return {
          user_id:    member.user_id,
          rut:        sp?.rut        || "",
          full_name:  sp?.full_name  || (member.profiles as any)?.full_name || "Vendedor",
          birthdate:  sp?.birthdate  || null,
          phone:      sp?.phone      || "",
          address:    sp?.address    || "",
          experience: sp?.experience || "",
          created_at: sp?.created_at || "",
          updated_at: sp?.updated_at || "",
          user_email: (member.profiles as any)?.email || "",
        };
      });
    } catch (err) {
      console.error("[dbService] Error en getSellerProfiles:", err);
      return [];
    }
  }

  // ============================================
  // ACTIVITY LOGS
  // ============================================
  async getActivityLogs(storeId: number, limit = 100): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          profiles!activity_logs_user_id_fkey(full_name, email)
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        store_id: row.store_id,
        user_id: row.user_id,
        action_type: row.action_type,
        description: row.description,
        metadata: row.metadata || {},
        created_at: row.created_at,
        user_name: row.profiles?.full_name,
        user_email: row.profiles?.email
      }));
    } catch (err) {
      console.error("[dbService] Error en getActivityLogs:", err);
      // Fallback local
      return this.getStorage<ActivityLog[]>(`digitalmarket_logs_${storeId}`, []).slice(0, limit);
    }
  }

  async logActivity(
    storeId: number,
    actionType: string,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const profile = await this.getCurrentProfile();
    const newLog: ActivityLog = {
      id: "LOG-" + Math.floor(1000 + Math.random() * 9000),
      store_id: storeId,
      user_id: profile?.id || null,
      action_type: actionType,
      description,
      metadata,
      created_at: new Date().toISOString(),
      user_name: profile?.full_name || "Sistema",
      user_email: profile?.email || ""
    };

    // Guardar en fallback local siempre para tener historial inmediato
    const logsKey = `digitalmarket_logs_${storeId}`;
    const localLogs = this.getStorage<ActivityLog[]>(logsKey, []);
    localLogs.unshift(newLog);
    this.setStorage(logsKey, localLogs.slice(0, 200));

    try {
      const { error } = await supabase.rpc("log_activity", {
        p_store_id: storeId,
        p_action_type: actionType,
        p_description: description,
        p_metadata: metadata
      });
      if (error) throw error;
    } catch (err) {
      console.error("[dbService] Error en logActivity (Supabase):", err);
    }
  }
}

export const dbService = new DatabaseService();
