import { supabase } from "./supabase";

export type Store = {
  id: number;
  name: string;
  image: string;
  description: string;
  address: string;
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
  role: "admin" | "client";
  full_name?: string;
  store_id?: number; // Para asociar a un administrador con su almacén
};

// ==========================================
// SEMILLAS DE DATOS (MOCK) COMPLETAMENTE PROFESIONALES
// ==========================================
const DEFAULT_STORES: Store[] = [
  {
    id: 1,
    name: "Almacén Don Tito",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1974&auto=format&fit=crop",
    description: "El almacén de toda la vida en el barrio. Pan fresco recién salido del horno, abarrotes esenciales, lácteos y la mejor atención de Don Tito.",
    address: "Av. Las Condes 8900, Santiago"
  },
  {
    id: 2,
    name: "Mini Market La Esquina",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop",
    description: "Tu parada rápida para snacks, bebidas frías, helados y productos congelados. Abierto hasta tarde con todo lo que necesitas para tu día.",
    address: "Calle Los Leones 452, Providencia"
  },
  {
    id: 3,
    name: "La Vega de Providencia",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?q=80&w=1974&auto=format&fit=crop",
    description: "Frutas de temporada seleccionadas, verduras directamente de la vega, huevos de campo y frutos secos para una vida sana y nutritiva.",
    address: "Av. Francisco Bilbao 1230, Providencia"
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  // Almacén Don Tito (store_id = 1)
  {
    id: 101,
    store_id: 1,
    title: "Pan Batido Recién Horneado (1kg)",
    price: 2400,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop",
    category: "Panadería",
    stock: 4, // Crítico!
    minStock: 8
  },
  {
    id: 102,
    store_id: 1,
    title: "Leche Entera Soprole (1L)",
    price: 1100,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1965&auto=format&fit=crop",
    category: "Lácteos",
    stock: 22,
    minStock: 5
  },
  {
    id: 103,
    store_id: 1,
    title: "Huevos de Campo Extra (Doce)",
    price: 3600,
    image: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?q=80&w=2070&auto=format&fit=crop",
    category: "Abarrotes",
    stock: 14,
    minStock: 6
  },
  {
    id: 104,
    store_id: 1,
    title: "Arroz Grano Largo G2 (1kg)",
    price: 1350,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070&auto=format&fit=crop",
    category: "Abarrotes",
    stock: 35,
    minStock: 10
  },
  {
    id: 105,
    store_id: 1,
    title: "Aceite Vegetal Natura (1L)",
    price: 2990,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=2036&auto=format&fit=crop",
    category: "Abarrotes",
    stock: 3, // Crítico!
    minStock: 5
  },
  {
    id: 106,
    store_id: 1,
    title: "Coca-Cola Original Sabor (1.5L)",
    price: 1950,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop",
    category: "Bebidas",
    stock: 18,
    minStock: 8
  },

  // Mini Market La Esquina (store_id = 2)
  {
    id: 201,
    store_id: 2,
    title: "Papas Fritas Lay's Clásicas (250g)",
    price: 1890,
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=2070&auto=format&fit=crop",
    category: "Snacks",
    stock: 25,
    minStock: 8
  },
  {
    id: 202,
    store_id: 2,
    title: "Bebida Energética Red Bull (250ml)",
    price: 1700,
    image: "https://images.unsplash.com/photo-1622543953495-217e138c8262?q=80&w=2070&auto=format&fit=crop",
    category: "Bebidas",
    stock: 30,
    minStock: 10
  },
  {
    id: 203,
    store_id: 2,
    title: "Helado Magnum Almendras (1u)",
    price: 2100,
    image: "https://images.unsplash.com/photo-1560057003-f4ffc72849a1?q=80&w=1964&auto=format&fit=crop",
    category: "Dulces",
    stock: 2, // Crítico!
    minStock: 5
  },
  {
    id: 204,
    store_id: 2,
    title: "Cerveza Corona Extra (6 Pack)",
    price: 6490,
    image: "https://images.unsplash.com/photo-1600718051056-19c367ff274c?q=80&w=1974&auto=format&fit=crop",
    category: "Bebidas",
    stock: 12,
    minStock: 4
  },
  {
    id: 205,
    store_id: 2,
    title: "Ramitas Saladas Evercrisp (150g)",
    price: 990,
    image: "https://images.unsplash.com/photo-1599490659213-e2b9527b0876?q=80&w=2070&auto=format&fit=crop",
    category: "Snacks",
    stock: 40,
    minStock: 10
  },

  // La Vega de Providencia (store_id = 3)
  {
    id: 301,
    store_id: 3,
    title: "Tomate Limachino Primera (1kg)",
    price: 1600,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1974&auto=format&fit=crop",
    category: "Verdulería",
    stock: 15,
    minStock: 5
  },
  {
    id: 302,
    store_id: 3,
    title: "Paltas Hass Premium (1kg)",
    price: 4990,
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=1975&auto=format&fit=crop",
    category: "Verdulería",
    stock: 8,
    minStock: 4
  },
  {
    id: 303,
    store_id: 3,
    title: "Manzana Roja Selecta (1kg)",
    price: 1400,
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=2074&auto=format&fit=crop",
    category: "Frutas",
    stock: 20,
    minStock: 6
  },
  {
    id: 304,
    store_id: 3,
    title: "Plátano Granel Primera (1kg)",
    price: 1290,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=2080&auto=format&fit=crop",
    category: "Frutas",
    stock: 3, // Crítico!
    minStock: 8
  },
  {
    id: 305,
    store_id: 3,
    title: "Lechuga Costina Hidropónica (1u)",
    price: 1200,
    image: "https://images.unsplash.com/photo-1622484211148-716598e0ec01?q=80&w=1974&auto=format&fit=crop",
    category: "Verdulería",
    stock: 18,
    minStock: 5
  }
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
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString() // hace 30 mins
  },
  {
    id: "PED-3490",
    store_id: 1,
    user_id: "client-id-123",
    customer_name: "María Teresa López",
    customer_email: "maria.teresa@test.com",
    address: "Condominio Los Alerces Casa 12, Las Condes",
    items: [
      { id: 104, title: "Arroz Grano Largo G2 (1kg)", price: 1350, quantity: 2, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070&auto=format&fit=crop" },
      { id: 106, title: "Coca-Cola Original Sabor (1.5L)", price: 1950, quantity: 2, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop" }
    ],
    total: 6600,
    status: "Entregado",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // ayer
  }
];

const DEFAULT_SALES: Sale[] = [
  {
    id: "VENTA-001",
    store_id: 1,
    amount: 14500,
    type: "presencial",
    date: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    details: "Venta física de mesón: Abarrotes varios"
  },
  {
    id: "VENTA-002",
    store_id: 1,
    amount: 8800,
    type: "presencial",
    date: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    details: "Venta física de mesón: Pan Batido y Bebidas"
  },
  {
    id: "VENTA-003",
    store_id: 1,
    amount: 6600,
    type: "online",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: "Orden PED-3490 finalizada"
  }
];

const DEFAULT_CAJA: CajaSession = {
  store_id: 1,
  isOpen: true,
  baseAmount: 50000,
  currentAmount: 73300, // 50000 base + 14500 + 8800
  openedAt: new Date().toISOString(),
  closedAt: null,
  history: [
    { time: new Date(Date.now() - 1000 * 60 * 240).toLocaleTimeString("es-CL"), type: "Apertura", amount: 50000, description: "Apertura de caja diaria" },
    { time: new Date(Date.now() - 1000 * 60 * 90).toLocaleTimeString("es-CL"), type: "Ingreso Ventas", amount: 14500, description: "Venta POS Presencial" },
    { time: new Date(Date.now() - 1000 * 60 * 180).toLocaleTimeString("es-CL"), type: "Ingreso Ventas", amount: 8800, description: "Venta POS Presencial" }
  ]
};

// ==========================================
// CENTRALIZADOR LOCAL-FIRST E INTEGRACIÓN SUPABASE
// ==========================================
class DatabaseService {
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

  // --- STORES ---
  async getStores(): Promise<Store[]> {
    try {
      const { data, error } = await supabase.from("stores").select("*");
      if (error || !data || data.length === 0) throw new Error("Fallback local");
      return data as Store[];
    } catch {
      return this.getStorage<Store[]>("digitalmarket_stores", DEFAULT_STORES);
    }
  }

  async getStoreById(id: number): Promise<Store | null> {
    const stores = await this.getStores();
    return stores.find((s) => s.id === id) || stores[0] || null;
  }

  // --- PRODUCTS & INVENTORY ---
  async getProducts(storeId?: number): Promise<Product[]> {
    let localProducts = this.getStorage<Product[]>("digitalmarket_products", DEFAULT_PRODUCTS);
    
    try {
      const { data, error } = await supabase.from("products").select("*");
      if (!error && data && data.length > 0) {
        // Mapear dinámicamente si no tienen stock o store_id cargado en base de datos
        const dbProducts = data.map((item: any, idx: number) => ({
          id: item.id,
          store_id: item.store_id || (idx % 3) + 1, // distribuir temporalmente
          title: item.title,
          price: item.price,
          image: item.image,
          category: item.category || "Abarrotes",
          stock: item.stock !== undefined ? item.stock : 15,
          minStock: item.minStock || 5
        }));
        
        // Sincronizar en local
        this.setStorage("digitalmarket_products", dbProducts);
        localProducts = dbProducts;
      }
    } catch {
      // Ignorar e ir con localStorage
    }

    if (storeId) {
      return localProducts.filter((p) => p.store_id === Number(storeId));
    }
    return localProducts;
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const products = await this.getProducts();
    const newProduct: Product = {
      ...product,
      id: Date.now()
    };

    products.push(newProduct);
    this.setStorage("digitalmarket_products", products);

    // Intentar escribir en Supabase
    try {
      await supabase.from("products").insert({
        title: product.title,
        price: product.price,
        image: product.image
      });
    } catch {
      // Ignorar fallo
    }

    return newProduct;
  }

  async updateProductStock(id: number, newStock: number): Promise<void> {
    const products = await this.getProducts();
    const updated = products.map((p) => (p.id === id ? { ...p, stock: newStock } : p));
    this.setStorage("digitalmarket_products", updated);
  }

  async deleteProduct(id: number): Promise<void> {
    const products = await this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    this.setStorage("digitalmarket_products", filtered);

    try {
      await supabase.from("products").delete().eq("id", id);
    } catch {
      // Ignorar fallo
    }
  }

  // --- ACTIVE USER SESSION / PROFILE ---
  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          const profile = data as Profile;
          this.setStorage("digitalmarket_profile", profile);
          return profile;
        }
      }
    } catch {
      // Fallback a mock local
    }

    return this.getStorage<Profile | null>("digitalmarket_profile", null);
  }

  setCurrentProfile(profile: Profile | null): void {
    this.setStorage("digitalmarket_profile", profile);
  }

  // --- ADRESSES ---
  async getAddresses(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId);
      if (!error && data) return data;
    } catch {
      // local
    }
    const allAddresses = this.getStorage<any[]>("digitalmarket_addresses", []);
    return allAddresses.filter((a) => a.user_id === userId);
  }

  async saveAddress(addressData: any): Promise<void> {
    const allAddresses = this.getStorage<any[]>("digitalmarket_addresses", []);
    const newAddress = {
      ...addressData,
      id: Math.random().toString(36).substring(7)
    };
    allAddresses.push(newAddress);
    this.setStorage("digitalmarket_addresses", allAddresses);

    try {
      await supabase.from("addresses").insert(addressData);
    } catch {
      // Ignorar
    }
  }

  // --- ORDERS (PEDIDOS SAAS) ---
  async getOrders(storeId?: number): Promise<Order[]> {
    const orders = this.getStorage<Order[]>("digitalmarket_orders", DEFAULT_ORDERS);
    if (storeId) {
      return orders.filter((o) => o.store_id === Number(storeId));
    }
    return orders;
  }

  async getClientOrders(userId: string): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter((o) => o.user_id === userId);
  }

  async createOrder(order: Omit<Order, "id" | "date" | "status">): Promise<Order> {
    const orders = this.getStorage<Order[]>("digitalmarket_orders", DEFAULT_ORDERS);
    const newOrder: Order = {
      ...order,
      id: "PED-" + Math.floor(1000 + Math.random() * 9000),
      status: "Pendiente",
      date: new Date().toISOString()
    };

    orders.unshift(newOrder);
    this.setStorage("digitalmarket_orders", orders);

    // Disminuir stock del inventario
    const products = await this.getProducts();
    const updatedProducts = products.map((p) => {
      const orderItem = order.items.find((item) => item.id === p.id);
      if (orderItem) {
        const remainingStock = Math.max(0, p.stock - orderItem.quantity);
        return { ...p, stock: remainingStock };
      }
      return p;
    });
    this.setStorage("digitalmarket_products", updatedProducts);

    // Sumar saldo a la caja si está abierta y el pedido ingresa
    const caja = await this.getCajaSession(order.store_id);
    if (caja.isOpen) {
      caja.currentAmount += order.total;
      caja.history.unshift({
        time: new Date().toLocaleTimeString("es-CL"),
        type: "Ingreso Ventas",
        amount: order.total,
        description: `Venta Online Pedido ${newOrder.id}`
      });
      this.setStorage(`digitalmarket_caja_${order.store_id}`, caja);
    }

    // Registrar en la lista de ventas
    const sales = this.getStorage<Sale[]>("digitalmarket_sales", DEFAULT_SALES);
    sales.unshift({
      id: "VENTA-" + Math.floor(100 + Math.random() * 900),
      store_id: order.store_id,
      amount: order.total,
      type: "online",
      date: new Date().toISOString(),
      details: `Pedido Online ${newOrder.id} - Cliente: ${order.customer_name}`
    });
    this.setStorage("digitalmarket_sales", sales);

    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    const orders = await this.getOrders();
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    this.setStorage("digitalmarket_orders", updated);
  }

  // --- SALES & POS (REGISTRO DE VENTAS EN TIENDA) ---
  async getSales(storeId: number): Promise<Sale[]> {
    const sales = this.getStorage<Sale[]>("digitalmarket_sales", DEFAULT_SALES);
    return sales.filter((s) => s.store_id === Number(storeId));
  }

  async registerPresencialSale(storeId: number, amount: number, details: string): Promise<Sale> {
    const sales = this.getStorage<Sale[]>("digitalmarket_sales", DEFAULT_SALES);
    const newSale: Sale = {
      id: "VENTA-" + Math.floor(100 + Math.random() * 900),
      store_id: storeId,
      amount,
      type: "presencial",
      date: new Date().toISOString(),
      details
    };

    sales.unshift(newSale);
    this.setStorage("digitalmarket_sales", sales);

    // Sumar a la caja del almacén
    const caja = await this.getCajaSession(storeId);
    if (caja.isOpen) {
      caja.currentAmount += amount;
      caja.history.unshift({
        time: new Date().toLocaleTimeString("es-CL"),
        type: "Ingreso Ventas",
        amount,
        description: `Venta POS Presencial: ${details}`
      });
      this.setStorage(`digitalmarket_caja_${storeId}`, caja);
    }

    return newSale;
  }

  // --- CAJA (CONTROL DE CAJA REGISTRADORA) ---
  async getCajaSession(storeId: number): Promise<CajaSession> {
    const cajaKey = `digitalmarket_caja_${storeId}`;
    // Ajustar si la semilla local tiene otra tienda
    const defaultData = storeId === 1 ? DEFAULT_CAJA : {
      store_id: storeId,
      isOpen: false,
      baseAmount: 0,
      currentAmount: 0,
      openedAt: "",
      closedAt: null,
      history: []
    };
    return this.getStorage<CajaSession>(cajaKey, defaultData);
  }

  async openCaja(storeId: number, baseAmount: number): Promise<CajaSession> {
    const cajaKey = `digitalmarket_caja_${storeId}`;
    const newSession: CajaSession = {
      store_id: storeId,
      isOpen: true,
      baseAmount,
      currentAmount: baseAmount,
      openedAt: new Date().toISOString(),
      closedAt: null,
      history: [
        {
          time: new Date().toLocaleTimeString("es-CL"),
          type: "Apertura",
          amount: baseAmount,
          description: "Apertura de caja con fondo base"
        }
      ]
    };
    this.setStorage(cajaKey, newSession);
    return newSession;
  }

  async closeCaja(storeId: number): Promise<CajaSession> {
    const cajaKey = `digitalmarket_caja_${storeId}`;
    const caja = await this.getCajaSession(storeId);
    
    caja.isOpen = false;
    caja.closedAt = new Date().toISOString();
    caja.history.unshift({
      time: new Date().toLocaleTimeString("es-CL"),
      type: "Cierre",
      amount: caja.currentAmount,
      description: "Cierre de caja diario y balance"
    });
    
    this.setStorage(cajaKey, caja);
    return caja;
  }

  async withdrawCaja(storeId: number, amount: number, description: string): Promise<CajaSession> {
    const cajaKey = `digitalmarket_caja_${storeId}`;
    const caja = await this.getCajaSession(storeId);
    
    caja.currentAmount = Math.max(0, caja.currentAmount - amount);
    caja.history.unshift({
      time: new Date().toLocaleTimeString("es-CL"),
      type: "Retiro",
      amount,
      description
    });
    
    this.setStorage(cajaKey, caja);
    return caja;
  }
}

export const dbService = new DatabaseService();
