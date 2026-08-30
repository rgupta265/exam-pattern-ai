# Administrator Application Tour — Video Walkthrough Storyboard & Script

> **Document Type:** Production Video Storyboard & Narration Script  
> **Platform:** ExamPattern AI Console  
> **Target Audience:** System Administrators, Exam Designers, Question Reviewers  
> **Approximate Total Duration:** 4 minutes 30 seconds  
> **Voiceover Languages:** English (Primary) / Hindi (Localized Track)

---

## Scene 1: Introduction & Architectural Principles (0:00 - 0:35)

* **Screen:** Home Landing Page (`/[locale]`) → Login Portal (`/[locale]/login`)
* **Visual Action:**
  1. Camera pans over the ExamPattern AI brand banner ("100% Pattern-Verified Mock Testing Engine").
  2. Cursor clicks on "Admin Console" in the hero header.
  3. Administrator enters credentials and submits the login form.
* **Narration (English):**
  > "Welcome to ExamPattern AI, the blueprint-authoritative mock test platform. Unlike generic quiz generators, ExamPattern AI establishes verified exam blueprints as the single source of truth. Let's log in to the Administrator Console."
* **Narration (Hindi):**
  > "ExamPattern AI में आपका स्वागत है। सामान्य क्विज़ जेनरेटरों के विपरीत, ExamPattern AI सत्यापित आधिकारिक परीक्षा ब्लूप्रिंट को सत्य का एकमात्र स्रोत मानता है। आइए व्यवस्थापक कंसोल में लॉगिन करते हैं।"
* **Expected Result:** Immediate redirection to the Administrator Dashboard (`/admin/dashboard`).

---

## Scene 2: Exam & Cycle Versions Setup (0:35 - 1:15)

* **Screen:** `/admin/exams` → `/admin/exams/create`
* **Visual Action:**
  1. Admin clicks "Exams & Versions" on the sidebar.
  2. Clicks "+ Create Exam", fills in:
     - Name: "UP Health Officer"
     - Code: "UPHO"
     - Category: "Government Jobs"
     - Authority: "UP Health Department"
  3. Creates an active Exam Version: "2026 Regular Notification".
* **Narration (English):**
  > "Every competitive examination has its own distinct versions. This isolates official documents, corrigendums, and blueprints across different notification years without mutating historical patterns."
* **Narration (Hindi):**
  > "प्रत्येक प्रतियोगी परीक्षा के अपने अलग संस्करण होते हैं। इससे विभिन्न अधिसूचना वर्षों के दस्तावेज़ और ब्लूप्रिंट अलग रहते हैं और पुराना डेटा कभी विकृत नहीं होता।"
* **Expected Result:** Exam created with unique identifier code and active status.

---

## Scene 3: Official Document Ingestion & AI Extraction (1:15 - 2:00)

* **Screen:** `/admin/notifications` → Document Details Modal
* **Visual Action:**
  1. Admin drags and drops the official recruitment PDF notification.
  2. Clicks "Extract Pattern & Syllabus via Gemini AI".
  3. Reviews extracted sections, marks distribution, and syllabus tree.
  4. Clicks "Verify Document".
* **Narration (English):**
  > "Official PDFs are uploaded directly to secure local filesystem storage. Google Gemini AI processes the notification server-side to extract the syllabus hierarchy and exam rules. An authorized admin then conducts human verification."
* **Narration (Hindi):**
  > "आधिकारिक पीडीएफ को सुरक्षित स्थानीय स्टोरेज में अपलोड किया जाता है। जेमिनी एआई अधिसूचना से पाठ्यक्रम और नियमों को निकालता है। इसके बाद अधिकृत एडमिन द्वारा मानवीय सत्यापन किया जाता है।"
* **Expected Result:** Document status transitions to `VERIFIED`.

---

## Scene 4: Blueprint Definition & Locking State Machine (2:00 - 2:45)

