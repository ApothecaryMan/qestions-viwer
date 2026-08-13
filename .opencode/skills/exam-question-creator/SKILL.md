---
name: exam-question-creator
description: Use when creating, writing, generating, or editing exam questions or a question bank JSON for the exam-paper designer app (exam-paper.html / mcp-server.js in "qestion create"). Covers open questions, MCQs, and the strict JSON schema (question_latex, part, part_intro, answer_lines, options). Use to fix invalid exam JSON or when the user asks to add a new question type.
---

# Exam Question Creator

Guide for generating exam questions for the exam-paper designer app.
The app parses a strict JSON contract; do not improvise the schema.

## The data model (strict contract)

```json
{
  "title": "",
  "theme": "classic",
  "questions": []
}
```

Root must contain EXACTLY these 3 properties, in this order:

| Property    | Type   | Rule                                                        |
| ----------- | ------ | ----------------------------------------------------------- |
| `title`     | string | Optional exam title shown above the paper (can be `""`).    |
| `theme`     | string | One of: `professional`, `modern-professional`, `classic`, `school-blue`, `soft-study`, `minimal`, `kids`. |
| `questions` | array  | Array of question objects (see below).                      |

## Question object (strict contract)

Every question object must contain EXACTLY these 7 properties, in this exact order:

```json
{
  "id": 1,
  "part": "Part 1: Think & Discuss",
  "part_intro": "",
  "type": "open",
  "question_latex": "",
  "options": [],
  "answer_lines": 2
}
```

| Property         | Type             | Rule |
| ---------------- | ---------------- | ---- |
| `id`             | int              | Sequential from 1, +1 each time, never repeat or skip. |
| `part`           | string           | Section identifier. Questions in the same section MUST have the identical `part` value. |
| `part_intro`     | string           | Section introduction. Set ONLY on the FIRST question of each part; `""` on every later question in that part. Never embed the intro inside `question_latex`. |
| `type`           | string           | Question type (see "Question types"). |
| `question_latex` | string           | The question text, a single string (never an array). |
| `options`        | array of strings | Answer choices. `[]` for open questions. |
| `answer_lines`   | int              | Number of dotted answer lines: 1 to 4. |

## Question types

Current supported types. The type table is the single source of truth; when a
new type is added, update this table AND the app files (see "Adding a future question type").

| Type    | When to use                                              | `options`              | `answer_lines` |
| ------- | -------------------------------------------------------- | ---------------------- | -------------- |
| `open`  | Written answer, calculation, explanation, proof, derivation, comparison, or reasoning. | MUST be `[]`. Never put choices in options or in the question text. | 2 (default); 1 = one-word answer, 3 = multi-step calculation, 4 = detailed reasoning/proof. |
| `mcq`   | Four-option multiple choice.                             | EXACTLY 4 strings, each wrapped in `\(...\)` when it is math. | 1 |

Mixing types inside one exam is allowed (e.g., open sections + an MCQ section).
Never write `type: "mcq"` questions with empty options, and never put
answer choices inside `question_latex` or `options` of an `open` question.

## LaTeX rules

- All math MUST be LaTeX.
- Inline math is wrapped in `\( ... \)`; display math in `$$ ... $$`.
- In the JSON file/upload, every LaTeX backslash is DOUBLE-escaped:
  the file contains `\\(x^2\\)` (which the app renders as `\(x^2\)`).
  A single `\(` in the raw JSON is an invalid JSON escape.
- `question_latex` stays a single string; keep multiple expressions in the same
  string separated by `\n` only when the question genuinely needs a list.
- Correct: `"question_latex": "Find the value of \\(\\sqrt{25}+\\sqrt{9}\\)."`
- Incorrect: `"question_latex": "Find the value of \sqrt{25}."` (no wrapping, no escaping)

## Part and intro rules

- Group related questions under one `part`, e.g. `"Part 1: Think & Discuss"`,
  `"Part 2: Self-Evaluation"`, `"Part 3: Example"`, `"Part 4: Multiple Choice"`.
- The first question of a part carries the introduction, e.g.
  `"part_intro": "Choose the correct answer from the given ones:"`.
- All following questions in the same part: `"part_intro": ""`.

## Content guidelines

- Match the user's topic, lesson, and educational level. Do not invent unrelated subjects.
- Progress from easy understanding to more complex application.
- Vary question structure; do not make every question identical.
- Open questions must demand a written product (calculation, explanation, proof).
- Avoid the phrases "Choose the correct answer", "Select one", "Which of the
  following" inside `open` questions. They belong to `mcq` questions.
- Keep questions short and precise, in the style of the original exam
  (e.g. "Is \\(\\sqrt{3}\\) an irrational number?", "\\(x^2-3=2\\) where \\(x\\in\\mathbb{Q}'\\).").

## Output format

- Return ONE valid JSON object, nothing else: no markdown fences, no
  explanations, no text before/after. First character `{`, last character `}`.
- Apply the JSON via the app: the "رفع JSON" upload button in `exam-paper.html`,
  or through the `exam-paper-designer` MCP server (`set_page` replaces the whole
  page, `add_question` / `add_part` / `update_question` edit incrementally).

## Adding a future question type

When the user asks for a new type (e.g. `true_false`, `matching`, `fill_blank`):

1. Add a row to the "Question types" table above with its `options` and
   `answer_lines` rules.
2. Update the app's contract in `mcp-server.js` (the `type` enum in
   `questionShape` zod schema) so the MCP server accepts the new value.
3. Check the renderer in `exam-paper.html` (the layout switch for `open` vs
   `mcq`) and add a layout branch for the new type if needed.
4. Update the `answer_lines` guidance and examples above, then validate with
   the checklist below before returning JSON.

## Final validation checklist

Before returning JSON, verify silently:

1. Valid JSON, exactly one root object.
2. Root has exactly `title`, `theme`, `questions`, in that order.
3. `theme` is a valid enum value; `questions` is an array.
4. Every question has exactly 7 properties, in the correct order.
5. `type` is a supported type; `options` obeys the type's rule.
6. IDs are sequential integers starting at 1.
7. `part_intro` appears only on the first question of each part.
8. All LaTeX backslashes are double-escaped and math is wrapped in `\( ... \)`.
9. `answer_lines` is an integer between 1 and 4.
10. No text outside the JSON object.
