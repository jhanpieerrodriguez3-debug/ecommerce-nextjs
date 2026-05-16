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

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const { addToCart } =
    useCart();

  const getProducts =
    async (): Promise<void> => {
      const {
        data,
        error,
      } = await supabase
        .from("products")
        .select("*");

      if (error) {
        console.log(error);
        return;
      }

      setProducts(
        (data ||
          []) as Product[]
      );
    };

  useEffect(() => {
    const fetchProducts =
      async () => {
        await getProducts();
      };

    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-blue-700 mb-10 text-center">
          Nuestros Productos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {products.map(
            (
              product: Product
            ) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition duration-300"
              >
                <Image
                  src={
                    product.image
                  }
                  alt={
                    product.title
                  }
                  width={500}
                  height={300}
                  className="w-full h-[250px] object-cover"
                />

                <div className="p-6">
                  <h2 className="text-3xl font-bold text-blue-700 mb-3">
                    {
                      product.title
                    }
                  </h2>

                  <p className="text-2xl text-gray-700 mb-6">
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
                    className="bg-blue-700 text-white w-full py-4 rounded-2xl text-lg font-bold hover:bg-blue-800 transition"
                  >
                    Agregar al Carrito
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