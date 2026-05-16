"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
export default function CartPage() {
  const {
    cart,
    removeFromCart,
  } = useCart();

  const total =
    cart.reduce(
      (acc, product) =>
        acc +
        product.price,
      0
    );

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-10">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <p>Cart vacío</p>
      ) : (
        <div className="space-y-5">
          {cart.map(
            (
              product,
              index
            ) => (
              <div
                key={index}
                className="border p-5 rounded-xl flex items-center gap-5"
              >
               <img
  src={
    product.image
  }
  alt={
    product.title
  }
  className="w-[100px] h-[100px] object-cover rounded-lg"
/>

                <div>
                  <h2 className="text-2xl font-bold">
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
                      removeFromCart(
                        index
                      )
                    }
                    className="bg-red-600 text-white px-4 py-2 mt-3"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          )}

          <div className="mt-10">
            <h2 className="text-3xl font-bold">
              Total: ${total}
            </h2>

            <a
              href="/checkout"
              className="bg-black text-white px-6 py-3 inline-block mt-5"
            >
              Checkout
            </a>
          </div>
        </div>
      )}
    </main>
  );
}