* **Screen:** `/admin/blueprints` → Blueprint Editor
* **Visual Action:**
  1. Admin configures:
     - Total Questions: 100
     - Total Marks: 100.00
     - Duration: 120 Minutes
     - Negative Marking: -0.25
     - Section A (Clinical): 50 Qs | Section B (Public Health): 30 Qs | Section C (General): 20 Qs
  2. Admin clicks "Lock Blueprint".
* **Narration (English):**
  > "The exam blueprint is the authoritative baseline for all mock generation. Once locked, it becomes permanently immutable. Gemini is strictly bound to these rules and can never alter question counts or durations."
* **Narration (Hindi):**
  > "परीक्षा ब्लूप्रिंट सभी मॉक टेस्ट का प्रामाणिक आधार है। एक बार लॉक होने पर यह अपरिवर्तनीय हो जाता है। AI कभी भी प्रश्नों की संख्या या समय को बदल नहीं सकता।"
* **Expected Result:** Blueprint status badge displays `LOCKED` (Active).

---

## Scene 5: Full-Pattern Mock Generation & Validation Engine (2:45 - 3:35)

* **Screen:** `/admin/mock-tests` → `/admin/mock-tests/create`
* **Visual Action:**
  1. Admin selects "Full Examination Mode".
  2. Clicks "Generate Pattern-Verified Mock".
  3. System assembles section-by-section questions and runs the automated 11-point Pattern Validation Engine.
  4. Inspection modal shows 100% compliance report with zero duplicate questions.
  5. Mock test published.
* **Narration (English):**
  > "When generating full-pattern mocks, our automated validation engine performs rigorous checks: exact question counts, section distribution, topic alignment, negative marking rate, and language parity. Only tests passing 100% validation are published."
* **Narration (Hindi):**
  > "फुल-पैटर्न मॉक बनाते समय हमारा सत्यापन इंजन सभी नियमों की जांच करता है। 100% सत्यापन पास करने वाले मॉक ही प्रकाशित किए जाते हैं।"
* **Expected Result:** Mock test published with snapshot code `UPHO-2026-MOCK-001`.

---

## Scene 6: Candidate Attempt Diagnostics & Audit Trail (3:35 - 4:15)

* **Screen:** `/admin/candidates` → Candidate Details → Attempt Inspection
* **Visual Action:**
  1. Admin inspects Candidate Ramesh Kumar's attempt history (Attempt 1 vs Attempt 2).
  2. Opens Attempt 2 transcript: shows question-by-question time spent, answer changes, and section performance.
  3. Views System Audit Logs showing timestamped administrative actions.
* **Narration (English):**
  > "Administrators have comprehensive diagnostic visibility into candidate attempts, answer revisions, question-level time spent, and retake progression. All critical system events are recorded in immutable audit logs."
* **Narration (Hindi):**
  > "व्यवस्थापकों के पास अभ्यर्थी के सभी प्रयासों, उत्तर संशोधनों और समय का पूरा विवरण देखने की सुविधा है। सभी प्रशासनिक कार्य ऑडिट लॉग में सुरक्षित रहते हैं।"
* **Expected Result:** Transparent, high-precision candidate diagnostic audit stream.

---

## Scene 7: Summary & Conclusion (4:15 - 4:30)

* **Screen:** Admin Dashboard & Language Switcher demonstration (`/en` → `/hi`)
* **Visual Action:**
  1. Admin toggles the global language switcher to Hindi.
  2. UI instantly adapts with zero page reload.
  3. Video concludes with ExamPattern AI badge.
* **Narration (English):**
  > "ExamPattern AI brings notification-verified blueprint precision to competitive exam preparation. Thank you for watching the Administrator Tour."
* **Narration (Hindi):**
  > "ExamPattern AI प्रतियोगी परीक्षाओं की तैयारी में ब्लूप्रिंट-सत्यापित सटीकता लाता है। एडमिन टूर देखने के लिए धन्यवाद।"
