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
    useState<string>("");

  const [price, setPrice] =
    useState<string>("");

  const [image, setImage] =
    useState<string>("");

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null
  );

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

  const handleCreate =
    async (): Promise<void> => {
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

      await getProducts();
    };

  const handleUpdate =
    async (): Promise<void> => {
      if (!editingId)
        return;

      const { error } =
        await supabase
          .from("products")
          .update({
            title,
            price:
              Number(price),
            image,
          })
          .eq(
            "id",
            editingId
          );

      if (error) {
        alert(
          error.message
        );
        return;
      }

      alert(
        "Producto actualizado"
      );

      setEditingId(null);

      setTitle("");
      setPrice("");
      setImage("");

      await getProducts();
    };

  const handleDelete =
    async (
      id: number
    ): Promise<void> => {
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

      await getProducts();
    };

  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-blue-700 mb-10">
          Panel de Administración
        </h1>

        {/* Formulario */}
        <div className="bg-white p-8 rounded-3xl shadow-xl mb-10">
          <h2 className="text-3xl font-bold mb-6 text-blue-700">
            {editingId
              ? "Editar Producto"
              : "Crear Producto"}
          </h2>

          <div className="grid gap-5">
            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(
                e
              ) =>
                setTitle(
                  e.target.value
                )
              }
              className="border p-4 rounded-xl"
            />

            <input
              type="number"
              placeholder="Precio"
              value={price}
              onChange={(
                e
              ) =>
                setPrice(
                  e.target.value
                )
              }
              className="border p-4 rounded-xl"
            />

            <input
              type="text"
              placeholder="URL de Imagen"
              value={image}
              onChange={(
                e
              ) =>
                setImage(
                  e.target.value
                )
              }
              className="border p-4 rounded-xl"
            />

            <button
              onClick={() => {
                if (
                  editingId
                ) {
                  handleUpdate();
                } else {
                  handleCreate();
                }
              }}
              className="bg-blue-700 text-white py-4 rounded-xl text-lg"
            >
              {editingId
                ? "Actualizar Producto"
                : "Crear Producto"}
            </button>
          </div>
        </div>

        {/* Productos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map(
            (
              product: Product
            ) => (
              <div
                key={
                  product.id
                }
                className="bg-white rounded-3xl shadow-xl overflow-hidden"
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
                  <h2 className="text-2xl font-bold mb-3">
                    {
                      product.title
                    }
                  </h2>

                  <p className="text-xl text-gray-600 mb-5">
                    $
                    {
                      product.price
                    }
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingId(
                          product.id
                        );

                        setTitle(
                          product.title
                        );

                        setPrice(
                          String(
                            product.price
                          )
                        );

                        setImage(
                          product.image
                        );
                      }}
                      className="bg-yellow-500 text-white px-5 py-3 rounded-xl w-full"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          product.id
                        )
                      }
                      className="bg-red-600 text-white px-5 py-3 rounded-xl w-full"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}