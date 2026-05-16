import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-5">
        DigitalMarket
      </h1>

      <pre>
        {JSON.stringify(
          { data, error },
          null,
          2
        )}
      </pre>
    </main>
  );
}