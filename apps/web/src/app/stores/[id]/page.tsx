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
  title: string;
  price: number;
  image: string;
};

export default function StorePage() {
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
    <main className="min-h-screen bg-[#050816] text-white p-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-16">
          <h1 className="text-6xl font-black mb-4">
            🏪 TiendaTest
          </h1>

          <p className="text-gray-400 text-xl">
            Productos disponibles
          </p>
        </div>

        {/* PRODUCTS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map(
            (product) => (
              <div
                key={product.id}
                className="bg-white/10 border border-white/10 rounded-[30px] overflow-hidden"
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
                <div className="p-8">
                  <h2 className="text-3xl font-black mb-4">
                    {
                      product.title
                    }
                  </h2>

                  <p className="text-cyan-400 text-2xl font-bold mb-8">
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
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 py-4 rounded-2xl text-lg font-bold"
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