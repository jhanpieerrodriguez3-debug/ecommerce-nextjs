const url = "https://kygfupvjcewxxihbnuqf.supabase.co/rest/v1/rpc/delete_user_by_admin";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Z2Z1cHZqY2V3eHhpaGJudXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTE0ODksImV4cCI6MjA5NTkyNzQ4OX0.f64JLs6QPKkMEk62TVbhnAW1cGwcrIbbMDKY_FJ_lNA";

async function test() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_user_id: "00000000-0000-0000-0000-000000000000" // Un ID dummy para probar si la función existe
      })
    });
    
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const body = await res.text();
    console.log("Body:", body);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
