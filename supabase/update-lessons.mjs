const SUPABASE_URL = "https://tusbimtbolvnzlwsjcju.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2JpbXRib2x2bnpsd3NqY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4ODc0MiwiZXhwIjoyMTAwOTY0NzQyfQ.c2sCOqYSY5Dl_LtUd2FHNiTX25_YnD_YkmZNIUuXwDM";

const lessonsData = [
  {
    num: 1,
    title: "What Is Business Broking?",
    description: "Understand what business broking is, how brokers create value, and where they fit in a business-sale transaction."
  },
  {
    num: 2,
    title: "Role of a Business Broker",
    description: "Learn the broker’s role from sourcing opportunities to managing buyers, negotiations and transaction progress."
  },
  {
    num: 3,
    title: "Business Broking Industry in India",
    description: "Explore the opportunity, current market landscape and long-term potential of professional business broking in India."
  },
  {
    num: 4,
    title: "Types of Business Transactions",
    description: "Understand common transaction types, including business sales, asset sales, share sales, mergers and acquisitions."
  },
  {
    num: 5,
    title: "Understanding Different Business Models",
    description: "Learn how businesses create, deliver and capture value through different operating and revenue models."
  },
  {
    num: 6,
    title: "SME vs Startup vs Corporate",
    description: "Distinguish between SMEs, startups and corporates, and understand how each differs as a potential transaction opportunity."
  },
  {
    num: 7,
    title: "Business Life Cycle",
    description: "Identify the key stages of a business life cycle and how growth stage affects sale readiness and buyer interest."
  },
  {
    num: 8,
    title: "Why Owners Sell Businesses",
    description: "Understand the financial, personal and strategic reasons why business owners decide to sell."
  },
  {
    num: 9,
    title: "Code of Conduct for Business Brokers",
    description: "Learn the professional standards, integrity principles and behaviours expected from an Authorised Business Broker."
  },
  {
    num: 10,
    title: "Confidentiality & Non-Disclosure Agreements (NDAs)",
    description: "Understand why confidentiality matters and how NDAs protect sellers, buyers and sensitive transaction information."
  },
  {
    num: 11,
    title: "Conflict of Interest & Ethical Decision Making",
    description: "Learn how to identify conflicts of interest and make fair, transparent and professional decisions."
  },
  {
    num: 12,
    title: "Professional Communication & Client Relationship Management",
    description: "Build strong client relationships through clear communication, responsiveness, trust and expectation management."
  },
  {
    num: 13,
    title: "Prospecting Techniques",
    description: "Learn practical methods to identify and approach potential business sellers."
  },
  {
    num: 14,
    title: "Networking Strategy",
    description: "Understand how to build a focused network that generates consistent business-sale opportunities."
  },
  {
    num: 15,
    title: "Working with Referrals",
    description: "Learn how to create referral relationships and convert introductions into qualified seller opportunities."
  },
  {
    num: 16,
    title: "Building Seller Relationships",
    description: "Develop the trust, credibility and advisory approach needed to work effectively with business owners."
  },
  {
    num: 17,
    title: "Types of Buyers",
    description: "Understand strategic buyers, financial buyers, individual buyers, HNIs, family offices and other buyer categories."
  },
  {
    num: 18,
    title: "Investor Psychology",
    description: "Learn what motivates buyers, how they assess risk and what increases their confidence in a transaction."
  },
  {
    num: 19,
    title: "Buyer Qualification",
    description: "Learn how to assess a buyer’s financial capacity, intent, experience and suitability before sharing confidential information."
  },
  {
    num: 20,
    title: "Managing Buyer Expectations",
    description: "Understand how to set realistic expectations around valuation, timelines, confidentiality and deal certainty."
  },
  {
    num: 21,
    title: "Introduction to Business Valuation",
    description: "Learn the purpose of valuation and the key factors that influence what a business may be worth."
  },
  {
    num: 22,
    title: "Asset-Based Valuation",
    description: "Understand how assets, liabilities and net asset value can be used to estimate business value."
  },
  {
    num: 23,
    title: "Income-Based Valuation",
    description: "Learn how earnings, cash flow and future income potential influence valuation."
  },
  {
    num: 24,
    title: "Market-Based Valuation",
    description: "Understand comparable transactions, industry benchmarks and valuation multiples."
  },
  {
    num: 25,
    title: "Understanding EBITDA, SDE & Cash Flow",
    description: "Learn the core financial measures used by buyers and brokers to assess business performance."
  },
  {
    num: 26,
    title: "Valuation Multiples by Industry",
    description: "Understand why valuation multiples vary across industries, business models, growth profiles and risk levels."
  },
  {
    num: 27,
    title: "Valuation Mistakes & Seller Expectation Management",
    description: "Learn how to avoid unrealistic valuations and guide sellers toward credible expectations."
  },
  {
    num: 28,
    title: "What Is a Mandate?",
    description: "Understand the purpose of a business-sale mandate and why it is essential before representing a seller."
  },
  {
    num: 29,
    title: "Exclusive vs Non-Exclusive Mandates",
    description: "Compare exclusive and non-exclusive mandates, including their advantages, risks and suitable use cases."
  },
  {
    num: 30,
    title: "Creating a Business Sale Mandate Agreement",
    description: "Learn the essential terms to include in a professional broker mandate agreement."
  },
  {
    num: 31,
    title: "Information Gathering & Seller Onboarding",
    description: "Learn how to collect business, financial, operational and strategic information from a seller."
  },
  {
    num: 32,
    title: "Creating a Confidential Business Profile (CBP)",
    description: "Understand how to prepare a professional profile that presents a business clearly while protecting confidential information."
  },
  {
    num: 33,
    title: "Creating Anonymous Business Teasers",
    description: "Learn how to create short, attractive buyer teasers without revealing the seller’s identity."
  },
  {
    num: 34,
    title: "NDA & Confidentiality Management",
    description: "Learn how to manage NDA execution, controlled information sharing and confidentiality throughout the buyer process."
  },
  {
    num: 35,
    title: "Building a Buyer Database",
    description: "Learn how to create, organise and maintain a targeted database of potential business buyers."
  },
  {
    num: 36,
    title: "Building Referral Networks with CAs, Bankers & Stock Brokers",
    description: "Understand how professional intermediaries can become valuable sources of buyer and seller referrals."
  },
  {
    num: 37,
    title: "Approaching Strategic Buyers",
    description: "Learn how to identify and approach companies that may benefit strategically from acquiring a business."
  },
  {
    num: 38,
    title: "Approaching Financial Buyers, HNIs & Family Offices",
    description: "Understand how to engage financial buyers who are seeking investment, cash flow or ownership opportunities."
  },
  {
    num: 39,
    title: "Qualifying Buyers & Avoiding Time Wasters",
    description: "Learn how to identify serious, credible buyers and avoid unproductive discussions."
  },
  {
    num: 40,
    title: "Buyer Meetings & Discovery Conversations",
    description: "Understand how to conduct professional buyer meetings and uncover motivation, capacity and fit."
  },
  {
    num: 41,
    title: "Managing Buyer Objections & Concerns",
    description: "Learn how to address common buyer questions and concerns without overselling or compromising confidentiality."
  },
  {
    num: 42,
    title: "Buyer-Seller Matching & Deal Positioning",
    description: "Learn how to assess fit and position a business opportunity for the right buyer."
  },
  {
    num: 43,
    title: "Managing the Offer Process (EOI, LOI & Indicative Offers)",
    description: "Understand how buyer interest progresses into structured offers and formal next-step commitments."
  },
  {
    num: 44,
    title: "Negotiation Fundamentals for Business Brokers",
    description: "Learn core negotiation principles and how brokers can help both parties move towards agreement."
  },
  {
    num: 45,
    title: "Deal Structures – Cash Deals, Earn-Outs, Deferred Payments & Equity Swaps",
    description: "Understand common deal structures and how payment terms affect risk, valuation and seller outcomes."
  },
  {
    num: 46,
    title: "Due Diligence – Understanding the Buyer’s Investigation Process",
    description: "Learn what buyers investigate before acquisition and how brokers can support an organised diligence process."
  },
  {
    num: 47,
    title: "Data Rooms, Documentation Management & Information Requests",
    description: "Understand how to manage documents, data rooms and buyer information requests securely and efficiently."
  },
  {
    num: 48,
    title: "Purchase Agreements, Share Purchase Agreements (SPA) & Asset Purchase Agreements (APA)",
    description: "Learn the purpose and key differences between major transaction agreements."
  },
  {
    num: 49,
    title: "Transaction Closing, Handover & Success Fee Collection",
    description: "Understand the final steps of closing, ownership handover and professional collection of brokerage fees."
  },
  {
    num: 50,
    title: "Ethics, Professional Standards & Building a Long-Term Business Broking Career",
    description: "Learn how to build a respected, sustainable broking career through ethics, competence, relationships and consistent execution."
  }
];

