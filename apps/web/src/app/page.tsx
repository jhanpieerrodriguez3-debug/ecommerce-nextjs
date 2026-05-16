export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-5">
          DigitalMarket
        </h1>

        <a
          href="/login"
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          Go to Login
        </a>
      </div>
    </main>
  );
}