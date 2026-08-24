export type ScreenName =
  | "splash"
  | "onboarding-1"
  | "onboarding-2"
  | "onboarding-3"
  | "sign-in"
  | "otp-verify"
  | "home"
  | "enrol"
  | "learn"
  | "lesson-player"
  | "exam"
  | "certificate"
  | "verify"
  | "profile"
  | "notifications"
  | "assignment";

export type TabName = "home" | "learn" | "verify" | "profile";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  abbId?: string;
  isEnrolled: boolean;
  enrolledAt?: string;
  daysRemaining?: number;
  city?: string;
  state?: string;
  organisation?: string;
  profession?: string;
  education?: string;
  certificateName?: string;
  certificateNameLocked?: boolean;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPincode?: string;
  gstNumber?: string;
}

export interface UserPaymentReceipt {
  hasPayment: boolean;
  amountPaidRupees: number;
  baseAmountRupees: number;
  gstAmountRupees: number;
  gstRatePercent: number;
  invoiceNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  // Current admin configured price
  currentAdminPriceRupees: number;
  currentAdminBasePriceRupees: number;
  currentAdminGstAmountRupees: number;
  currentAdminGstPercent: number;
  accessDurationDays: number;
  programmeName: string;
  companyLegalName: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  summary: string | null;
  position: number;
  durationSeconds: number;
  videoUrl?: string;
  completionWatchPercent?: number;
  watchPercent?: number;
  isComplete: boolean;
  isLocked: boolean;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
  status: "completed" | "in_progress" | "locked";
  assignmentBrief?: string;
  workbookSummary?: string;
}

export interface Assignment {
  id: string;
  moduleId: string;
  title: string;
  instructions: string;
  isCompulsory: boolean;
  status: "pending" | "submitted" | "approved" | "changes_requested";
  submittedAt?: string;
  grade?: string;
  feedback?: string;
}

export interface ExamOption {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  moduleId: number;
  moduleTitle: string;
  question: string;
  options: ExamOption[];
  correctOptionId: string;
  explanation: string;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  startedAt: string;
  expiresAt: string;
  answers: Record<string, string>;
  isPassed: boolean;
  scorePercent: number;
  status: "in_progress" | "completed" | "expired";
}

export interface CertificateRecord {
  id: string;
  abbId: string;
  userId: string;
  learnerName: string;
  programmeName: string;
  issuedAt: string;
  status: "Active" | "Revoked" | "Pending";
  pdfUrl?: string;
}

export interface VerificationResult {
  found: boolean;
  abbId?: string;
  learnerName?: string;
  programmeName?: string;
  issuedAt?: string;
  status?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "assignment" | "lesson" | "exam" | "certificate" | "system";
  isRead: boolean;
  actionScreen?: ScreenName;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface PublicPricingSettings {
  coursePricePaise: number;
  coursePriceRupees: number;
  gstRatePercent: number;
  gstAmountRupees: number;
  totalAmountRupees: number;
  totalAmountPaise: number;
  currency: string;
  accessDurationDays: number;
  programmeName: string;
  companyLegalName: string;
  paymentsTestMode: boolean;
  supportEmail?: string;
  razorpayKeyId?: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}
