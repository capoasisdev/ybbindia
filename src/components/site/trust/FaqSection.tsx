import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "What is the ABB Certification Programme?",
    answer:
      "The Authorised Business Broker Certification Programme is a structured professional-learning programme created by Yoova Business Broking. It covers seller acquisition, buyer qualification, valuation fundamentals, mandates, deal sourcing, negotiation, due diligence, closing and professional ethics.",
  },
  {
    question: "Who should enrol in the programme?",
    answer:
      "The programme is suitable for aspiring business brokers, entrepreneurs, consultants, Chartered Accountants, lawyers, financial professionals, wealth managers and others interested in business-sale transactions.",
  },
  {
    question: "Do I need previous business-broking experience?",
    answer:
      "No previous business-broking experience is required. The programme begins with foundational concepts and progresses through practical transaction processes.",
  },
  {
    question: "How many modules and lessons are included?",
    answer:
      "The programme contains 11 modules and 50 lessons covering the complete business-broking journey.",
  },
  {
    question: "How long will I have access?",
    answer:
      "Learners receive 365 days of programme access from the date access is activated.",
  },
  {
    question: "Is the programme self-paced?",
    answer:
      "Yes. Learners can study at their own pace within the 365-day access period, subject to the programme’s assignment and certification requirements.",
  },
  {
    question: "Are the assignments compulsory?",
    answer:
      "Yes. Practical assignments are an important part of the ABB certification process. Learners must complete the prescribed assignments and may be asked to revise incomplete submissions.",
  },
  {
    question: "How is the final examination conducted?",
    answer:
      "The final examination contains 50 multiple-choice questions randomly selected from the ABB question bank. Learners receive 60 minutes to complete the examination.",
  },
  {
    question: "What is the passing score?",
    answer:
      "Learners must score at least 70% in the final examination and satisfy the other programme requirements to qualify for certification.",
  },
  {
    question: "How is the examination delivered?",
    answer:
      "Learners access the examination through their learner dashboard. The examination contains 50 multiple-choice questions drawn randomly from the ABB question bank, with a 60-minute time limit.",
  },
  {
    question: "Who issues the certificate?",
    answer:
      "The ABB certificate is issued by Yoova Business Broking Pvt Ltd after the learner satisfies the programme’s certification requirements.",
  },
  {
    question: "Is ABB a government licence?",
    answer:
      "No. ABB is a professional educational certification issued by Yoova Business Broking Pvt Ltd. It is not a government licence, statutory authorisation or regulatory approval.",
  },
  {
    question: "Can the certificate be verified?",
    answer:
      "Yes. Every certificate contains a unique ABB ID that can be checked through the public certificate-verification page on the YBB website.",
  },
  {
    question: "Does the programme guarantee employment or income?",
    answer:
      "No. YBB does not guarantee employment, income, clients, brokerage commissions or successful deal closures. Results depend on the learner’s effort, skills, experience, market conditions and professional execution.",
  },
  {
    question: "Will I receive a workbook?",
    answer:
      "Yes. Enrolled learners receive access to the ABB Professional Workbook and the applicable course resources during their active access period.",
  },
  {
    question: "Can I share the videos or workbook with someone else?",
    answer:
      "No. Programme access and learning materials are for the registered learner only. Login credentials, videos, workbooks, questions and other materials must not be shared, copied, resold or distributed.",
  },
  {
    question: "Can I receive a refund after accessing the course?",
    answer:
      "No refund is available after course access or digital learning materials have been activated, except where required under applicable law or in the limited payment-error situations stated in the Refund Policy.",
  },
  {
    question: "How can I contact YBB before enrolling?",
    answer:
      "For programme, enrolment or payment-related questions, email info@ybbindia.com.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="border-t border-border bg-secondary/30 py-20">
      <div className="container-page max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Got Questions?
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Frequently Asked Questions</h2>
          <p className="mt-3 text-muted-foreground">
            Clear, transparent answers regarding enrolment, course structure, examinations and certification.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-border/80"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium text-foreground transition-colors hover:bg-secondary/40 focus-visible:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3 text-base">
                    <HelpCircle className="size-4 shrink-0 text-accent" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-accent",
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border/60 bg-secondary/20 p-5 pt-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
