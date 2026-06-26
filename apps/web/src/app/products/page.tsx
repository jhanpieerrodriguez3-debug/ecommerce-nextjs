"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";

import { supabase } from "@/lib/supabase";

import { useCart } from "@/context/CartContext";

type Product = {
  id: number;
  store_id: number;
  title: string;
  price: number;
  image: string;
};

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const { addToCart } =
    useCart();

  // OBTENER PRODUCTOS
  const getProducts =
    async () => {
      const { data } =
        await supabase
          .from("products")
          .select("*")
          .order("id", {
            ascending: false,
          });

      setProducts(
        (data ||
          []) as Product[]
      );
    };

  useEffect(() => {
    void getProducts();
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            🛒 Productos
          </h1>

          <p className="text-gray-400 text-xl">
            Compra productos frescos
            de la tienda
          </p>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(
            (product) => (
              <div
                key={
                  product.id
                }
                className="bg-white/10 border border-white/10 rounded-[30px] overflow-hidden hover:scale-[1.03] transition"
              >
                {/* IMAGE */}
                <div className="relative w-full h-[260px]">
                  <Image
                    src={
                      product.image
                    }
                    alt={
                      product.title
                    }
                    fill
                    className="object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="p-6">
                  <h2 className="text-3xl font-black mb-3">
                    {
                      product.title
                    }
                  </h2>

                  <p className="text-cyan-400 text-2xl font-bold mb-6">
                    $
                    {
                      product.price
                    }
                  </p>

                  {/* BUTTON */}
                  <button
                    onClick={() =>
                      addToCart(
                        product
                      )
                    }
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}