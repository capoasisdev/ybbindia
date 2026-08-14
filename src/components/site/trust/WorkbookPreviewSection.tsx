import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const WORKBOOK_ITEMS = [
  {
    id: "journey",
    title: "Business-Broking Transaction Journey",
    module: "Module 01 - 03",
    description:
      "A complete stage-by-stage map from initial seller intake to post-closing handover and fee collection.",
    specimenContent: [
      "Stage 1: Seller Engagement & Mandate Signing",
      "Stage 2: Confidential Valuation & Information Memorandum",
      "Stage 3: Buyer Identification & Qualification",
      "Stage 4: Deal Structuring, Due Diligence & SPA Execution",
    ],
  },
  {
    id: "buyer-qualification",
    title: "Buyer-Qualification Worksheet",
    module: "Module 04",
    description:
      "Structured framework for screening financial buyers vs strategic buyers, funds verification and motivation scoring.",
    specimenContent: [
      "Proof of Funds (POF) Verification Protocol",
      "Strategic vs Financial Buyer Readiness Matrix",
      "Confidential NDA Execution Tracker",
      "Buyer Interest & Capital Allocation Scorecard",
    ],
  },
  {
    id: "valuation",
    title: "Business-Valuation Exercise",
    module: "Module 05",
    description:
      "Practical workbooks on Seller's Discretionary Earnings (SDE), EBITDA add-backs and asset vs stock deal adjustments.",
    specimenContent: [
      "Adjusted EBITDA Calculation Template",
      "Owner Compensation & Non-Recurring Expense Add-backs",
      "Industry Multiple Range Reference Table",
      "Working Capital Normalisation Worksheet",
    ],
  },
  {
    id: "mandate",
    title: "Mandate Checklist",
    module: "Module 06",
    description:
      "Essential terms for exclusive vs non-exclusive sale mandates, retainer fee terms and success fee agreements.",
    specimenContent: [
      "Mandate Scope & Exclusive Authorization Terms",
      "Success Fee Structure & Tail Period Clauses",
      "Confidentiality & Non-Disclosure Requirements",
      "Seller Representation & Indemnity Verification",
    ],
  },
  {
    id: "due-diligence",
    title: "Due-Diligence Checklist",
    module: "Module 08 - 09",
    description:
      "Standard virtual data room (VDR) structure covering financial, legal, operational, tax and employee compliance.",
    specimenContent: [
      "3-Year Audited Financials & GST Reconciliation",
      "Material Customer & Supplier Contract Review",
      "Statutory & Environmental License Audit",
      "Asset Register & Encumbrance Verification",
    ],
  },
  {
    id: "career-plan",
    title: "90-Day ABB Career Plan",
    module: "Module 11",
    description:
      "Step-by-step roadmap for establishing an independent broking practice or expanding an advisory firm.",
    specimenContent: [
      "Days 1–30: Network Building & Referral Sourcing",
      "Days 31–60: Seller Pipeline & Mandate Acquisition",
      "Days 61–90: Buyer Matching & Negotiation Protocols",
      "Key Performance Indicators & Ethics Checklist",
    ],
  },
];

export function WorkbookPreviewSection() {
  const [selectedId, setSelectedId] = useState(WORKBOOK_ITEMS[0].id);
  const activeItem = WORKBOOK_ITEMS.find((item) => item.id === selectedId) || WORKBOOK_ITEMS[0];

  return (
    <section className="container-page py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Workbook Preview
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Professional Workbook and Practical Resources Included
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          The ABB Professional Workbook supports the complete learning journey with lesson notes,
          practical exercises, structured assignments, assessment questions and learner
          workspaces. It is designed to help learners move beyond passive video consumption and
          apply business-broking concepts in a structured manner.
        </p>
      </div>

      {/* Preview tabs & display */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        {/* Navigation list */}
        <div className="flex flex-col gap-2">
          {WORKBOOK_ITEMS.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`flex items-start gap-4 rounded-xl p-4 text-left transition-all ${
                  isSelected
                    ? "border border-accent/40 bg-accent/10 shadow-soft"
                    : "border border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                }`}
              >
                <div
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <FileText className="size-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.module}
                  </span>
                  <h3
                    className={`text-sm font-semibold ${
                      isSelected ? "text-foreground" : "text-foreground/80"
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Specimen Sheet Display */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-lift sm:p-8">
          {/* Watermark overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-5"
          >
            <span className="rotate-[-25deg] select-none font-display text-7xl font-bold uppercase tracking-widest text-foreground">
              SPECIMEN PREVIEW
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-accent" />
              <span className="font-display text-sm font-semibold">
                ABB Professional Workbook
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="size-3" /> Sample Preview
            </span>
          </div>

          <div className="mt-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              {activeItem.module}
            </span>
            <h4 className="mt-1 text-xl font-semibold text-foreground">{activeItem.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {activeItem.description}
            </p>

            <div className="mt-6 space-y-3 rounded-xl border border-border/80 bg-secondary/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Specimen Worksheet Sections
              </p>
              {activeItem.specimenContent.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-foreground/90">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-xs font-semibold text-accent-foreground">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting points footer */}
          <div className="mt-8 border-t border-border pt-6">
            <ul className="grid gap-2.5 text-xs text-muted-foreground sm:grid-cols-2">
              {[
                "Available to enrolled learners",
                "Aligned with all 11 programme modules",
                "Includes practical exercises & assignments",
                "Accessible during active course period",
              ].map((pt) => (
                <li key={pt} className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-accent" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <Button size="lg" variant="outline" asChild className="group rounded-lg px-7">
          <Link to="/curriculum">
            Explore the Full Curriculum
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
