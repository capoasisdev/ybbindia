import { writeFileSync } from 'fs';

const SUPABASE_URL = "https://tusbimtbolvnzlwsjcju.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2JpbXRib2x2bnpsd3NqY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4ODc0MiwiZXhwIjoyMTAwOTY0NzQyfQ.c2sCOqYSY5Dl_LtUd2FHNiTX25_YnD_YkmZNIUuXwDM";

const assignmentsData = [
  // Module 1
  {
    lessonNum: 1,
    title: "Spot One Saleable Business",
    instructions: "Choose one local or familiar business. A hypothetical example is acceptable. Write its industry, two reasons the owner might consider selling, and one likely buyer type. Add one sentence explaining why that buyer could be a good match.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 2,
    title: "Build the Transaction Journey",
    instructions: "Copy the seven-stage flow shown in the lesson. Under each stage, write only one important action the broker must take. Circle the stage you expect to be most difficult and write one simple solution.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 3,
    title: "Create a Mini Market Map",
    instructions: "List three local businesses or business categories that could be sold in the future. List two possible buyer types and one professional who could refer an opportunity. Match one buyer type to one business and explain the fit in one sentence.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 4,
    title: "Match the Transaction Type",
    instructions: "Use these four examples: sale of a company, transfer of a franchise outlet, purchase of a minority stake, and a partnership between two firms. Label each as Business Sale, Franchise Transfer, Investment, or Strategic Partnership. Write one reason for each choice.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 2
  {
    lessonNum: 5,
    title: "Classify Three Business Models",
    instructions: "Choose three familiar businesses. For each, write the business model and main revenue source. Add one strength and one risk for each business.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 6,
    title: "Compare an SME, Startup and Corporate",
    instructions: "Choose one example of an SME, one startup and one corporate. Hypothetical examples are acceptable. Write the industry and revenue model of each. Add one possible transaction opportunity for each business type.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 7,
    title: "Identify a Business Life-Cycle Stage",
    instructions: "Choose two familiar businesses. Identify the life-cycle stage of each and write one clue supporting your choice. Add one likely challenge or transaction opportunity for each.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 8,
    title: "Understand One Seller's Motivation",
    instructions: "Imagine one business owner considering a sale. Choose the likely main reason: retirement, relocation, partnership issue, need for capital, or another reason. Write one possible hidden concern and two questions the broker should ask.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 3
  {
    lessonNum: 9,
    title: "Make Two Ethical Decisions",
    instructions: "Review two situations: sharing financial statements before approval, and disclosing the fee structure before engagement. Mark each action Ethical or Unethical. Write the correct professional action in one sentence for each situation.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 10,
    title: "Plan Confidential Information Release",
    instructions: "Write these stages in order: Inquiry, Buyer Qualification, NDA, Initial Information, Due Diligence. Beside each stage, write None, Basic, or Detailed to show the level of information that may be shared. Add one control that protects the seller's confidentiality.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 11,
    title: "Resolve Two Conflicts of Interest",
    instructions: "Review two cases: a buyer offers the broker an undisclosed incentive, and the broker wants to buy the listed business. For each case, choose the safest response: Disclose, Obtain Written Consent, or Decline/Withdraw. Write one sentence explaining your choice.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 12,
    title: "Run a Five-Minute Discovery Conversation",
    instructions: "Role-play with someone or use a hypothetical business owner. Ask: Why are you considering a transaction? What outcome, concern and timeline do you have? Summarise the answers and write one suitable next step.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 4
  {
    lessonNum: 13,
    title: "Start a Five-Prospect List",
    instructions: "List five business owners or hypothetical prospects. Record business/industry, city, possible opportunity and prospect category A, B or C. Choose one prospect for a respectful first approach.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 14,
    title: "Create a Five-Contact Network Map",
    instructions: "Select one CA, lawyer, banker, consultant or wealth professional, and business owner. Real names are optional. Write how each person could help the Business Broking network. Draft one short introductory message for any one contact.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 15,
    title: "Plan Three Referral Relationships",
    instructions: "Choose three possible referral partners from your network or use hypothetical profiles. Write the value each partner can bring and one value you can offer in return. Record one practical next action for each partner.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 16,
    title: "Prepare a Seller Snapshot",
    instructions: "Choose one real or hypothetical business owner. Record the business overview, seller motivation, desired outcome and main concern. Write the next question the broker should ask.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 5
  {
    lessonNum: 17,
    title: "Match Four Buyer Types",
    instructions: "Choose one business sale opportunity. Consider an individual buyer, an existing business owner, an HNI and a strategic buyer. Mark each as Strong Fit, Possible Fit or Weak Fit, then select the best buyer type.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 18,
    title: "Assess One Business Like an Investor",
    instructions: "Choose one business. Write two attractive features, two risks and one growth opportunity. Name the investor type that may suit the opportunity best.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 19,
    title: "Qualify Two Buyers",
    instructions: "Create two simple hypothetical buyer profiles. Check investment capacity, funding source, experience, business fit and timeline for each. Give each buyer an A, B or C rating and state the main reason.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 20,
    title: "Create a Six-Point Buyer Brief",
    instructions: "Write one short point each on timeline, information sharing and due diligence. Add one short point each on financing, negotiation and confidentiality. End with the next action expected from the buyer.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 6
  {
    lessonNum: 21,
    title: "Rate Five Valuation Drivers",
    instructions: "Choose one business. Rate Revenue, Profitability, Growth, Owner Dependency and Key Risks as Strong, Average or Weak. Write three sentences explaining how the ratings may affect valuation.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 22,
    title: "Calculate Net Asset Value",
    instructions: "Use: Land ₹1.5 Cr, Building ₹1 Cr, Machinery ₹75 Lakh, Inventory ₹50 Lakh, Cash ₹25 Lakh. Use liabilities: Loans ₹1 Cr and Creditors ₹25 Lakh. Show: Total Assets = __; Total Liabilities = __; Net Asset Value = Total Assets - Total Liabilities = __.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 23,
    title: "Apply Three EBITDA Multiples",
    instructions: "Assume EBITDA = ₹1.5 Crore. Calculate Value = EBITDA × Multiple at 3×, 4× and 5×. Choose one value and write one reason a buyer might use that multiple.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 24,
    title: "Estimate a Market-Based Value Range",
    instructions: "Assume similar businesses trade at 3× to 5× EBITDA and the target business has EBITDA of ₹1 Crore. Calculate Low Value = ₹1 Crore × 3 and High Value = ₹1 Crore × 5. Calculate the middle value at 4× and name one factor that could move the multiple up or down.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 25,
    title: "Calculate EBITDA and SDE",
    instructions: "Use: Net Profit ₹20 Lakh, Owner Salary ₹12 Lakh, Personal Vehicle Expense ₹3 Lakh, Interest ₹5 Lakh, Taxes ₹4 Lakh and Depreciation ₹6 Lakh. Show: EBITDA = Net Profit + Interest + Taxes + Depreciation = __. Show: SDE = Net Profit + Owner Salary + Personal Vehicle Expense = __; then state which measure suits a small buyer and which suits a corporate buyer.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 26,
    title: "Create a One-Industry Valuation Note",
    instructions: "Choose one industry: Manufacturing, Restaurant, Education, Healthcare or Technology. List three valuation drivers and one major risk from the lesson. State whether the industry may receive a Low, Medium or High multiple and explain why in one sentence.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 27,
    title: "Respond to Two Seller Expectations",
    instructions: "Choose any two statements: 'I must recover my investment,' 'My competitor sold for more,' 'I want a very high multiple,' or 'I spent years building this business.' For each, write one sentence that acknowledges the seller's view and one sentence based on valuation evidence. End each response with one constructive next step.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 7
  {
    lessonNum: 28,
    title: "Compare Exclusive and Non-Exclusive Mandates",
    instructions: "Compare Seller Control, Broker Effort, Confidentiality, Competition and Closure Probability. For each factor, mark Exclusive or Non-Exclusive as High, Medium or Low. Choose the mandate you would recommend in a serious sale and write one reason.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 29,
    title: "Give a 60-Second Exclusive-Mandate Pitch",
    instructions: "Write one sentence each on confidentiality, focused buyer search and accountability. Add one sentence on transaction coordination. End with a polite request for exclusive representation.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 30,
    title: "Complete the Key Mandate Terms",
    instructions: "Use one hypothetical sale and fill: Parties, Scope, Duration and Fee. Add Confidentiality, Buyer Protection and Termination terms in one line each. Mark the draft 'For discussion - legal review required.'",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 31,
    title: "Check Seller Readiness",
    instructions: "List one required item under Business, Financial, Legal, Asset and Customer Information. Mark each item Available or Missing for a hypothetical seller. Select the three missing items the broker should request first.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 32,
    title: "Create a One-Page Mini CBP",
    instructions: "Choose a hypothetical business. Write one or two lines under: Company Overview, Products/Services, Financial Highlights, Strengths, Growth Opportunity and Transaction Overview. Remove any confidential name or identifying detail unless permission exists.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 33,
    title: "Write a Six-Line Anonymous Teaser",
    instructions: "Use a hypothetical manufacturing business and do not mention its name or exact location. Write: Headline, Sector/Region, Revenue or EBITDA Range, two Investment Highlights, Growth Opportunity and Next Step. Check that a reader cannot identify the seller from the teaser alone.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 34,
    title: "Make a Five-Step Confidentiality Checklist",
    instructions: "Write five controls: qualify buyer, sign NDA, share in stages, record every release, and remind participants of confidentiality. Create one sample log entry with Buyer Code, Document Shared and Date. Add one action to take if confidentiality is breached.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 8
  {
    lessonNum: 35,
    title: "Create Three Buyer Profiles",
    instructions: "Create three real or hypothetical buyer codes. Record buyer type, industry preference, investment range, geography and qualification status. Add the next follow-up date or action for each buyer.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 36,
    title: "Plan Five Referral Contacts",
    instructions: "Select one CA, banker, stock broker/wealth professional, lawyer and business contact. Hypothetical profiles are acceptable. Write the possible referral value and first outreach message for each. Choose one contact for follow-up this week.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 37,
    title: "Identify Three Strategic Buyer Types",
    instructions: "Choose one hypothetical business for sale. Identify a competitor, supplier and customer that could be strategic buyer types. Write one synergy and the likely decision-maker role for each buyer type.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 38,
    title: "Build Three Investor Profiles",
    instructions: "Create one hypothetical HNI, one Family Office and one Private Equity profile. For each, record investment range, industry preference and preferred deal type. Match one profile to a business and explain the fit in one sentence.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 39,
    title: "Complete One Buyer Qualification",
    instructions: "Create one hypothetical buyer and record Name/Code, Organisation, Buyer Type, Industry, Investment Range, Funding Source, Decision-Maker, Timeline and NDA Status. Give the buyer an A, B, C or D rating. Write one reason for the rating and one next action.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 40,
    title: "Prepare and Use Six Discovery Questions",
    instructions: "Write one question each about objectives, acquisition criteria, investment capacity, decision process, timeline and concerns. Answer the questions as one hypothetical buyer. Write the agreed next step.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 41,
    title: "Handle Two Buyer Objections",
    instructions: "Choose any two objections: valuation too high, numbers not trusted, owner dependency, or risky industry. For each, write one clarifying question and one calm professional response. Add one follow-up question that moves the discussion forward.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 42,
    title: "Score Three Buyer Matches",
    instructions: "Choose one business and consider one strategic buyer, one financial buyer and one entrepreneur. Score each buyer from 1 to 5 for Strategic Fit, Financial Capacity and Genuine Interest. Select the best match and write one sentence positioning the opportunity for that buyer.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 9
  {
    lessonNum: 43,
    title: "Compare Two Offers",
    instructions: "Offer A: ₹9 Cr price, ₹8 Cr upfront, ₹1 Cr after 12 months, 45-day closing, financing condition. Offer B: ₹8.7 Cr all cash, 30-day closing, no financing condition. Compare Price, Upfront Payment, Timeline, Conditions and Certainty. Recommend one offer and explain the main reason.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 44,
    title: "Bridge an ₹8-10 Crore Price Gap",
    instructions: "Assume the seller wants ₹10 Crore and the buyer offers ₹8 Crore. Write two likely interests for each side and one non-price concession each side could offer. Propose one bridge structure and one neutral sentence the broker can use to reopen discussion.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 45,
    title: "Design Two Deal Structures",
    instructions: "Assume the seller wants ₹12 Crore and the buyer offers ₹9 Crore. Create one Cash Deal and one Hybrid Deal using upfront, deferred or earn-out components. Make every component add up clearly. Write one benefit and one risk for each structure, then select the more workable option.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 10
  {
    lessonNum: 46,
    title: "Prepare an Eight-Document Due Diligence List",
    instructions: "List one document under each category: Financial, Legal, Tax, Operations, Customers, Suppliers, Employees and Compliance. Mark each item Available, Requested or Missing for a hypothetical seller. Select the three items that should be collected first.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 47,
    title: "Build a Six-Folder Data Room",
    instructions: "Create these folders on paper or digitally: Corporate, Financial, Tax, Legal, Commercial and Employees. Place one example document under each folder. Create three information-request rows with Request, Owner, Due Date and Status.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 48,
    title: "Choose Between an SPA and APA",
    instructions: "Compare SPA and APA for Ownership Transfer, Assets, Contracts, Liabilities and Typical Use. Assume one buyer wants the whole company and another wants only selected assets. Choose the likely structure for each buyer and give one reason. Final legal advice must come from qualified professionals.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  {
    lessonNum: 49,
    title: "Prepare an Eight-Step Closing Checklist",
    instructions: "List: Conditions Precedent, Documents, Funds, Ownership, Employees, Customers, Suppliers and Success Fee. Mark each item Complete, Pending or Not Applicable for a hypothetical closing. Assign an owner and due date to the next three pending actions.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  },
  // Module 11
  {
    lessonNum: 50,
    title: "Write Your Five-Point ABB Charter",
    instructions: "Write five personal commitments covering ethics, confidentiality, communication, client service and continuous learning. Add one behaviour that you will avoid. Choose one professional-development action to complete in the next 30 days.",
    allowed_file_types: ["pdf", "docx"],
    max_file_size_mb: 10,
    max_attempts: 3
  }
];

async function seed() {
  try {
    // 1. Get Course
    const courseRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=id`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const courses = await courseRes.json();
    if (!courses || courses.length === 0) {
      throw new Error("No courses found to seed assignments for");
    }
    const courseId = courses[0].id;
    console.log(`Using course: ${courseId}`);

    // 2. Get Modules and Lessons
    const lessonsRes = await fetch(`${SUPABASE_URL}/rest/v1/lessons?select=id,title,module_id`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const lessons = await lessonsRes.json();
    console.log(`Fetched ${lessons.length} lessons`);

    // 3. Clear existing assignments
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/assignments?course_id=eq.${courseId}`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      }
    });
    console.log(`Cleared existing assignments: ${delRes.status}`);

    // 4. Map and Insert Assignments
    const inserts = [];
    for (const aData of assignmentsData) {
      // Find the corresponding lesson
      // Lessons are named like "Module 1 - Lesson 1" or similar
      const lessonPattern1 = `Lesson ${aData.lessonNum}`;
      const lessonPattern2 = `Lesson${aData.lessonNum}`;
      const matchedLesson = lessons.find(l => {
        const title = l.title || "";
        return title.includes(lessonPattern1) || title.replace(/\s+/g, '').includes(lessonPattern2);
      });

      if (!matchedLesson) {
        console.warn(`Could not find lesson matching: Lesson ${aData.lessonNum}`);
        continue;
      }

      inserts.push({
        course_id: courseId,
        module_id: matchedLesson.module_id,
        lesson_id: matchedLesson.id,
        title: `Lesson ${aData.lessonNum}: ${aData.title}`,
        instructions: aData.instructions,
        allowed_file_types: aData.allowed_file_types,
        max_file_size_mb: aData.max_file_size_mb,
        max_attempts: aData.max_attempts,
        is_compulsory: true,
        is_final_project: false,
        is_published: true,
        position: aData.lessonNum
      });
    }

    // Also add the Final Project assignment
    inserts.push({
      course_id: courseId,
      module_id: null,
      lesson_id: null,
      title: "Final project — end-to-end broking mandate",
      instructions: "Prepare a complete broking mandate for an SME of your choice: business profile, valuation, marketing plan, buyer shortlist, negotiation strategy and closing checklist. Upload one PDF (max 25 MB).",
      allowed_file_types: ["pdf"],
      max_file_size_mb: 25,
      max_attempts: 3,
      is_compulsory: true,
      is_final_project: true,
      is_published: true,
      position: 999
    });

    console.log(`Inserting ${inserts.length} assignments...`);
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/assignments`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(inserts)
    });
    
    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Failed to insert assignments: ${errText}`);
    }

    console.log("Assignments successfully seeded!");
  } catch (e) {
    console.error("Seeding error:", e);
  }
}

seed();
