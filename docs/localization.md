# Localization & Bilingual Architecture

## 1. Supported Locales
* **English (`en`):** Default locale.
* **Hindi (`hi`):** Full UI and examination translation.

## 2. Separation of Concerns
* **UI Text:** Stored in `messages/en.json` and `messages/hi.json` with helper functions in `src/lib/i18n.ts`.
* **Exam Content:** Stored directly in the MySQL database:
  - `questionText` / `questionTextHindi`
  - `explanation` / `explanationHindi`
  - `optionText` / `optionTextHindi`
  - `QuestionTranslation` and `QuestionOptionTranslation` relations for future multi-lingual extensibility.

## 3. Logical Option Stability
Correctness (`isCorrect: true`) belongs to the logical Option entity (e.g. Option A), ensuring that switching languages never produces conflicting evaluation outcomes.
