"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import { useCart } from "@/context/CartContext";

type Product = {
  id: number;
  title: string;
  price: number;
  image: string;
};

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const { addToCart } =
    useCart();

  const getProducts =
    async () => {
      const { data } =
        await supabase
          .from("products")
          .select("*");

      setProducts(
        (data ||
          []) as Product[]
      );
    };

  useEffect(() => {
    void getProducts();
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            Productos
          </h1>

          <p className="text-gray-400 text-xl">
            Descubre los mejores productos digitales
          </p>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(
            (
              product: Product
            ) => (
              <div
                key={
                  product.id
                }
                className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.15)] hover:scale-[1.03] transition duration-300"
              >
                {/* IMAGE */}
                <div className="overflow-hidden">
                  <img
                    src={
                      product.image
                    }
                    alt={
                      product.title
                    }
                    className="w-full h-[260px] object-cover hover:scale-110 transition duration-500"
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

                  <button
                    onClick={() =>
                      addToCart(
                        product
                      )
                    }
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition duration-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
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