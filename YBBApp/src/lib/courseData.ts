import { Module } from "../types/app.types";

export const INITIAL_MODULES: Module[] = [
  {
    id: "mod-01",
    number: 1,
    title: "Introduction to Business Broking",
    description: "The role of a business broker, Indian market landscape, fee structures, and deal lifecycle.",
    status: "in_progress",
    workbookSummary: "Module 1 covers the core definition of business broking in India, ethical boundaries, types of M&A transactions, and intermediary economics.",
    assignmentBrief: "Write a 500-word positioning statement defining your brokerage advisory services for MSME business owners in your target city.",
    lessons: [
      { id: "les-01-01", moduleId: "mod-01", title: "1. What is Business Broking?", summary: "Role of intermediaries and transaction spectrum.", position: 1, durationSeconds: 380, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
      { id: "les-01-02", moduleId: "mod-01", title: "2. The Indian M&A Landscape for MSMEs", summary: "Market size, growth drivers, and unorganized broker challenges.", position: 2, durationSeconds: 490, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { id: "les-01-03", moduleId: "mod-01", title: "3. The Anatomy of a Deal", summary: "From initial engagement to post-closing handover.", position: 3, durationSeconds: 560, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
      { id: "les-01-04", moduleId: "mod-01", title: "4. Revenue Models & Retainers vs Success Fees", summary: "Industry commission norms (2-8%) and retainer structures.", position: 4, durationSeconds: 420, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
      { id: "les-01-05", moduleId: "mod-01", title: "5. Becoming an Authorised Business Broker", summary: "Ethics, professional certification and client trust.", position: 5, durationSeconds: 350, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
      { id: "les-01-06", moduleId: "mod-01", title: "6. Module 1 Summary & Next Steps", summary: "Key takeaways and practical reflection questions.", position: 6, durationSeconds: 240, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4" },
    ]
  },
  {
    id: "mod-02",
    number: 2,
    title: "Foundations of Business Ownership",
    description: "Legal structures, sole proprietorship vs LLP vs Pvt Ltd, balance sheet basics, and shareholder dynamics.",
    status: "in_progress",
    workbookSummary: "Understanding entity formats in India (Pvt Ltd, LLP, Partnership), asset sale vs share sale mechanics, and GST implications.",
    assignmentBrief: "Compare the pros and cons of an Asset Sale versus an Equity (Share) Sale for a manufacturing business with 15 crores turnover.",
    lessons: [
      { id: "les-02-01", moduleId: "mod-02", title: "1. Legal Forms of Business in India", summary: "Proprietorships, LLPs, Private Limiteds and Section 8 companies.", position: 1, durationSeconds: 510, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
      { id: "les-02-02", moduleId: "mod-02", title: "2. Asset Sale vs Equity Sale", summary: "Taxation, liability transfer, and regulatory transfer hurdles.", position: 2, durationSeconds: 620, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
      { id: "les-02-03", moduleId: "mod-02", title: "3. Reading Financial Statements for Broking", summary: "P&L, Balance Sheet, and Cash Flow statement essentials.", position: 3, durationSeconds: 740, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4" },
      { id: "les-02-04", moduleId: "mod-02", title: "4. Understanding Owner's Discretionary Earnings (SDE)", summary: "Recasting financials and normalizing promoter perks.", position: 4, durationSeconds: 580, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" },
      { id: "les-02-05", moduleId: "mod-02", title: "5. Working Capital & Debt Considerations", summary: "Net working capital pegs and debt-free cash-free transactions.", position: 5, durationSeconds: 460, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4" },
    ]
  },
  {
    id: "mod-03",
    number: 3,
    title: "Ethics & Professional Standards",
    description: "Confidentiality, non-disclosure agreements, conflict of interest, anti-fraud, and compliance guidelines.",
    status: "in_progress",
    workbookSummary: "Standard operating procedures for managing sensitive commercial data and avoiding breach of trust during negotiations.",
    assignmentBrief: "Draft a Non-Disclosure Agreement (NDA) checklist for high-profile business sales where secrecy from competitors is vital.",
    lessons: [
      { id: "les-03-01", moduleId: "mod-03", title: "1. The Fiduciary Duty of an ABB", summary: "Acting in good faith, transparency, and duty of care.", position: 1, durationSeconds: 390, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4" },
      { id: "les-03-02", moduleId: "mod-03", title: "2. Confidentiality Architecture", summary: "NDAs, blind teasers, and controlled data room permissions.", position: 2, durationSeconds: 480, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
      { id: "les-03-03", moduleId: "mod-03", title: "3. Managing Conflicts of Interest & Dual Agency", summary: "Representing both buyer and seller transparently.", position: 3, durationSeconds: 430, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { id: "les-03-04", moduleId: "mod-03", title: "4. Regulatory Compliance & Anti-Money Laundering", summary: "KYC verification and banking compliance in India.", position: 4, durationSeconds: 360, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    ]
  },
  {
    id: "mod-04",
    number: 4,
    title: "Finding & Pitching Sellers",
    description: "Sourcing seller mandates, cold outreach, referral partnerships with CAs and bankers, and pitch decks.",
    status: "in_progress",
    workbookSummary: "Strategies for discovering retiring founders, succession planning triggers, and running executive prospecting campaigns.",
    assignmentBrief: "Create a 3-step outreach email sequence and a phone script targeting SME founders in the logistics sector contemplating retirement.",
    lessons: [
      { id: "les-04-01", moduleId: "mod-04", title: "1. Identifying Motivated Sellers", summary: "Retirement, health, partnership friction, and capital constraints.", position: 1, durationSeconds: 520, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
      { id: "les-04-02", moduleId: "mod-04", title: "2. Sourcing Channels: CAs, CSs, and Bankers", summary: "Building professional referral networks.", position: 2, durationSeconds: 490, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
      { id: "les-04-03", moduleId: "mod-04", title: "3. The First Discovery Call", summary: "Qualifying seller readiness and realistic valuation expectations.", position: 3, durationSeconds: 610, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4" },
      { id: "les-04-04", moduleId: "mod-04", title: "4. The Winning Brokerage Pitch Deck", summary: "Structure of an engaging mandate presentation.", position: 4, durationSeconds: 540, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
      { id: "les-04-05", moduleId: "mod-04", title: "5. Signing the Exclusive Representation Agreement", summary: "Retainers, exclusivity period, and tail clauses.", position: 5, durationSeconds: 450, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
    ]
  },
  {
    id: "mod-05",
    number: 5,
    title: "Understanding Buyers",
    description: "Buyer segmentation (strategic, financial, individual), proof of funds, buyer qualification, and managing investor inquiries.",
    status: "in_progress",
    workbookSummary: "Module 5 focuses on screening genuine acquirers, understanding their financial capabilities, and preventing time-wasters.",
    assignmentBrief: "Build a Buyer Screening Scorecard evaluating financial capacity, operational experience, timeline, and cultural fit.",
    lessons: [
      { id: "les-05-01", moduleId: "mod-05", title: "1. Buyer segmentation", summary: "Corporate acquirers, search funds, PE firms, and first-time buyers.", position: 1, durationSeconds: 380, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
      { id: "les-05-02", moduleId: "mod-05", title: "2. The investor mindset", summary: "ROI calculations, payback periods, and risk matrices.", position: 2, durationSeconds: 485, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { id: "les-05-03", moduleId: "mod-05", title: "3. Qualifying genuine buyers", summary: "Proof of funds (POF), track record, and intentionality tests.", position: 3, durationSeconds: 760, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
      { id: "les-05-04", moduleId: "mod-05", title: "4. Managing buyer expectations", summary: "Preventing deal fatigue and handling unreasonable demands.", position: 4, durationSeconds: 468, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
      { id: "les-05-05", moduleId: "mod-05", title: "5. Building a proprietary buyer database", summary: "CRM management and matching algorithms.", position: 5, durationSeconds: 510, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
      { id: "les-05-06", moduleId: "mod-05", title: "6. Handling initial seller-buyer meetings", summary: "Facilitating productive conversations without friction.", position: 6, durationSeconds: 420, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4" },
    ]
  },
  {
    id: "mod-06",
    number: 6,
    title: "Business Valuation Fundamentals",
    description: "SDE multiples, EBITDA multiples, Discounted Cash Flow (DCF), Asset-based approach, and industry benchmarking in India.",
    status: "in_progress",
    workbookSummary: "Practical business valuation formulas, rule-of-thumb multiples by sector, and defensible adjustments.",
    assignmentBrief: "Perform an SDE Multiple valuation for a precision machining business with 8 Cr revenue and recast their EBITDA.",
    lessons: [
      { id: "les-06-01", moduleId: "mod-06", title: "1. The 3 Pillars of SME Valuation", summary: "Asset approach, Market multiple approach, Income approach.", position: 1, durationSeconds: 530, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
      { id: "les-06-02", moduleId: "mod-06", title: "2. Recasting Financials for True Profitability", summary: "Normalizing one-time expenses, promoter salary, and family payroll.", position: 2, durationSeconds: 610, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
      { id: "les-06-03", moduleId: "mod-06", title: "3. Sector Multiples in India (Retail, SaaS, Manufacturing, Services)", summary: "Current benchmarks and key valuation drivers.", position: 3, durationSeconds: 690, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4" },
      { id: "les-06-04", moduleId: "mod-06", title: "4. Intangible Value: Brand, IP, Contracts & Customer Concentration", summary: "How risk discounts affect final transaction multiples.", position: 4, durationSeconds: 490, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" },
      { id: "les-06-05", moduleId: "mod-06", title: "5. Presenting the Valuation Range to Sellers", summary: "Setting achievable price bands to ensure transaction success.", position: 5, durationSeconds: 440, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4" },
    ]
  },
  {
    id: "mod-07",
    number: 7,
    title: "Sale Mandates & Confidentiality",
    description: "Drafting exclusive mandates, retainer agreements, NDA drafting, blind teasers, and Information Memorandum (CIM) creation.",
    status: "in_progress",
    workbookSummary: "Creating high-converting Confidential Information Memorandums (CIM) and establishing leak-proof dataroom workflows.",
    assignmentBrief: "Draft a 2-page Confidential Blind Teaser for an e-commerce D2C brand without revealing identifying company details.",
    lessons: [
      { id: "les-07-01", moduleId: "mod-07", title: "1. Structuring the Exclusive Mandate", summary: "Key terms: fee percentages, minimum retainer, exclusive term.", position: 1, durationSeconds: 470, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4" },
      { id: "les-07-02", moduleId: "mod-07", title: "2. The Art of the Blind Teaser", summary: "Generating high-intent inbound interest without breaching secrecy.", position: 2, durationSeconds: 520, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
      { id: "les-07-03", moduleId: "mod-07", title: "3. Writing a Comprehensive Information Memorandum (CIM)", summary: "Business model, market opportunity, operations, financial summaries.", position: 3, durationSeconds: 680, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { id: "les-07-04", moduleId: "mod-07", title: "4. Setting Up and Managing a Virtual Data Room (VDR)", summary: "Watermarking, folder structure, access hierarchies, and audit logs.", position: 4, durationSeconds: 590, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    ]
  },
  {
    id: "mod-08",
    number: 8,
    title: "Marketing the Business",
    description: "Direct outreach campaigns, broker networks, digital listing platforms, and creating competitive deal tension.",
    status: "in_progress",
    workbookSummary: "Multichannel marketing for business listings to attract multiple simultaneous bids.",
    assignmentBrief: "Design a targeted marketing plan identifying 25 strategic corporate acquirers for a B2B SaaS startup.",
    lessons: [
      { id: "les-08-01", moduleId: "mod-08", title: "1. Building the Target Acquirer List", summary: "Direct competitors, adjacent industry players, PE platform companies.", position: 1, durationSeconds: 460, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
      { id: "les-08-02", moduleId: "mod-08", title: "2. Running Confidential Outreach Campaigns", summary: "Cold email cadence, LinkedIn executive messaging, phone introductions.", position: 2, durationSeconds: 540, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
      { id: "les-08-03", moduleId: "mod-08", title: "3. Leveraging Business Listing Portals", summary: "Optimizing listings on SME portals while retaining anonymity.", position: 3, durationSeconds: 380, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4" },
      { id: "les-08-04", moduleId: "mod-08", title: "4. Creating Competitive Deal Tension & Bidding Deadlines", summary: "Managing multiple IOIs and driving higher valuations.", position: 4, durationSeconds: 610, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
    ]
  },
  {
    id: "mod-09",
    number: 9,
    title: "Due Diligence & Structuring Deals",
    description: "Financial, legal, tax, and operational due diligence, deal structures (earnouts, vendor financing, escrows), and LOI terms.",
    status: "in_progress",
    workbookSummary: "Due diligence checklists, mitigating seller risk, and structuring non-competes and earnout milestones.",
    assignmentBrief: "Analyze a sample Letter of Intent (LOI) and identify 4 potential legal and financial risks for the seller.",
    lessons: [
      { id: "les-09-01", moduleId: "mod-09", title: "1. The Letter of Intent (LOI) & Term Sheet", summary: "Binding vs non-binding clauses, exclusivity periods, break fees.", position: 1, durationSeconds: 620, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
      { id: "les-09-02", moduleId: "mod-09", title: "2. Financial Due Diligence (Quality of Earnings)", summary: "Revenue recognition, EBITDA adjustments, tax compliance check.", position: 2, durationSeconds: 710, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4" },
      { id: "les-09-03", moduleId: "mod-09", title: "3. Legal & Regulatory Due Diligence in India", summary: "Statutory licenses, RoC compliance, labor laws, pending litigation.", position: 3, durationSeconds: 580, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" },
      { id: "les-09-04", moduleId: "mod-09", title: "4. Deal Structuring: Earnouts, Escrows & Vendor Debt", summary: "Bridging valuation gaps and structuring deferred consideration.", position: 4, durationSeconds: 650, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4" },
    ]
  },
  {
    id: "mod-10",
    number: 10,
    title: "Closing & Post-Sale Transition",
    description: "Definitive agreements (SPA / APA), closing conditions, escrow management, handover protocols, and collecting success fees.",
    status: "in_progress",
    workbookSummary: "Final closing execution protocols, Share Purchase Agreements (SPA), and smooth founder handover management.",
    assignmentBrief: "Draft a 100-day Post-Sale Handover Plan detailing founder transition responsibilities and milestone tracking.",
    lessons: [
      { id: "les-10-01", moduleId: "mod-10", title: "1. The Share Purchase Agreement (SPA) Fundamentals", summary: "Representations, warranties, indemnities, and disclosure letters.", position: 1, durationSeconds: 680, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4" },
      { id: "les-10-02", moduleId: "mod-10", title: "2. Conditions Precedent & Closing Mechanics", summary: "Regulatory approvals, board resolutions, bank escrow mechanics.", position: 2, durationSeconds: 530, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
      { id: "les-10-03", moduleId: "mod-10", title: "3. Post-Closing Handover & Transition Management", summary: "Managing staff retention, client communication, and founder handover.", position: 3, durationSeconds: 470, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { id: "les-10-04", moduleId: "mod-10", title: "4. Invoicing and Collecting Brokerage Success Fees", summary: "Escrow deduction agreements and milestone fee disbursements.", position: 4, durationSeconds: 390, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    ]
  },
  {
    id: "mod-11",
    number: 11,
    title: "Building Your Broking Practice",
    description: "Branding as an ABB, lead generation funnels, team scaling, tech stack (CRM, VDR, listing tools), and long-term firm valuation.",
    status: "in_progress",
    workbookSummary: "Scaling from a solo Authorised Business Broker into a boutique regional M&A advisory firm.",
    assignmentBrief: "Create a 12-month Business Plan for your ABB practice with projected mandates, revenue targets, and marketing budget.",
    lessons: [
      { id: "les-11-01", moduleId: "mod-11", title: "1. Positioning Your ABB Advisory Brand", summary: "Niche specialization, geographic focus, and thought leadership.", position: 1, durationSeconds: 440, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
      { id: "les-11-02", moduleId: "mod-11", title: "2. Building a Deal Flow Engine", summary: "Referral ecosystems, digital funnels, and executive networking.", position: 2, durationSeconds: 510, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
      { id: "les-11-03", moduleId: "mod-11", title: "3. Technology Stack for Modern Brokers", summary: "CRMs, secure VDRs, valuation software, and pipeline management.", position: 3, durationSeconds: 460, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4" },
      { id: "les-11-04", moduleId: "mod-11", title: "4. Scaling to a Multi-Broker Firm & Summary", summary: "Hiring analysts, associate brokers, and institutional partnerships.", position: 4, durationSeconds: 580, isComplete: false, isLocked: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
    ]
  }
];