async function update() {
  try {
    // 1. Get lessons
    const lessonsRes = await fetch(`${SUPABASE_URL}/rest/v1/lessons?select=id,title`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const lessons = await lessonsRes.json();
    console.log(`Fetched ${lessons.length} lessons from DB`);

    let updatedCount = 0;
    for (const lData of lessonsData) {
      // Find the corresponding lesson
      // Lessons in DB are named like "Module X - Lesson Y"
      const lessonPattern1 = `Lesson ${lData.num}`;
      const lessonPattern2 = `Lesson${lData.num}`;
      const matchedLesson = lessons.find(l => {
        const title = l.title || "";
        return title.includes(lessonPattern1) || title.replace(/\s+/g, '').includes(lessonPattern2);
      });

      if (!matchedLesson) {
        console.warn(`Could not find lesson matching: Lesson ${lData.num}`);
        continue;
      }

      // Update the title and description
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/lessons?id=eq.${matchedLesson.id}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: `Lesson ${lData.num}: ${lData.title}`,
          description: lData.description
        })
      });

      if (updateRes.ok) {
        updatedCount++;
      } else {
        console.error(`Failed to update lesson ${lData.num}:`, await updateRes.text());
      }
    }

    console.log(`Successfully updated ${updatedCount} lessons!`);
  } catch (e) {
    console.error("Update error:", e);
  }
}

update();
