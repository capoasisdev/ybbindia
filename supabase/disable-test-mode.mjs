const SUPABASE_URL = "https://tusbimtbolvnzlwsjcju.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2JpbXRib2x2bnpsd3NqY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4ODc0MiwiZXhwIjoyMTAwOTY0NzQyfQ.c2sCOqYSY5Dl_LtUd2FHNiTX25_YnD_YkmZNIUuXwDM";

async function disable() {
  try {
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.payments_test_mode`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value: false
      })
    });

    if (updateRes.ok) {
      console.log("Successfully disabled payments test mode in settings table!");
    } else {
      console.error("Failed to update payments_test_mode:", await updateRes.text());
    }
  } catch (e) {
    console.error("Update error:", e);
  }
}

disable();
