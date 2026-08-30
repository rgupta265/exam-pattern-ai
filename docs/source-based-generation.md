# Source-Based AI Question Generation & Traceability

## 1. Supported Input Media
* **PDF Files:** Text streams and table extractions.
* **Word Documents (DOCX):** OpenXML paragraph & table extractions.
* **Images (PNG, JPG, JPEG, WEBP):** OCR vision extractions.
* **Plain Text:** Sanitized textareas (20 to 500,000 characters).

## 2. Generation Modes
1. **`SOURCE_ONLY`:** Questions are generated strictly and solely from the uploaded source text. Outside knowledge is disallowed.
2. **`EXAM_CONTEXT_ASSISTED`:** Concepts from the uploaded material are synthesized with the official verified exam syllabus and blueprint rules.

## 3. Source Traceability
Every generated question persists:
* `sourceType`: `"PDF" | "DOCX" | "IMAGE" | "TEXT" | "MANUAL"`
* `sourceFileName`: string
* `sourcePage`: number
* `sourceTextSnippet`: string (snippet of source text referenced)
* `generationMode`: `"SOURCE_ONLY" | "EXAM_CONTEXT_ASSISTED"`
