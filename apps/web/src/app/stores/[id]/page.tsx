"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Store, Product } from "@/lib/dbService";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { GridSkeleton } from "@/components/Skeleton";

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  // Desenvolver parámetros de Next.js 15 (params es una Promise en App Router)
  const resolvedParams = use(params);
  const storeId = Number(resolvedParams.id);

  // Proteger ruta
  const { loading: authLoading } = useAuthGuard();

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoreData = async () => {
      if (authLoading) return;
      try {
        const [storeData, productsData] = await Promise.all([
          dbService.getStoreById(storeId),
          dbService.getProducts(storeId),
        ]);
        setStore(storeData);
        setProducts(productsData);
      } catch (err) {
        console.error("Error al cargar datos del almacén:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadStoreData();
  }, [authLoading, storeId]);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast("Producto sin stock disponible", "error");
      return;
    }
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
    });
    showToast(`"${product.title}" agregado al carrito`, "success");
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="h-[200px] bg-white/5 rounded-3xl animate-pulse" />
          <GridSkeleton count={3} />
        </div>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-black mb-4">🏪 Almacén No Encontrado</h2>
        <Link
          href="/stores"
          className="bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
        >
          Volver a Almacenes
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      {/* GLOWS */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        {/* ENLACE VOLVER */}
        <Link href="/stores" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition">
          ← Volver a la Red de Almacenes
        </Link>

        {/* HERO BANNER DEL ALMACEN */}
        <div className="relative w-full h-[320px] md:h-[380px] bg-white/5 border border-white/10 rounded-[40px] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.5)]">
          <Image
            src={store.image}
            alt={store.name}
            fill
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-black/40 to-transparent" />

          {/* INFO FLOTANTE EN HERO */}
          <div className="absolute bottom-8 left-6 md:left-10 right-6 md:right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="bg-cyan-400 text-black text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                🏪 Almacén Autogestionado
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none">
                {store.name}
              </h1>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {store.description}
              </p>
            </div>

            <div className="shrink-0 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-xs space-y-1 text-gray-300">
              <p>📍 <strong className="text-white">Ubicación:</strong> {store.address}</p>
              <p>🟢 <strong className="text-white">Estado:</strong> Abierto para Pedidos</p>
            </div>
          </div>
        </div>

        {/* CATÁLOGO */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <h2 className="text-2xl md:text-3xl font-black text-white">🛍️ Catálogo de Productos</h2>
            <span className="text-sm text-gray-400 font-semibold">{products.length} productos listados</span>
          </div>

          {products.length === 0 ? (
            <p className="text-gray-500 py-20 text-center">Este almacén no tiene productos registrados en su inventario.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const isCriticalStock = product.stock <= product.minStock;
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white/5 border border-white/10 rounded-[35px] overflow-hidden hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* IMAGE */}
                      <div className="relative w-full h-[220px] overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* CATEGORY TAG */}
                        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-xl text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                          {product.category || "Abarrotes"}
                        </span>

                        {/* STOCK SEMAPHORE */}
                        <span className={`absolute bottom-4 right-4 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 border shadow-lg ${
                          isOutOfStock
                            ? "bg-rose-950/80 border-rose-500/30 text-rose-400"
                            : isCriticalStock
                            ? "bg-yellow-950/80 border-yellow-500/30 text-yellow-400 animate-pulse"
                            : "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            isOutOfStock ? "bg-rose-500" : isCriticalStock ? "bg-yellow-500" : "bg-emerald-500"
                          }`} />
                          {isOutOfStock
                            ? "Sin Stock ❌"
                            : isCriticalStock
                            ? `¡Pocos disp.! (${product.stock} u.) ⚠️`
                            : `Stock: ${product.stock} unidades`}
                        </span>
                      </div>

                      {/* CONTENT */}
                      <div className="p-6 md:p-8 space-y-3">
                        <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-cyan-300 transition duration-300">
                          {product.title}
                        </h3>
                        <p className="text-3xl font-black text-cyan-400">
                          ${product.price.toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 pt-0">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className={`w-full py-3.5 rounded-2xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                          isOutOfStock
                            ? "bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_15px_rgba(34,211,238,0.2)] cursor-pointer"
                        }`}
                      >
                        {isOutOfStock ? "Agotado" : "🛒 Agregar Al Pedido"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}