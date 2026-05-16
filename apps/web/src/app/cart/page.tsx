"use client";

import Image from "next/image";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
  } = useCart();

  const total =
    cart.reduce(
      (
        acc,
        product
      ) =>
        acc +
        product.price,
      0
    );

  return (
    <main className="min-h-screen bg-blue-50 p-10">
      <h1 className="text-5xl font-bold text-blue-700 mb-10">
        Carrito de Compras
      </h1>

      <div className="grid gap-5">
        {cart.map(
          (product) => (
            <div
              key={product.id}
              className="bg-white p-5 rounded-2xl shadow-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <Image
                  src={
                    product.image
                  }
                  alt={
                    product.title
                  }
                  width={100}
                  height={100}
                  className="rounded-xl object-cover"
                />

                <div>
                  <h2 className="text-2xl font-bold">
                    {
                      product.title
                    }
                  </h2>

                  <p className="text-xl text-gray-600">
                    $
                    {
                      product.price
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  removeFromCart(
                    product.id
                  )
                }
                className="bg-red-600 text-white px-5 py-3 rounded-xl"
              >
                Eliminar
              </button>
            </div>
          )
        )}
      </div>

      <div className="bg-white mt-10 p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold mb-5">
          Total: ${total}
        </h2>

        <a
          href="/checkout"
          className="bg-blue-700 text-white px-6 py-4 rounded-xl"
        >
          Finalizar Compra
        </a>
      </div>
    </main>
  );
}