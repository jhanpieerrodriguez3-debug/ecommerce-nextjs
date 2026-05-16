"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";

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

  // CREAR PRODUCTO
  const handleCreate =
    async () => {
      if (
        !title ||
        !price ||
        !image
      ) {
        alert(
          "Completa todos los campos"
        );

        return;
      }

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

  // ELIMINAR PRODUCTO
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
    <main className="min-h-screen bg-[#050816] text-white p-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-14">
          <h1 className="text-6xl font-black mb-4">
            🛠️ Panel Admin
          </h1>

          <p className="text-gray-400 text-xl">
            Administra los productos
            de tu tienda
          </p>
        </div>

        {/* FORM */}
        <div className="bg-white/10 border border-white/10 rounded-[30px] p-10 mb-14">
          <h2 className="text-3xl font-black mb-8 text-cyan-400">
            Crear Producto
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {/* TITLE */}
            <input
              type="text"
              placeholder="Nombre"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="bg-black/30 border border-cyan-400/20 rounded-2xl p-4 outline-none"
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
              className="bg-black/30 border border-cyan-400/20 rounded-2xl p-4 outline-none"
            />

            {/* IMAGE */}
            <input
              type="text"
              placeholder="URL imagen"
              value={image}
              onChange={(e) =>
                setImage(
                  e.target.value
                )
              }
              className="bg-black/30 border border-cyan-400/20 rounded-2xl p-4 outline-none"
            />
          </div>

          <button
            onClick={
              handleCreate
            }
            className="mt-8 bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition"
          >
            Crear producto
          </button>
        </div>

        {/* PRODUCTOS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(
            (product) => (
              <div
                key={
                  product.id
                }
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
                      handleDelete(
                        product.id
                      )
                    }
                    className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl text-lg font-bold"
                  >
                    Eliminar
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