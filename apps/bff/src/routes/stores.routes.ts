import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// ==========================================
// TIPO: Estructura de un Almacén
// ==========================================
interface Store {
  id: number;
  name: string;
  description: string;
  address: string;
  image: string;
}

// ==========================================
// DATOS MOCK DE ALMACENES (Fallback)
// ==========================================
const MOCK_STORES: Store[] = [
  {
    id: 1,
    name: "Almacén Don Tito",
    description: "El almacén de toda la vida en el barrio.",
    address: "Av. Las Condes 8900, Santiago",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1974&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Mini Market La Esquina",
    description: "Tu parada rápida para snacks, bebidas frías y helados.",
    address: "Calle Los Leones 452, Providencia",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "La Vega de Providencia",
    description: "Frutas de temporada y verduras directamente de la vega.",
    address: "Av. Francisco Bilbao 1230, Providencia",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?q=80&w=1974&auto=format&fit=crop"
  }
];

// ==========================================
// GET /api/stores
// ==========================================
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("id", { ascending: true });
    
    if (error) throw error;

    res.json({
      success: true,
      source: "bff-aggregated",
      count: data.length,
      stores: data,
      meta: {
        lastUpdated: new Date().toISOString(),
        note: "Datos en tiempo real de Supabase"
      }
    });
  } catch (error: any) {
    console.warn("[BFF] Fallo al obtener almacenes de Supabase, usando fallback:", error.message);
    res.json({
      success: true,
      source: "bff-fallback",
      count: MOCK_STORES.length,
      stores: MOCK_STORES,
      meta: {
        lastUpdated: new Date().toISOString(),
        note: "Fallback a datos locales"
      }
    });
  }
});

// ==========================================
// GET /api/stores/:id
// ==========================================
router.get("/:id", async (req, res) => {
  const storeId = parseInt(req.params.id, 10);

  if (isNaN(storeId)) {
    res.status(400).json({
      success: false,
      message: "El ID del almacén debe ser un número entero válido"
    });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      source: "bff-aggregated",
      store: data
    });
  } catch (error: any) {
    console.warn(`[BFF] Almacén ID ${storeId} no encontrado en Supabase, intentando fallback:`, error.message);
    const store = MOCK_STORES.find((s) => s.id === storeId);

    if (!store) {
      res.status(404).json({
        success: false,
        message: `Almacén con ID ${storeId} no encontrado`
      });
      return;
    }

    res.json({
      success: true,
      source: "bff-fallback",
      store
    });
  }
});

// ==========================================
// GET /api/stores/:id/summary
// ==========================================
router.get("/:id/summary", async (req, res) => {
  const storeId = parseInt(req.params.id, 10);

  if (isNaN(storeId)) {
    res.status(400).json({
      success: false,
      message: "El ID del almacén debe ser un número entero válido"
    });
    return;
  }

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isoToday = startOfToday.toISOString();

    const [storeRes, productsCount, ordersCount, salesToday] = await Promise.all([
      supabase.from("stores").select("*").eq("id", storeId).single(),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId).in("status", ["Pendiente", "Preparando"]),
      supabase.from("sales").select("amount").eq("store_id", storeId).gte("created_at", isoToday)
    ]);

    if (storeRes.error || !storeRes.data) {
      throw new Error(storeRes.error?.message || "Almacén no encontrado en Supabase");
    }

    const totalProducts = productsCount.count || 0;
    const activeOrders = ordersCount.count || 0;
    const todaySales = salesToday.data ? salesToday.data.reduce((sum: number, sale: any) => sum + Number(sale.amount), 0) : 0;

    res.json({
      success: true,
      source: "bff-aggregated",
      summary: {
        store: storeRes.data,
        stats: {
          totalProducts,
          activeOrders,
          todaySales
        }
      }
    });
  } catch (error: any) {
    console.warn(`[BFF] Fallo al generar resumen de almacén ID ${storeId}, usando fallback:`, error.message);
    const store = MOCK_STORES.find((s) => s.id === storeId);

    if (!store) {
      res.status(404).json({
        success: false,
        message: `Almacén con ID ${storeId} no encontrado`
      });
      return;
    }

    res.json({
      success: true,
      source: "bff-fallback",
      summary: {
        store,
        stats: {
          totalProducts: 6,
          activeOrders: 2,
          todaySales: 23300
        }
      }
    });
  }
});

export default router;
