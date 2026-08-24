export interface OfficialLessonAssignment {
  lessonNum: number;
  moduleNum: number;
  title: string;
  instructions: string;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  maxAttempts: number;
}

export const OFFICIAL_50_ASSIGNMENTS: OfficialLessonAssignment[] = [
  // Module 1: Introduction to Business Broking
  {
    lessonNum: 1,
    moduleNum: 1,
    title: "Lesson 1: Spot One Saleable Business",
    instructions:
      "Choose one local or familiar business. A hypothetical example is acceptable. Write its industry, two reasons the owner might consider selling, and one likely buyer type. Add one sentence explaining why that buyer could be a good match.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 2,
    moduleNum: 1,
    title: "Lesson 2: Build the Transaction Journey",
    instructions:
      "Copy the seven-stage flow shown in the lesson. Under each stage, write only one important action the broker must take. Circle the stage you expect to be most difficult and write one simple solution.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 3,
    moduleNum: 1,
    title: "Lesson 3: Create a Mini Market Map",
    instructions:
      "List three local businesses or business categories that could be sold in the future. List two possible buyer types and one professional who could refer an opportunity. Match one buyer type to one business and explain the fit in one sentence.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 4,
    moduleNum: 1,
    title: "Lesson 4: Match the Transaction Type",
    instructions:
      "Use these four examples: sale of a company, transfer of a franchise outlet, purchase of a minority stake, and a partnership between two firms. Label each as Business Sale, Franchise Transfer, Investment, or Strategic Partnership. Write one reason for each choice.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 2: Foundations of Business Ownership
  {
    lessonNum: 5,
    moduleNum: 2,
    title: "Lesson 5: Classify Three Business Models",
    instructions:
      "Choose three familiar businesses. For each, write the business model and main revenue source. Add one strength and one risk for each business.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 6,
    moduleNum: 2,
    title: "Lesson 6: Compare an SME, Startup and Corporate",
    instructions:
      "Choose one example of an SME, one startup and one corporate. Hypothetical examples are acceptable. Write the industry and revenue model of each. Add one possible transaction opportunity for each business type.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 7,
    moduleNum: 2,
    title: "Lesson 7: Identify a Business Life-Cycle Stage",
    instructions:
      "Choose two familiar businesses. Identify the life-cycle stage of each and write one clue supporting your choice. Add one likely challenge or transaction opportunity for each.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 8,
    moduleNum: 2,
    title: "Lesson 8: Understand One Seller's Motivation",
    instructions:
      "Imagine one business owner considering a sale. Choose the likely main reason: retirement, relocation, partnership issue, need for capital, or another reason. Write one possible hidden concern and two questions the broker should ask.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 3: Business Broker Ethics & Professional Standards
  {
    lessonNum: 9,
    moduleNum: 3,
    title: "Lesson 9: Make Two Ethical Decisions",
    instructions:
      "Review two situations: sharing financial statements before approval, and disclosing the fee structure before engagement. Mark each action Ethical or Unethical. Write the correct professional action in one sentence for each situation.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 10,
    moduleNum: 3,
    title: "Lesson 10: Plan Confidential Information Release",
    instructions:
      "Write these stages in order: Inquiry, Buyer Qualification, NDA, Initial Information, Due Diligence. Beside each stage, write None, Basic, or Detailed to show the level of information that may be shared. Add one control that protects the seller's confidentiality.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 11,
    moduleNum: 3,
    title: "Lesson 11: Resolve Two Conflicts of Interest",
    instructions:
      "Review two cases: a buyer offers the broker an undisclosed incentive, and the broker wants to buy the listed business. For each case, choose the safest response: Disclose, Obtain Written Consent, or Decline/Withdraw. Write one sentence explaining your choice.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 12,
    moduleNum: 3,
    title: "Lesson 12: Run a Five-Minute Discovery Conversation",
    instructions:
      "Role-play with someone or use a hypothetical business owner. Ask: Why are you considering a transaction? What outcome, concern and timeline do you have? Summarise the answers and write one suitable next step.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 4: Finding Business Sale Opportunities
  {
    lessonNum: 13,
    moduleNum: 4,
    title: "Lesson 13: Start a Five-Prospect List",
    instructions:
      "List five business owners or hypothetical prospects. Record business/industry, city, possible opportunity and prospect category A, B or C. Choose one prospect for a respectful first approach.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 14,
    moduleNum: 4,
    title: "Lesson 14: Create a Five-Contact Network Map",
    instructions:
      "Select one CA, lawyer, banker, consultant or wealth professional, and business owner. Real names are optional. Write how each person could help the Business Broking network. Draft one short introductory message for any one contact.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 15,
    moduleNum: 4,
    title: "Lesson 15: Plan Three Referral Relationships",
    instructions:
      "Choose three possible referral partners from your network or use hypothetical profiles. Write the value each partner can bring and one value you can offer in return. Record one practical next action for each partner.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 16,
    moduleNum: 4,
    title: "Lesson 16: Prepare a Seller Snapshot",
    instructions:
      "Choose one real or hypothetical business owner. Record the business overview, seller motivation, desired outcome and main concern. Write the next question the broker should ask.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 5: Understanding Buyers
  {
    lessonNum: 17,
    moduleNum: 5,
    title: "Lesson 17: Match Four Buyer Types",
    instructions:
      "Choose one business sale opportunity. Consider an individual buyer, an existing business owner, an HNI and a strategic buyer. Mark each as Strong Fit, Possible Fit or Weak Fit, then select the best buyer type.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 18,
    moduleNum: 5,
    title: "Lesson 18: Assess One Business Like an Investor",
    instructions:
      "Choose one business. Write two attractive features, two risks and one growth opportunity. Name the investor type that may suit the opportunity best.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 19,
    moduleNum: 5,
    title: "Lesson 19: Qualify Two Buyers",
    instructions:
      "Create two simple hypothetical buyer profiles. Check investment capacity, funding source, experience, business fit and timeline for each. Give each buyer an A, B or C rating and state the main reason.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 20,
    moduleNum: 5,
    title: "Lesson 20: Create a Six-Point Buyer Brief",
    instructions:
      "Write one short point each on timeline, information sharing and due diligence. Add one short point each on financing, negotiation and confidentiality. End with the next action expected from the buyer.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 6: Business Valuation Fundamentals
  {
    lessonNum: 21,
    moduleNum: 6,
    title: "Lesson 21: Rate Five Valuation Drivers",
    instructions:
      "Choose one business. Rate Revenue, Profitability, Growth, Owner Dependency and Key Risks as Strong, Average or Weak. Write three sentences explaining how the ratings may affect valuation.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 22,
    moduleNum: 6,
    title: "Lesson 22: Calculate Net Asset Value",
    instructions:
      "Use: Land ₹1.5 Cr, Building ₹1 Cr, Machinery ₹75 Lakh, Inventory ₹50 Lakh, Cash ₹25 Lakh. Use liabilities: Loans ₹1 Cr and Creditors ₹25 Lakh. Show: Total Assets = __; Total Liabilities = __; Net Asset Value = Total Assets - Total Liabilities = __.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 23,
    moduleNum: 6,
    title: "Lesson 23: Apply Three EBITDA Multiples",
    instructions:
      "Assume EBITDA = ₹1.5 Crore. Calculate Value = EBITDA × Multiple at 3×, 4× and 5×. Choose one value and write one reason a buyer might use that multiple.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 24,
    moduleNum: 6,
    title: "Lesson 24: Estimate a Market-Based Value Range",
    instructions:
      "Assume similar businesses trade at 3× to 5× EBITDA and the target business has EBITDA of ₹1 Crore. Calculate Low Value = ₹1 Crore × 3 and High Value = ₹1 Crore × 5. Calculate the middle value at 4× and name one factor that could move the multiple up or down.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 25,
    moduleNum: 6,
    title: "Lesson 25: Calculate EBITDA and SDE",
    instructions:
      "Use: Net Profit ₹20 Lakh, Owner Salary ₹12 Lakh, Personal Vehicle Expense ₹3 Lakh, Interest ₹5 Lakh, Taxes ₹4 Lakh and Depreciation ₹6 Lakh. Show: EBITDA = Net Profit + Interest + Taxes + Depreciation = __. Show: SDE = Net Profit + Owner Salary + Personal Vehicle Expense = __; then state which measure suits a small buyer and which suits a corporate buyer.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 26,
    moduleNum: 6,
    title: "Lesson 26: Create a One-Industry Valuation Note",
    instructions:
      "Choose one industry: Manufacturing, Restaurant, Education, Healthcare or Technology. List three valuation drivers and one major risk from the lesson. State whether the industry may receive a Low, Medium or High multiple and explain why in one sentence.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 27,
    moduleNum: 6,
    title: "Lesson 27: Respond to Two Seller Expectations",
    instructions:
      "Choose any two statements: 'I must recover my investment,' 'My competitor sold for more,' 'I want a very high multiple,' or 'I spent years building this business.' For each, write one sentence that acknowledges the seller's view and one sentence based on valuation evidence. End each response with one constructive next step.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 7: Creating Business Sale Mandates
  {
    lessonNum: 28,
    moduleNum: 7,
    title: "Lesson 28: Compare Exclusive and Non-Exclusive Mandates",
    instructions:
      "Compare Seller Control, Broker Effort, Confidentiality, Competition and Closure Probability. For each factor, mark Exclusive or Non-Exclusive as High, Medium or Low. Choose the mandate you would recommend in a serious sale and write one reason.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 29,
    moduleNum: 7,
    title: "Lesson 29: Give a 60-Second Exclusive-Mandate Pitch",
    instructions:
      "Write one sentence each on confidentiality, focused buyer search and accountability. Add one sentence on transaction coordination. End with a polite request for exclusive representation.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 30,
    moduleNum: 7,
    title: "Lesson 30: Complete the Key Mandate Terms",
    instructions:
      "Use one hypothetical sale and fill: Parties, Scope, Duration and Fee. Add Confidentiality, Buyer Protection and Termination terms in one line each. Mark the draft 'For discussion - legal review required.'",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 31,
    moduleNum: 7,
    title: "Lesson 31: Check Seller Readiness",
    instructions:
      "List one required item under Business, Financial, Legal, Asset and Customer Information. Mark each item Available or Missing for a hypothetical seller. Select the three missing items the broker should request first.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 32,
    moduleNum: 7,
    title: "Lesson 32: Create a One-Page Mini CBP",
    instructions:
      "Choose a hypothetical business. Write one or two lines under: Company Overview, Products/Services, Financial Highlights, Strengths, Growth Opportunity and Transaction Overview. Remove any confidential name or identifying detail unless permission exists.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 33,
    moduleNum: 7,
    title: "Lesson 33: Write a Six-Line Anonymous Teaser",
    instructions:
      "Use a hypothetical manufacturing business and do not mention its name or exact location. Write: Headline, Sector/Region, Revenue or EBITDA Range, two Investment Highlights, Growth Opportunity and Next Step. Check that a reader cannot identify the seller from the teaser alone.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 34,
    moduleNum: 7,
    title: "Lesson 34: Make a Five-Step Confidentiality Checklist",
    instructions:
      "Write five controls: qualify buyer, sign NDA, share in stages, record every release, and remind participants of confidentiality. Create one sample log entry with Buyer Code, Document Shared and Date. Add one action to take if confidentiality is breached.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 8: Buyer Acquisition & Deal Sourcing
  {
    lessonNum: 35,
    moduleNum: 8,
    title: "Lesson 35: Create Three Buyer Profiles",
    instructions:
      "Create three real or hypothetical buyer codes. Record buyer type, industry preference, investment range, geography and qualification status. Add the next follow-up date or action for each buyer.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 36,
    moduleNum: 8,
    title: "Lesson 36: Plan Five Referral Contacts",
    instructions:
      "Select one CA, banker, stock broker/wealth professional, lawyer and business contact. Hypothetical profiles are acceptable. Write the possible referral value and first outreach message for each. Choose one contact for follow-up this week.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 37,
    moduleNum: 8,
    title: "Lesson 37: Identify Three Strategic Buyer Types",
    instructions:
      "Choose one hypothetical business for sale. Identify a competitor, supplier and customer that could be strategic buyer types. Write one synergy and the likely decision-maker role for each buyer type.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 38,
    moduleNum: 8,
    title: "Lesson 38: Build Three Investor Profiles",
    instructions:
      "Create one hypothetical HNI, one Family Office and one Private Equity profile. For each, record investment range, industry preference and preferred deal type. Match one profile to a business and explain the fit in one sentence.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 39,
    moduleNum: 8,
    title: "Lesson 39: Complete One Buyer Qualification",
    instructions:
      "Create one hypothetical buyer and record Name/Code, Organisation, Buyer Type, Industry, Investment Range, Funding Source, Decision-Maker, Timeline and NDA Status. Give the buyer an A, B, C or D rating. Write one reason for the rating and one next action.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 40,
    moduleNum: 8,
    title: "Lesson 40: Prepare and Use Six Discovery Questions",
    instructions:
      "Write one question each about objectives, acquisition criteria, investment capacity, decision process, timeline and concerns. Answer the questions as one hypothetical buyer. Write the agreed next step.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 41,
    moduleNum: 8,
    title: "Lesson 41: Handle Two Buyer Objections",
    instructions:
      "Choose any two objections: valuation too high, numbers not trusted, owner dependency, or risky industry. For each, write one clarifying question and one calm professional response. Add one follow-up question that moves the discussion forward.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 42,
    moduleNum: 8,
    title: "Lesson 42: Score Three Buyer Matches",
    instructions:
      "Choose one business and consider one strategic buyer, one financial buyer and one entrepreneur. Score each buyer from 1 to 5 for Strategic Fit, Financial Capacity and Genuine Interest. Select the best match and write one sentence positioning the opportunity for that buyer.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 9: Offer Management & Negotiation
  {
    lessonNum: 43,
    moduleNum: 9,
    title: "Lesson 43: Compare Two Offers",
    instructions:
      "Offer A: ₹9 Cr price, ₹8 Cr upfront, ₹1 Cr after 12 months, 45-day closing, financing condition. Offer B: ₹8.7 Cr all cash, 30-day closing, no financing condition. Compare Price, Upfront Payment, Timeline, Conditions and Certainty. Recommend one offer and explain the main reason.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 44,
    moduleNum: 9,
    title: "Lesson 44: Bridge an ₹8-10 Crore Price Gap",
    instructions:
      "Assume the seller wants ₹10 Crore and the buyer offers ₹8 Crore. Write two likely interests for each side and one non-price concession each side could offer. Propose one bridge structure and one neutral sentence the broker can use to reopen discussion.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 45,
    moduleNum: 9,
    title: "Lesson 45: Design Two Deal Structures",
    instructions:
      "Assume the seller wants ₹12 Crore and the buyer offers ₹9 Crore. Create one Cash Deal and one Hybrid Deal using upfront, deferred or earn-out components. Make every component add up clearly. Write one benefit and one risk for each structure, then select the more workable option.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 10: Due Diligence & Transaction Execution
  {
    lessonNum: 46,
    moduleNum: 10,
    title: "Lesson 46: Prepare an Eight-Document Due Diligence List",
    instructions:
      "List one document under each category: Financial, Legal, Tax, Operations, Customers, Suppliers, Employees and Compliance. Mark each item Available, Requested or Missing for a hypothetical seller. Select the three items that should be collected first.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 47,
    moduleNum: 10,
    title: "Lesson 47: Build a Six-Folder Data Room",
    instructions:
      "Create these folders on paper or digitally: Corporate, Financial, Tax, Legal, Commercial and Employees. Place one example document under each folder. Create three information-request rows with Request, Owner, Due Date and Status.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 48,
    moduleNum: 10,
    title: "Lesson 48: Choose Between an SPA and APA",
    instructions:
      "Compare SPA and APA for Ownership Transfer, Assets, Contracts, Liabilities and Typical Use. Assume one buyer wants the whole company and another wants only selected assets. Choose the likely structure for each buyer and give one reason. Final legal advice must come from qualified professionals.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
  {
    lessonNum: 49,
    moduleNum: 10,
    title: "Lesson 49: Prepare an Eight-Step Closing Checklist",
    instructions:
      "List: Conditions Precedent, Documents, Funds, Ownership, Employees, Customers, Suppliers and Success Fee. Mark each item Complete, Pending or Not Applicable for a hypothetical closing. Assign an owner and due date to the next three pending actions.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },

  // Module 11: Ethics, Professional Standards & Career Development
  {
    lessonNum: 50,
    moduleNum: 11,
    title: "Lesson 50: Write Your Five-Point ABB Charter",
    instructions:
      "Write five personal commitments covering ethics, confidentiality, communication, client service and continuous learning. Add one behaviour that you will avoid. Choose one professional-development action to complete in the next 30 days.",
    allowedFileTypes: ["pdf", "docx"],
    maxFileSizeMb: 10,
    maxAttempts: 3,
  },
];
