export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      {/* Navbar */}
      <nav className="bg-blue-700 text-white flex justify-between items-center px-10 py-5">
        <h1 className="text-3xl font-bold">
          DigitalMarket
        </h1>

        <div className="flex gap-5">
          <a href="/products">
            Productos
          </a>

          <a href="/cart">
            Carrito
          </a>

          <a href="/login">
            Login
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-5">
        <h2 className="text-6xl font-bold text-blue-800 mb-5">
          Bienvenido a
          DigitalMarket
        </h2>

        <p className="text-xl text-gray-700 max-w-2xl mb-8">
          Plataforma ecommerce desarrollada con
          Next.js, TypeScript, Tailwind CSS y
          Supabase.
        </p>

        <a
          href="/products"
          className="bg-blue-700 text-white px-8 py-4 rounded-2xl text-lg"
        >
          Ver Productos
        </a>
      </section>

      {/* Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10 pb-20">
        <div className="bg-white p-8 rounded-3xl shadow-lg">
          <h3 className="text-2xl font-bold text-blue-700 mb-3">
            Autenticación
          </h3>

          <p>
            Sistema de login y registro con
            Supabase Auth.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg">
          <h3 className="text-2xl font-bold text-blue-700 mb-3">
            Ecommerce
          </h3>

          <p>
            Carrito de compras y gestión de
            productos.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg">
          <h3 className="text-2xl font-bold text-blue-700 mb-3">
            Dashboard Admin
          </h3>

          <p>
            CRUD completo conectado con
            Supabase.
          </p>
        </div>
      </section>
    </main>
  );
}

