"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

type Store = {
  id: number;
  name: string;
  image: string;
  description: string;
};

export default function StoresPage() {
  const [stores, setStores] =
    useState<Store[]>([]);

  const getStores =
    async () => {
      const { data } =
        await supabase
          .from("stores")
          .select("*");

      setStores(
        (data ||
          []) as Store[]
      );
    };

  useEffect(() => {
    void getStores();
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-16">
          <h1 className="text-6xl font-black mb-4">
            🏪 Tiendas
          </h1>

          <p className="text-gray-400 text-xl">
            Selecciona una tienda
          </p>
        </div>

        {/* STORES */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {stores.map(
            (store) => (
              <div
                key={store.id}
                className="bg-white/10 border border-white/10 rounded-[30px] overflow-hidden"
              >
                {/* IMAGE */}
                <div className="relative w-full h-[260px]">
                  <Image
                    src={
                      store.image
                    }
                    alt={
                      store.name
                    }
                    fill
                    className="object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="p-8">
                  <h2 className="text-4xl font-black mb-4">
                    {
                      store.name
                    }
                  </h2>

                  <p className="text-gray-400 mb-8">
                    {
                      store.description
                    }
                  </p>

                  <Link
                    href={`/stores/${store.id}`}
                    className="block text-center bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-lg font-bold"
                  >
                    Ver tienda
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}