const SUPABASE_URL = "https://tusbimtbolvnzlwsjcju.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2JpbXRib2x2bnpsd3NqY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4ODc0MiwiZXhwIjoyMTAwOTY0NzQyfQ.c2sCOqYSY5Dl_LtUd2FHNiTX25_YnD_YkmZNIUuXwDM";

const modulesData = [
  { position: 1, title: "Introduction to Business Broking" },
  { position: 2, title: "Foundations of Business Ownership" },
  { position: 3, title: "Business Broker Ethics & Professional Standards" },
  { position: 4, title: "Finding Business Sale Opportunities" },
  { position: 5, title: "Understanding Buyers" },
  { position: 6, title: "Business Valuation Fundamentals" },
  { position: 7, title: "Creating Business Sale Mandates" },
  { position: 8, title: "Buyer Acquisition & Deal Sourcing" },
  { position: 9, title: "Offer Management & Negotiation" },
  { position: 10, title: "Due Diligence & Transaction Execution" },
  { position: 11, title: "Ethics, Professional Standards & Career Development" }
];

async function update() {
  try {
    // 1. Get modules
    const res = await fetch(`${SUPABASE_URL}/rest/v1/modules?select=id,position`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const modules = await res.json();
    console.log(`Fetched ${modules.length} modules from DB`);

    let updatedCount = 0;
    for (const mData of modulesData) {
      const matched = modules.find(m => m.position === mData.position);
      if (!matched) {
        console.warn(`Could not find module with position: ${mData.position}`);
        continue;
      }

      // Update title
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/modules?id=eq.${matched.id}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: mData.title
        })
      });

      if (updateRes.ok) {
        updatedCount++;
      } else {
        console.error(`Failed to update module ${mData.position}:`, await updateRes.text());
      }
    }

    console.log(`Successfully updated ${updatedCount} modules!`);
  } catch (e) {
    console.error("Update error:", e);
  }
}

update();
