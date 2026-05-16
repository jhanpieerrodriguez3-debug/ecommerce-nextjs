export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-5">
        <h1 className="text-7xl font-bold text-blue-800 mb-6">
          Bienvenido a
          DigitalMarket
        </h1>

        <p className="text-2xl text-gray-700 max-w-3xl mb-10">
          Plataforma ecommerce 
          
        </p>

        <div className="flex gap-5">
          <a
            href="/products"
            className="bg-blue-700 text-white px-8 py-4 rounded-2xl text-xl shadow-lg hover:bg-blue-800 transition"
          >
            Ver Productos
          </a>

          <a
            href="/login"
            className="bg-white border-2 border-blue-700 text-blue-700 px-8 py-4 rounded-2xl text-xl"
          >
            Iniciar Sesión
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 px-10 pb-32">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-blue-700 mb-5">
            Ecommerce
          </h2>

          <p className="text-gray-700 text-lg">
            Sistema completo de carrito de compras
            con productos dinámicos.
          </p>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-blue-700 mb-5">
            Dashboard
          </h2>

          <p className="text-gray-700 text-lg">
            Panel administrativo para gestionar
            productos y usuarios.
          </p>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-blue-700 mb-5">
            Supabase
          </h2>

          <p className="text-gray-700 text-lg">
            Base de datos moderna con autenticación
            y almacenamiento en tiempo real.
          </p>
        </div>
      </section>
    </main>
  );
}

