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
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-10">
        Admin Panel
      </h1>

      <div className="border p-5 rounded-xl mb-10">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(
            e
          ) =>
            setTitle(
              e.target.value
            )
          }
          className="border p-2 w-full mb-3"
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(
            e
          ) =>
            setPrice(
              e.target.value
            )
          }
          className="border p-2 w-full mb-3"
        />

        <input
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(
            e
          ) =>
            setImage(
              e.target.value
            )
          }
          className="border p-2 w-full mb-5"
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
          className="bg-black text-white px-4 py-2"
        >
          {editingId
            ? "Update Product"
            : "Create Product"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
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
                  handleDelete(
                    product.id
                  )
                }
                className="bg-red-600 text-white px-4 py-2 mt-3 w-full"
              >
                Delete
              </button>

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
                className="bg-blue-600 text-white px-4 py-2 mt-3 w-full"
              >
                Edit
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}