"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { dbService, Store } from "@/lib/dbService";
import { GridSkeleton } from "@/components/Skeleton";

export default function StoresPage() {
  // Proteger ruta
  const { loading: authLoading } = useAuthGuard();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      if (authLoading) return;
      try {
        const data = await dbService.getStores();
        setStores(data);
      } catch (err) {
        console.error("Error cargando almacenes:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchStores();
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white p-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="space-y-4">
            <div className="h-14 bg-white/10 rounded-2xl w-1/4 animate-pulse" />
            <div className="h-6 bg-white/5 rounded-xl w-1/3 animate-pulse" />
          </div>
          <GridSkeleton count={3} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-6 md:p-10 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-14 pb-6 border-b border-white/10">
          <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs">• Marketplace de Barrio</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-2">
            🏪 Almacenes de Barrio Conectados
          </h1>
          <p className="text-gray-400 text-base md:text-lg mt-2">
            Selecciona un almacén local para explorar su catálogo autogestionado y comprar en línea.
          </p>
        </div>

        {/* STORES GRID */}
        {stores.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[35px] max-w-lg mx-auto">
            <p className="text-gray-400 text-lg mb-4">No hay almacenes registrados en la red todavía.</p>
            <Link
              href="/register"
              className="inline-block bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
            >
              Registra Tu Almacén Aquí
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white/5 border border-white/10 rounded-[35px] overflow-hidden hover:border-cyan-400/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.1)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* IMAGE */}
                  <div className="relative w-full h-[240px] overflow-hidden">
                    <Image
                      src={store.image}
                      alt={store.name}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* DIRECCION BADGE */}
                    <span className="absolute bottom-4 left-6 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl text-white font-semibold text-[10px] flex items-center gap-1">
                      📍 {store.address || "Dirección del Almacén"}
                    </span>
                  </div>

                  {/* CONTENT */}
                  <div className="p-6 md:p-8 space-y-4">
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                      {store.name}
                    </h2>

                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                      {store.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-8 pt-0">
                  <Link
                    href={`/stores/${store.id}`}
                    className="block text-center bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 rounded-2xl text-white font-bold hover:scale-[1.02] transition shadow-[0_4px_15px_rgba(34,211,238,0.2)] cursor-pointer"
                  >
                    Ver Catálogo Comercial
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}