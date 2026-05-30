"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Product } from "@/lib/dbService";
import { useToast } from "@/context/ToastContext";

// PRESETS DE IMÁGENES ULTRA PRÁCTICOS PARA PRESENTACIONES
const PRESET_IMAGES = [
  { name: "🍞 Pan Batido", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop", cat: "Panadería" },
  { name: "🥛 Leche", url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1965&auto=format&fit=crop", cat: "Lácteos" },
  { name: "🥚 Huevos", url: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?q=80&w=2070&auto=format&fit=crop", cat: "Abarrotes" },
  { name: "🥤 Bebida Cola", url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop", cat: "Bebidas" },
  { name: "🍟 Snacks", url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=2070&auto=format&fit=crop", cat: "Snacks" },
  { name: "🍅 Tomates", url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1974&auto=format&fit=crop", cat: "Verdulería" },
  { name: "🥑 Paltas Hass", url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=1975&auto=format&fit=crop", cat: "Verdulería" },
  { name: "🌾 Arroz G2", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070&auto=format&fit=crop", cat: "Abarrotes" }
];

export default function AdminPage() {
  const { showToast } = useToast();
  
  // Proteger ruta con rol admin
  const { loading: authLoading, profile } = useAuthGuard("admin");

  // Estados del Formulario
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("Abarrotes");
  const [stock, setStock] = useState("15");
  const [minStock, setMinStock] = useState("5");

  // Estado del listado
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // Para confirmación de eliminación inline
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const storeId = profile?.store_id || 1;

  const loadProducts = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await dbService.getProducts(storeId);
      setProducts(data);
    } catch (err) {
      console.error("Error cargando catálogo del admin:", err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, storeId]);

  useEffect(() => {
    if (!authLoading && profile) {
      void loadProducts();
    }
  }, [authLoading, loadProducts, profile]);

  // APLICAR PRESET
  const handleSelectPreset = (url: string, cat: string) => {
    setImage(url);
    setCategory(cat);
    showToast("Imagen sugerida aplicada", "info");
  };

  // CREAR PRODUCTO
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !image || !stock || !minStock) {
      showToast("Por favor, completa todos los campos del producto", "error");
      return;
    }

    const numPrice = Number(price);
    const numStock = Number(stock);
    const numMinStock = Number(minStock);

    if (isNaN(numPrice) || numPrice <= 0) {
      showToast("El precio debe ser un número positivo", "error");
      return;
    }

    try {
      await dbService.createProduct({
        store_id: storeId,
        title,
        price: numPrice,
        image,
        category,
        stock: numStock,
        minStock: numMinStock
      });

      showToast(`"${title}" registrado en tu inventario con éxito`, "success");

      // Resetear campos
      setTitle("");
      setPrice("");
      setImage("");
      setStock("15");
      setMinStock("5");

      void loadProducts();
    } catch (err) {
      showToast("Error al registrar producto", "error");
    }
  };

  // ACTUALIZAR STOCK RAPIDAMENTE (BOTONES +/-)
  const handleAdjustStock = async (prodId: number, adjustment: number, currentStock: number) => {
    const newStock = Math.max(0, currentStock + adjustment);
    await dbService.updateProductStock(prodId, newStock);
    showToast("Inventario actualizado", "success");
    void loadProducts();
  };

  // ELIMINAR PRODUCTO (sin confirm() nativo)
  const handleDelete = async (id: number) => {
    try {
      await dbService.deleteProduct(id);
      showToast("Producto eliminado del inventario", "warning");
      setDeletingProductId(null);
      void loadProducts();
    } catch (err) {
      showToast("Error al eliminar producto", "error");
      setDeletingProductId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10 flex flex-col items-center justify-center">
        <span className="animate-spin inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-lg">Cargando catálogo administrativo...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white">
              🏪 Control de Inventario
            </h1>
            <p className="text-gray-400 mt-2">
              Administra el stock y catálogo de abarrotes de tu local
            </p>
          </div>
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.03] transition flex items-center gap-2 cursor-pointer"
          >
            ← Volver a Métricas y Caja
          </Link>
        </div>

        {/* CONTENEDOR GRID: IZQUIERDA FORMULARIO / DERECHA LISTADO */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* COLUMNA FORMULARIO DE CREACIÓN (1/3 de ancho) */}
          <div className="bg-white/5 border border-white/10 rounded-[35px] p-6 backdrop-blur-2xl space-y-6 h-fit sticky top-28">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>➕</span> Registrar Producto
            </h2>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              {/* NOMBRE */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  placeholder="Ej: Harina de Trigo Selecta 1kg"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* PRECIO */}
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    placeholder="Ej: 1450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white"
                    required
                  />
                </div>
                {/* CATEGORIA */}
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-gray-300 cursor-pointer"
                  >
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
                {/* STOCK */}
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white"
                    required
                  />
                </div>
                {/* MIN STOCK */}
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Mínimo Alerta</label>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-white"
                    required
                  />
                </div>
              </div>

              {/* IMAGE URL */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Enlace de Imagen</label>
                <input
                  type="text"
                  placeholder="Enlace o selecciona un atajo abajo..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-xs text-cyan-300 font-mono"
                  required
                />
              </div>

              {/* IMAGES PRESETS */}
              <div className="space-y-2">
                <label className="text-gray-400 text-xs font-semibold block">💡 Atajos de Productos Sugeridos:</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url, preset.cat)}
                      className={`text-[10px] bg-white/5 hover:bg-cyan-500/20 hover:text-white border px-1 py-1.5 rounded-lg font-semibold truncate transition cursor-pointer ${
                        image === preset.url ? "border-cyan-400 text-white bg-cyan-400/10" : "border-white/10 text-gray-400"
                      }`}
                      title={preset.name}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* PREVIEW BOX */}
              {image && (
                <div className="relative w-full h-[100px] rounded-xl overflow-hidden border border-white/10 bg-black/40">
                  <Image src={image} alt="Preview" fill className="object-cover opacity-80" />
                  <span className="absolute bottom-2 left-3 text-[10px] bg-black/60 px-2 py-0.5 rounded text-gray-300">Vista Previa</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 rounded-xl font-black text-white hover:scale-[1.02] transition shadow-lg cursor-pointer"
              >
                Agregar al Inventario 📥
              </button>
            </form>
          </div>

          {/* COLUMNA TABLA E INVENTARIO (2/3 de ancho) */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[35px] p-6 md:p-8 backdrop-blur-2xl">
            <h2 className="text-2xl font-black text-white mb-6">📦 Catálogo del Negocio</h2>

            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-20">No tienes productos en tu inventario. Crea el primero a la izquierda.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[750px] pr-2">
                {products.map((product) => {
                  const isCritical = product.stock <= product.minStock;
                  return (
                    <div
                      key={product.id}
                      className="bg-black/30 border border-white/5 hover:border-cyan-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition duration-300"
                    >
                      {/* IMAGEN Y TITULO */}
                      <div className="flex items-center gap-4 w-full sm:w-1/2">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <Image src={product.image} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="space-y-1 truncate w-full">
                          <span className="text-[10px] bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full font-black uppercase">
                            {product.category || "Abarrotes"}
                          </span>
                          <h3 className="font-black text-white text-base truncate" title={product.title}>
                            {product.title}
                          </h3>
                          <p className="text-cyan-400 font-bold text-sm">
                            ${product.price.toLocaleString("es-CL")}
                          </p>
                        </div>
                      </div>

                      {/* SEMAFORO DE STOCK Y BOTONES RAPIDOS */}
                      <div className="flex items-center gap-4 shrink-0 bg-black/40 border border-white/5 p-3 rounded-xl">
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase block ${isCritical ? "text-rose-400" : "text-emerald-400"}`}>
                            {isCritical ? "⚠️ Stock Bajo" : "✓ Óptimo"}
                          </span>
                          <span className="text-sm font-bold text-white">Stock: {product.stock} u.</span>
                        </div>

                        {/* BOTONES RAPIDOS DE CONTROL DE STOCK */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAdjustStock(product.id, -1, product.stock)}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-1 rounded text-white text-xs font-black transition cursor-pointer"
                            title="Disminuir stock"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleAdjustStock(product.id, 5, product.stock)}
                            className="bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 px-2.5 py-1 rounded text-cyan-300 text-xs font-black transition cursor-pointer"
                            title="Abastecer stock"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      {/* ELIMINAR con confirmación inline */}
                      {deletingProductId === product.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-white font-semibold whitespace-nowrap">¿Confirmar?</span>
                          <button
                            onClick={() => void handleDelete(product.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-[10px] font-black transition cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setDeletingProductId(null)}
                            className="bg-white/10 text-gray-300 px-3 py-2 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingProductId(product.id)}
                          className="bg-red-950/40 border border-red-500/20 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl text-red-400 text-xs font-bold transition shrink-0 cursor-pointer w-full sm:w-auto text-center"
                        >
                          Eliminar 🗑️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}