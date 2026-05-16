export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 bg-black text-white">
        <h1 className="text-3xl font-bold">
          DigitalMarket
        </h1>

        <div className="flex gap-5">
          <a href="/products" className="hover:text-gray-300">
            Products
          </a>

          <a href="/cart" className="hover:text-gray-300">
            Cart
          </a>

          <a href="/login" className="hover:text-gray-300">
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-5 bg-white">
        <h2 className="text-6xl font-bold mb-6">
          Welcome to DigitalMarket
        </h2>

        <p className="text-xl text-gray-600 max-w-2xl mb-8">
          Buy the best products online with a modern ecommerce experience built using Next.js, TypeScript, Tailwind CSS and Supabase.
        </p>

        <a
          href="/products"
          className="bg-black text-white px-8 py-4 rounded-xl text-lg hover:bg-gray-800 transition"
        >
          Shop Now
        </a>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10 py-20">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center">
          <h3 className="text-2xl font-bold mb-3">
            Fast Delivery
          </h3>

          <p className="text-gray-600">
            Receive your products quickly and safely.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md text-center">
          <h3 className="text-2xl font-bold mb-3">
            Secure Payments
          </h3>

          <p className="text-gray-600">
            Safe and reliable checkout process.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md text-center">
          <h3 className="text-2xl font-bold mb-3">
            Best Products
          </h3>

          <p className="text-gray-600">
            High quality products for all customers.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white text-center py-5">
        <p>
          © 2026 DigitalMarket. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
