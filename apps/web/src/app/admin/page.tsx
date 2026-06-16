"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Product } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

const PRESET_IMAGES = [
  { name: "🍞 Pan Batido", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop", cat: "Panadería" },
  { name: "🥛 Leche",      url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1965&auto=format&fit=crop", cat: "Lácteos" },
  { name: "🥚 Huevos",     url: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?q=80&w=2070&auto=format&fit=crop", cat: "Abarrotes" },
  { name: "🥤 Bebida",     url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop", cat: "Bebidas" },
  { name: "🍟 Snacks",     url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=2070&auto=format&fit=crop", cat: "Snacks" },
  { name: "🍅 Tomates",    url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1974&auto=format&fit=crop", cat: "Verdulería" },
  { name: "🥑 Paltas",     url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=1975&auto=format&fit=crop", cat: "Verdulería" },
  { name: "🌾 Arroz",      url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070&auto=format&fit=crop", cat: "Abarrotes" },
];

export default function AdminPage() {
  const { showToast } = useToast();
  const { loading: authLoading, profile } = useAuthGuard(["store_owner", "seller"]);

  const [title, setTitle]       = useState("");
  const [price, setPrice]       = useState("");
  const [image, setImage]       = useState("");
  const [category, setCategory] = useState("Abarrotes");
  const [stock, setStock]       = useState("15");
  const [minStock, setMinStock] = useState("5");
  const [barcode, setBarcode]   = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  // Barcode scanner state
  const [showScanner, setShowScanner]           = useState(false);
  const [scanTarget, setScanTarget]             = useState<"create" | "filter">("create");
  const [barcodeFilter, setBarcodeFilter]       = useState("");

  const storeId = profile?.store_id || 1;
  const isOwner = profile?.role === "store_owner";

  const loadProducts = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await dbService.getProducts(storeId);
      setProducts(data);
    } catch (err) {
      console.error("Error cargando catálogo:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, storeId]);

  useEffect(() => {
    if (!authLoading && profile) void loadProducts();
  }, [authLoading, loadProducts, profile]);

  const handleSelectPreset = (url: string, cat: string) => {
    setImage(url); setCategory(cat);
    showToast("Imagen sugerida aplicada", "info");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) { showToast("Solo el dueño del almacén puede agregar productos", "error"); return; }
    if (!title || !price || !image || !stock || !minStock) {
      showToast("Completa todos los campos del producto", "error"); return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) { showToast("El precio debe ser un número positivo", "error"); return; }

    await dbService.createProduct({
      store_id: storeId, title, price: numPrice, image, category,
      stock: Number(stock), minStock: Number(minStock),
      barcode: barcode.trim() || undefined,
    });
    await dbService.logActivity(storeId, "stock_update", `Producto agregado: ${title} (${category}) — $${numPrice.toLocaleString("es-CL")}${barcode ? ` — cód: ${barcode}` : ""}`);
    showToast(`"${title}" agregado al inventario`, "success");
    setTitle(""); setPrice(""); setImage(""); setStock("15"); setMinStock("5"); setBarcode("");
    void loadProducts();
  };

  const handleAdjustStock = async (prodId: number, adjustment: number, currentStock: number, prodTitle: string) => {
    const newStock = Math.max(0, currentStock + adjustment);
    await dbService.updateProductStock(prodId, newStock);
    await dbService.logActivity(storeId, "stock_update", `Stock ajustado: ${prodTitle} → ${newStock} unidades (cambio: ${adjustment > 0 ? "+" : ""}${adjustment})`);
    showToast("Inventario actualizado", "success");
    void loadProducts();
  };

  const handleDelete = async (id: number, prodTitle: string) => {
    if (!isOwner) { showToast("Solo el dueño puede eliminar productos", "error"); return; }
    await dbService.deleteProduct(id);
    await dbService.logActivity(storeId, "stock_update", `Producto eliminado: ${prodTitle}`);
    showToast("Producto eliminado del inventario", "warning");
    setDeletingProductId(null);
    void loadProducts();
  };

  const handleScanDetected = (code: string) => {
    setShowScanner(false);
    if (scanTarget === "create") {
      setBarcode(code);
      showToast(`Código capturado: ${code}`, "success");
    } else {
      setBarcodeFilter(code);
      showToast(`Filtrando por código: ${code}`, "info");
    }
  };

  // Filtrar productos por barcode si hay filtro activo
  const displayedProducts = barcodeFilter
    ? products.filter(p => p.barcode && p.barcode.toLowerCase().includes(barcodeFilter.toLowerCase()))
    : products;

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10 flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando catálogo...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white">🏪 Control de Inventario</h1>
            <p className="text-gray-400 mt-2">
              {isOwner ? "Administra el stock y catálogo de tu almacén" : "Vista de inventario — modo vendedor (solo lectura para eliminación)"}
            </p>
          </div>
          <Link href={isOwner ? "/store-owner" : "/seller"}
            className="bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.03] transition flex items-center gap-2">
            ← Volver al Panel
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── FORMULARIO (solo STORE_OWNER) ── */}
          {isOwner && (
            <div className="bg-white/5 border border-white/10 rounded-[35px] p-6 space-y-5 h-fit sticky top-28">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">➕ Registrar Producto</h2>
              <form onSubmit={handleCreate} className="space-y-4 text-sm">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Nombre Comercial</label>
                  <input type="text" placeholder="Ej: Harina de Trigo 1kg" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Precio ($)</label>
                    <input type="number" placeholder="Ej: 1450" value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white" required />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Categoría</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-gray-300 cursor-pointer">
                      <option value="Abarrotes">Abarrotes</option>
                      <option value="Lácteos">Pan y Lácteos</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Verdulería">Verdulería</option>
                      <option value="Panadería">Panadería</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Stock Inicial</label>
                    <input type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white" required />
                  </div>
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Mín. Alerta</label>
                    <input type="number" placeholder="Mínimo" value={minStock} onChange={e => setMinStock(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white" required />
                  </div>
                </div>

                {/* CÓDIGO DE BARRAS */}
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">
                    Código de Barras <span className="text-gray-500 text-xs font-normal">(opcional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: 7801234567890"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className="flex-1 bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => { setScanTarget("create"); setShowScanner(true); }}
                      title="Escanear con cámara"
                      className="bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 px-3.5 rounded-xl transition cursor-pointer"
                    >
                      📷
                    </button>
                  </div>
                  {barcode && (
                    <p className="text-cyan-400 text-[10px] font-mono mt-1">✓ Código: {barcode}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Imagen (URL)</label>
                  <input type="text" placeholder="URL o usa un atajo..." value={image} onChange={e => setImage(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-xs text-cyan-300 font-mono" required />
                </div>

                <div className="space-y-2">
                  <label className="text-gray-400 text-xs font-semibold block">💡 Imágenes sugeridas:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button key={idx} type="button" onClick={() => handleSelectPreset(preset.url, preset.cat)}
                        className={`text-[10px] bg-white/5 hover:bg-cyan-500/20 hover:text-white border px-1 py-1.5 rounded-lg font-semibold truncate transition cursor-pointer ${image === preset.url ? "border-cyan-400 text-white bg-cyan-400/10" : "border-white/10 text-gray-400"}`}
                        title={preset.name}>{preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {image && (
                  <div className="relative w-full h-[100px] rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    <Image src={image} alt="Preview" fill className="object-cover opacity-80" />
                    <span className="absolute bottom-2 left-3 text-[10px] bg-black/60 px-2 py-0.5 rounded text-gray-300">Vista Previa</span>
                  </div>
                )}

                <button type="submit" className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 rounded-xl font-black text-white hover:scale-[1.02] transition shadow-lg cursor-pointer">
                  Agregar al Inventario 📥
                </button>
              </form>
            </div>
          )}

          {/* ── LISTADO DE PRODUCTOS ── */}
          <div className={`${isOwner ? "lg:col-span-2" : "lg:col-span-3"} bg-white/5 border border-white/10 rounded-[35px] p-6 md:p-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">📦 Catálogo del Almacén</h2>
                <span className="text-gray-400 text-sm">{displayedProducts.length} de {products.length} productos</span>
              </div>
              {/* Filtro por barcode */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar por código..."
                  value={barcodeFilter}
                  onChange={e => setBarcodeFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-400 w-48"
                />
                <button
                  type="button"
                  onClick={() => { setScanTarget("filter"); setShowScanner(true); }}
                  title="Buscar por cámara"
                  className="bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 px-3 py-2 rounded-xl text-sm transition cursor-pointer"
                >
                  📷
                </button>
                {barcodeFilter && (
                  <button onClick={() => setBarcodeFilter("")}
                    className="bg-white/5 border border-white/10 hover:border-rose-400 text-gray-400 hover:text-rose-300 px-3 py-2 rounded-xl text-xs transition cursor-pointer">
                    ✕ Limpiar
                  </button>
                )}
              </div>
            </div>

            {displayedProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-20">
                {barcodeFilter ? `No se encontró ningún producto con el código "${barcodeFilter}".` : `No hay productos en el inventario. ${isOwner ? "Crea el primero a la izquierda." : ""}`}
              </p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[750px] pr-2">
                {displayedProducts.map(product => {
                  const isCritical = product.stock <= product.minStock;
                  return (
                    <div key={product.id} className="bg-black/30 border border-white/5 hover:border-cyan-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition">
                      <div className="flex items-center gap-4 w-full sm:w-1/2">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <Image src={product.image} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="space-y-0.5 truncate w-full">
                          <span className="text-[10px] bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full font-black uppercase">{product.category}</span>
                          <h3 className="font-black text-white text-base truncate">{product.title}</h3>
                          <p className="text-cyan-400 font-bold text-sm">${product.price.toLocaleString("es-CL")}</p>
                          {product.barcode && (
                            <p className="text-gray-500 text-[10px] font-mono flex items-center gap-1">
                              <span className="opacity-60">〡</span>{product.barcode}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 bg-black/40 border border-white/5 p-3 rounded-xl">
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase block ${isCritical ? "text-rose-400" : "text-emerald-400"}`}>
                            {isCritical ? "⚠️ Stock Bajo" : "✓ Óptimo"}
                          </span>
                          <span className="text-sm font-bold text-white">Stock: {product.stock} u.</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleAdjustStock(product.id, -1, product.stock, product.title)}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-1 rounded text-white text-xs font-black transition cursor-pointer">-1</button>
                          <button onClick={() => handleAdjustStock(product.id, 5, product.stock, product.title)}
                            className="bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 px-2.5 py-1 rounded text-cyan-300 text-xs font-black transition cursor-pointer">+5</button>
                        </div>
                      </div>

                      {isOwner && (
                        deletingProductId === product.id ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-white font-semibold whitespace-nowrap">¿Confirmar?</span>
                            <button onClick={() => void handleDelete(product.id, product.title)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-[10px] font-black cursor-pointer">Sí</button>
                            <button onClick={() => setDeletingProductId(null)} className="bg-white/10 text-gray-300 px-3 py-2 rounded-lg text-[10px] cursor-pointer">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingProductId(product.id)}
                            className="bg-red-950/40 border border-red-500/20 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl text-red-400 text-xs font-bold transition cursor-pointer">
                            Eliminar 🗑️
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BarcodeScanner modal */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScanDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </main>
  );
}