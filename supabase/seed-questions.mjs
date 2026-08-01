import fs from "fs";

const SUPABASE_URL = "https://tusbimtbolvnzlwsjcju.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2JpbXRib2x2bnpsd3NqY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4ODc0MiwiZXhwIjoyMTAwOTY0NzQyfQ.c2sCOqYSY5Dl_LtUd2FHNiTX25_YnD_YkmZNIUuXwDM";
const COURSE_ID = "0ec42d9b-7ce9-42cb-85bc-cf33dab5ec79";

async function seed() {
  try {
    // 1. Fetch modules to map position to database ID
    const modulesRes = await fetch(`${SUPABASE_URL}/rest/v1/modules?course_id=eq.${COURSE_ID}`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const modules = await modulesRes.json();
    console.log(`Fetched ${modules.length} modules from database`);

    // 2. Read exam questions JSON
    const questionsRaw = fs.readFileSync("supabase/exam_questions.json", "utf8");
    const questionsData = JSON.parse(questionsRaw);
    console.log(`Loaded ${questionsData.length} questions from JSON`);

    // 3. Map questions to DB payload
    const payload = questionsData.map(q => {
      // Find matching module by position
      // e.g. "M5" -> position = 5
      const mMatch = q.module.match(/\d+/);
      const position = mMatch ? parseInt(mMatch[0], 10) : null;
      const matchedModule = modules.find(m => m.position === position);

      return {
        course_id: COURSE_ID,
        module_id: matchedModule ? matchedModule.id : null,
        prompt: q.prompt,
        options: q.options,
        correct_option_ids: q.correct_option_ids,
        marks: 1,
        type: "mcq",
        difficulty: "medium"
      };
    });

    // 4. Delete existing questions for this course
    console.log("Clearing existing questions...");
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/questions?course_id=eq.${COURSE_ID}`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!deleteRes.ok) {
      console.warn("Delete response was not OK:", await deleteRes.text());
    }

    // 5. Insert questions in chunks
    console.log("Inserting new questions...");
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (insertRes.ok) {
      console.log(`Successfully seeded all ${payload.length} questions!`);
    } else {
      console.error("Failed to insert questions:", await insertRes.text());
    }
  } catch (e) {
    console.error("Seeding error:", e);
  }
}

seed();
