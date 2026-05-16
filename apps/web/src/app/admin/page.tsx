"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  title: string;
  price: number;
  image: string;
};

export default function AdminPage() {
  const [title, setTitle] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [image, setImage] =
    useState("");

  const [products, setProducts] =
    useState<Product[]>([]);

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

  const handleCreate =
    async () => {
      const { error } =
        await supabase
          .from("products")
          .insert({
            title,
            price:
              Number(price),
            image,
          });

      if (error) {
        alert(
          error.message
        );

        return;
      }

      alert(
        "Producto creado"
      );

      setTitle("");
      setPrice("");
      setImage("");

      void getProducts();
    };

  const handleDelete =
    async (
      id: number
    ) => {
      const { error } =
        await supabase
          .from("products")
          .delete()
          .eq("id", id);

      if (error) {
        alert(
          error.message
        );

        return;
      }

      alert(
        "Producto eliminado"
      );

      void getProducts();
    };

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            🛠️ Admin Panel
          </h1>

          <p className="text-gray-400 text-xl">
            Gestiona productos del ecommerce
          </p>
        </div>

        {/* FORM */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-10 mb-14 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
          <h2 className="text-3xl font-black mb-8 text-cyan-400">
            Crear Producto
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {/* TITLE */}
            <input
              type="text"
              placeholder="Nombre del producto"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
            />

            {/* PRICE */}
            <input
              type="number"
              placeholder="Precio"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              className="bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
            />

            {/* IMAGE */}
            <input
              type="text"
              placeholder="URL de imagen"
              value={image}
              onChange={(e) =>
                setImage(
                  e.target.value
                )
              }
              className="bg-black/30 border border-cyan-400/20 rounded-2xl p-4 text-white outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={
              handleCreate
            }
            className="mt-8 bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition duration-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          >
            Crear Producto
          </button>
        </div>

        {/* PRODUCTS */}
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
                <img
                  src={
                    product.image
                  }
                  alt={
                    product.title
                  }
                  className="w-full h-[260px] object-cover"
                />

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

                  {/* DELETE */}
                  <button
                    onClick={() =>
                      handleDelete(
                        product.id
                      )
                    }
                    className="w-full bg-red-600 hover:bg-red-700 transition py-4 rounded-2xl text-lg font-bold shadow-xl"
                  >
                    Eliminar producto
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