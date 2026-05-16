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
    async (): Promise<void> => {
      const { data, error } =
        await supabase
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
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-10">
        Products
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {products.map(
          (
            product: Product
          ) => (
            <div
              key={product.id}
              className="border p-5 rounded-xl"
            >
              <img
                src={
                  product.image
                }
                alt={
                  product.title
                }
                className="w-full h-[200px] object-cover rounded-lg"
              />

              <h2 className="text-2xl font-bold mt-3">
                {
                  product.title
                }
              </h2>

              <p className="text-xl">
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
                className="bg-black text-white px-4 py-2 mt-3 w-full"
              >
                Add to Cart
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}