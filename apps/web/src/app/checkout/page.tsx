"use client";

import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
export default function CheckoutPage() {
  const { cart } =
    useCart();

  const total =
    cart.reduce(
      (acc, product) =>
        acc +
        product.price,
      0
    );

  const handleCheckout =
  async () => {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    const { error } =
      await supabase
        .from("orders")
        .insert({
          user_email:
            user?.email,
          total,
        });

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Orden creada ✅"
    );
  };
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-10">
        Checkout
      </h1>

      <div className="space-y-5">
        {cart.map(
          (
            product,
            index
          ) => (
            <div
              key={index}
              className="border p-5 rounded-xl"
            >
              <h2 className="text-2xl font-bold">
                {
                  product.title
                }
              </h2>

              <p>
                $
                {
                  product.price
                }
              </p>
            </div>
          )
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-3xl font-bold">
          Total: ${total}
        </h2>

        <button
          onClick={
            handleCheckout
          }
          className="bg-green-600 text-white px-6 py-3 mt-5"
        >
          Pay Now
        </button>
      </div>
    </main>
  );
}