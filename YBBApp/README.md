# YBB Android Application

A production-ready Android mobile application for the **Authorised Business Broker (ABB)** certification programme by **Yoova Business Broking**, built using **React 19 + TypeScript + Vite + Tailwind CSS + Capacitor Android + Supabase**.

---

## 📱 Features & Included Screens

The application includes all 13 screen designs:

1. **01 · Splash Screen** (`01-SplashScreen.tsx`)
   - Dark theme (`#0E1730`) with radial brass and forest gradients.
   - Gold brass ABB Seal with animated pulsing glow.
   - Subtitle "Authorised Business Broker" in Fraunces italic serif.
   - Auto-loading progress bar with session check.

2. **02 · Onboarding (Step 1 of 3)** (`02-Onboarding1Screen.tsx`)
   - "Learn the business of business broking" (11 structured modules).
   - Document and seal illustration, active dot indicator, Skip & Next navigation.

3. **03 · Onboarding (Step 2 of 3)** (`03-Onboarding2Screen.tsx`)
   - "Apply what you learn" (practical assignments graded by YBB).
   - Checklist illustration, active dot indicator, Skip & Next navigation.

4. **04 · Onboarding (Step 3 of 3)** (`04-Onboarding3Screen.tsx`)
   - "Earn a credential anyone can verify" (ABB ID credential).
   - Credential badge illustration, active dot indicator, "Get started" CTA.

5. **05 · Sign In / Sign Up** (`05-SignInScreen.tsx`)
   - Welcome back header with ABB Seal.
   - Email & Password login with Supabase authentication.
   - "Forgot password?" password reset modal.
   - Google Sign-In and Phone OTP alternatives.
   - Toggle to create a new account.

6. **06 · OTP Verification** (`06-OtpVerifyScreen.tsx`)
   - Top navigation bar with back button.
   - 6 individual digit input boxes with auto-advance and backspace navigation.
   - Resend countdown timer.
   - "Verify & continue" action.

7. **07 · Home Dashboard** (`07-HomeScreen.tsx`)
   - Dynamic time-aware greeting ("Good morning / afternoon / evening Rajesh Sharma").
   - Notification bell with unread badge.
   - "Your ABB journey" progress card with 36% progress meter, modules count, and days remaining countdown.
   - Stat cards (2 Assignments due, 70% Exam pass mark, Certificate status).
   - "Continue Learning" shortcut card (Module 05 · Understanding Buyers).
   - "Programme Stages" 4-step stepper (Learn -> Apply -> Qualify -> Certified).
   - 4-tab bottom navigation bar.

8. **08 · Curriculum & Modules** (`08-LearnCurriculumScreen.tsx`)
   - Search filter for modules and lessons.
   - Overall progress tracker (4 of 11 modules complete, 36%).
   - List of all 11 modules with completion checkmarks (✓), active badges, and locked states.
   - Direct jump into lesson player.

9. **09 · Lesson Video Player** (`09-LessonPlayerScreen.tsx`)
   - 16:9 Video player with custom overlay controls (Play/Pause, seekbar, time elapsed and remaining).
   - Subtabs for **Lessons** (playlist with duration), **Workbook** (notes & PDF download), and **Assignment** (brief & submission form).
   - "Mark complete & continue" button that tracks progress in Supabase `lesson_progress`.

10. **10 · Final Examination** (`10-ExamScreen.tsx`)
    - 58-minute countdown timer with warning indicator.
    - Question counter (Question 7 of 50) and progress bar.
    - Multiple-choice option selection with gold highlighting.
    - Auto-save indicator and instant scoring engine (70% pass threshold).
    - Confetti celebration upon passing and certificate unlocking.

11. **11 · Certificate** (`11-CertificateScreen.tsx`)
    - Authentic certificate card with brass border, watermark pattern, and YBB seal.
    - Learner name in Fraunces italic serif font.
    - Unique Credential ID (`YBB-ABB-2026-0001`) and issue date.
    - Native document sharing via Web / Capacitor Share API.
    - Instant PDF download generation with `html2canvas` & `jspdf`.
    - Link to public verification page.

12. **12 · Verify Credential** (`12-VerifyScreen.tsx`)
    - Search input for ABB Credential ID.
    - Live verification query against Supabase `verify_certificate` RPC function.
    - Valid certificate result card with name, programme, issue date, and Active status badge.

13. **13 · Learner Profile** (`13-ProfileScreen.tsx`)
    - Initials avatar ("RS"), Name, and Email.
    - Menu items: Payment & receipts (Invoice modal), Notifications (Preferences modal), Support & enquiries (Contact modal), Terms & privacy policies.
    - Sign out action.

---

## 🚀 Running & Developing Locally

```bash
# 1. Navigate to the YBBApp directory
cd d:\ybbindia-main\YBBApp

# 2. Run the Vite development server
npm run dev

# 3. Open in browser at http://localhost:3000 or http://localhost:3333
```

---

## 🤖 Building and Running on Android

### Prerequisites
- Java JDK 17 or 21 (Installed on system)
- Android SDK / Command-line tools (Configured at `C:\Users\rohan\AppData\Local\Android\Sdk`)
- Android Studio (Optional for visual emulation and debugging)

### Commands

```bash
# 1. Build the web distribution bundle
npm run build

# 2. Sync web assets and plugins to the native Android Gradle project
npx cap sync android

# 3. Open the project in Android Studio
npx cap open android

# 4. Or build the debug APK directly via Gradle
cd android
./gradlew assembleDebug

# Output APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🗄️ Backend Supabase Configuration

The application is pre-configured to connect with the project's Supabase backend:
- **Supabase URL**: `https://tusbimtbolvnzlwsjcju.supabase.co`
- **Publishable Key**: `sb_publishable_v-vCm9OEYpNv4zlCjlJqkA_7qg3Z236`
- **Tables & Functions Used**: `courses`, `modules`, `lessons`, `lesson_progress`, `assignments`, `submissions`, `exam_attempts`, `certificates`, `settings`, and `verify_certificate` RPC.
