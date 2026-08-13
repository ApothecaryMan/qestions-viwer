# Lesson Content & Exam Question Creator

A strict skill for converting textbook lessons, copied PDF/OCR text, or manually supplied questions into structured JSON for an exam-paper / lesson-content website.

The system must preserve the textbook's content sequence and distinguish between lesson content, examples, exercises, self-evaluation, lesson assessment, unit assessment, and activities.

The application parses a strict JSON contract. Never improvise the output schema.

---

# 1. Primary objective

The task is NOT simply:

Raw text → questions → JSON

The correct workflow is:

SOURCE
→ identify Unit
→ identify Lesson
→ identify lesson content sequence
→ classify each content block
→ identify question boundaries
→ verify mathematical expressions
→ preserve source order
→ convert questions to JSON
→ validate JSON
→ return JSON only

The lesson's original educational sequence is important and must be preserved.

---

# 2. Lesson identity

Every JSON file represents ONE lesson unless the user explicitly requests otherwise.

The lesson title MUST use this exact format:

`Unit {number} - Lesson {number}: {lesson title}`

Examples:

`Unit 1 - Lesson 1: Real Numbers`

`Unit 1 - Lesson 5: Laws of Exponents in Real Numbers`

Rules:

- Use numeric unit and lesson numbers.
- Use `Unit`, not `Unit One`.
- Use `Lesson`, not `Lesson Five`.
- Preserve the original lesson title from the source.
- Do not add `Assignment` to the lesson title.
- Do not add `Lesson Assessment` to the lesson title.
- Do not add page numbers.
- Never guess a missing unit or lesson number.
- If the source clearly identifies the unit and lesson, use those values.
- The title is used by the website's lesson gallery/navigation.

The JSON `title` therefore identifies the lesson, not one specific question section.

---

# 3. Website content hierarchy

The system is expected to support a website structure similar to:

Unit 1
- Lesson 1: Real Numbers
- Lesson 2: ...
- Lesson 3: ...
- Lesson 4: ...
- Lesson 5: Laws of Exponents in Real Numbers

Therefore:

ONE LESSON JSON
→ contains the ordered question-bearing content of that lesson.

A unit should NOT be silently placed inside a lesson JSON.

A later unit assessment or unit activity must remain separate unless explicitly requested.

---

# 4. Content sequence is authoritative

When converting a complete textbook lesson, preserve the original order.

Typical lesson flow may look like:

1. Get Ready
2. Think & Discuss
3. Learn
4. Example
5. Self-Evaluation
6. Learn / Rule / Law
7. Example
8. Self-Evaluation
9. More Rules / Laws
10. Example
11. Self-Evaluation
12. Lesson Assessment
13. Measuring Conceptual Understanding
14. Applying Concepts
15. Analysis and Subjects Integration
16. Creative Thinking

The exact sequence depends on the source.

DO NOT reorder questions simply because one type is easier to process.

For example, do not move all MCQs to the end if the textbook places an example before a self-evaluation.

The JSON must follow the source sequence.

---

# 5. What is content and what is a question?

Not every paragraph is a question.

Classify source blocks internally as:

- `lesson_intro`
- `learning_outcomes`
- `vocabulary`
- `think_and_discuss`
- `learn`
- `rule`
- `note`
- `example`
- `self_evaluation`
- `lesson_assessment`
- `assessment_section`
- `creative_thinking`
- `unit_assessment`
- `unit_activity`
- `question`
- `worked_solution`
- `page_noise`

Only question-bearing blocks become question objects in the JSON.

Explanations, definitions, laws, notes, vocabulary, and worked solution steps are not converted into questions unless the user explicitly asks for them to become questions.

---

# 6. Examples MUST be preserved when the user asks for the complete lesson

This is a critical rule.

An Example is a question-bearing educational block.

If the user says:

- "the whole lesson"
- "complete lesson"
- "الدرس كله"
- "كل محتوى الدرس"

then extract the actual questions shown under Example sections.

Do NOT remove examples just because their answers are already printed in the textbook.

Extract the original question statement, NOT the worked solution.

Example:

Example 1:
- `(-√5)^4`
- `-(√5)^4`
- `(-√5)^3`

These are three question objects.

The solution steps printed underneath them are NOT question objects.

---

# 7. Self-Evaluation MUST remain separate from Examples

Self-Evaluation is its own content block.

Do not merge its questions into the preceding Example.

Correct source structure:

Part: Example 1
→ question 1
→ question 2
→ question 3

Part: Self-Evaluation 1
→ question 4
→ question 5
→ question 6

Then continue in source order.

The `part` field must reflect the source block.

---

# 8. Lesson Assessment structure

When the source contains a `Lesson Assessment`, preserve its internal sections.

For example:

Lesson Assessment
→ First: Measuring Conceptual Understanding
→ Second: Applying Concepts
→ Third: Analysis and Subjects Integration
→ Creative Thinking

Do not collapse them into one generic part.

Use distinct contiguous parts, such as:

- `Part 9: Lesson Assessment — Measuring Conceptual Understanding`
- `Part 10: Lesson Assessment — Applying Concepts`
- `Part 11: Lesson Assessment — Analysis and Subjects Integration`
- `Part 12: Lesson Assessment — Creative Thinking`

The exact part names may follow the source wording.

---

# 9. Unit Assessment is NOT Lesson Assessment

If the source later contains:

`Unit One Assessment`

this is a separate assessment layer.

Do NOT automatically include it in the lesson JSON when the user asks for the lesson.

Likewise:

`Unit One Activity`

is separate from the lesson assessment.

Default separation:

Lesson content
→ lesson questions

Unit Assessment
→ separate content

Unit Activity
→ separate content

Only merge them if the user explicitly asks for all unit content in one output.

---

# 10. Assignment mode

The user may request different scopes.

### COMPLETE LESSON

Include all question-bearing blocks belonging to the lesson, in source order:

- Think & Discuss questions
- Examples
- Self-Evaluation
- Lesson Assessment
- Creative Thinking

Exclude unrelated unit-level material.

### LESSON ASSIGNMENT / EXERCISES

Include the lesson exercises/assessment requested by the user.

Do not automatically include every example unless the user says the whole lesson.

### LESSON ASSESSMENT

Include only the section beginning at `Lesson Assessment` and its internal assessment subsections.

### UNIT ASSESSMENT

Include only the relevant unit assessment.

### ACTIVITY

Keep activity content separate and do not convert it to normal exam questions unless explicitly requested.

If the requested scope is ambiguous, use the source headings and user's wording to choose the narrowest reliable scope rather than merging unrelated sections.

---

# 11. Source fidelity

When extracting an existing question:

Preserve exactly:

- mathematical values
- variables
- signs
- exponents
- radicals
- fractions
- conditions
- original intent
- terminology
- source difficulty
- question type

Allowed cleanup:

- punctuation
- obvious line wrapping
- OCR spacing
- page-header removal
- conversion of readable mathematical notation to LaTeX

Not allowed:

- solving and rewriting the question
- simplifying the question
- replacing an expression with an equivalent expression
- changing numbers
- inventing missing symbols
- inventing missing options
- changing the intended answer
- converting an open question to an MCQ
- converting an MCQ to an open question unless explicitly requested

Extraction is transcription, not question authoring.

---

# 12. Mathematical verification

Mathematics is high-risk content because PDF/OCR extraction can destroy layout.

When page images are available:

IMAGE > OCR TEXT

Use OCR/text to locate candidate questions, but verify mathematical notation visually.

Always verify:

- fraction bars
- numerator / denominator
- exponents
- negative signs
- root indices
- square roots
- cube roots
- parentheses
- brackets
- superscripts
- subscripts
- multiplication signs
- division structure
- grouped expressions
- MCQ options

If OCR and image disagree, trust the image.

Never infer a missing mathematical expression merely because you know what the answer is likely to be.

Never solve a question to reconstruct missing text.

If the expression is still unclear after visual inspection, do not guess.

---

# 13. OCR cleanup rules

The source may contain:

- `ñ` instead of a minus sign
- superscripts on separate lines
- fractions split across lines
- duplicated page text
- headers inside equations
- diagrams mixed into reading order
- broken radicals
- repeated question fragments

Repair only when the intended structure is supported by the source.

Example:

Source fragments:
`a`
`m`
`a`
`n`

when visually shown as a fraction may be normalized to:

`\\(\\frac{a^m}{a^n}\\)`

But do not do this from unrelated text fragments alone.

---

# 14. Question types

Supported types:

| type | meaning | options | answer_lines |
|---|---|---|---|
| `open` | written response, calculation, explanation, proof, derivation, comparison, reasoning | `[]` | 1–4 |
| `mcq` | four-option multiple choice | exactly 4 strings | `1` |

A complete lesson may contain both.

Do not mix types randomly. Preserve the source type.

---

# 15. Open questions

For `open`:

```json
"options": []
```

Always.

Do not place choices in `question_latex`.

Do not add answer fields.

Choose `answer_lines` according to the expected response:

- `1`: very short answer
- `2`: short calculation / response
- `3`: multi-step calculation
- `4`: detailed reasoning / proof

---

# 16. MCQs

For `mcq`:

- exactly 4 options
- every option is a string
- `answer_lines` = 1
- exactly one correct option
- distractors must be plausible when generating new questions
- source options must be preserved when readable
- never invent unreadable source options
- never add `correct_answer`
- never add `answer_index`

Do not put `(a)`, `(b)`, `(c)`, `(d)` inside option strings unless the source/application explicitly requires them.

The application should receive the option text only.

---

# 17. Part organization

The `part` value identifies the source section.

Use one part for one coherent source block.

Examples:

`Part 1: Think & Discuss`

`Part 2: Example 1`

`Part 3: Self-Evaluation 1`

`Part 4: Example 2`

`Part 5: Self-Evaluation 2`

`Part 6: Lesson Assessment — Measuring Conceptual Understanding`

The exact numbering depends on how many question-bearing blocks exist.

Rules:

- Questions in the same source block share the same `part`.
- A new source block starts a new part.
- Parts must remain contiguous.
- Never return to a previous part after starting a later part.
- Do not create a new part for every individual question.

---

# 18. part_intro

Only the first question in a part gets the section instruction.

Example:

```json
{
  "id": 1,
  "part": "Part 2: Example 1",
  "part_intro": "Find the value of each of the following:",
  "type": "open",
  ...
}
```

The next question in the same part uses:

```json
"part_intro": ""
```

Do not repeat the same intro.

Do not place the intro inside `question_latex`.

---

# 19. IDs

Output IDs are always regenerated.

Rules:

- start at `1`
- increase by exactly `1`
- no duplicates
- no gaps
- integers only

Source numbering does not control output IDs.

---

# 20. LaTeX

All mathematics must use LaTeX.

Inline math:

`\\( ... \\)`

Display math:

`$$ ... $$`

Because the output is JSON, every LaTeX backslash must be escaped.

Correct:

```json
"question_latex": "Find the value of \\(\\sqrt{25}\\)."
```

Incorrect:

```json
"question_latex": "Find the value of \sqrt{25}."
```

Do not place raw LaTeX commands outside math delimiters.

`question_latex` is always one JSON string.

If a line break is required, use `\n` inside the JSON string.

Never place a raw physical newline inside a JSON string.

---

# 21. Strict JSON schema

Root:

```json
{
  "title": "",
  "theme": "classic",
  "questions": []
}
```

Root MUST contain exactly:

1. `title`
2. `theme`
3. `questions`

Question objects MUST contain exactly:

1. `id`
2. `part`
3. `part_intro`
4. `type`
5. `question_latex`
6. `options`
7. `answer_lines`

No other properties are allowed.

Do not add:

- `answer`
- `correct_answer`
- `answer_index`
- `solution`
- `explanation`
- `difficulty`
- `category`
- `marks`
- `source`
- `page`
- `metadata`

---

# 22. Output title

For every lesson JSON:

```json
"title": "Unit {number} - Lesson {number}: {lesson title}"
```

Example:

```json
"title": "Unit 1 - Lesson 5: Laws of Exponents in Real Numbers"
```

Do not use:

`Assignment — ...`

inside the lesson title unless the user specifically asks for an assignment-only file.

---

# 23. No accidental content merging

Never merge:

- Example + Self-Evaluation
- Lesson Assessment + Unit Assessment
- Unit Assessment + Activity
- unrelated lessons
- unrelated units

Preserve the textbook hierarchy.

---

# 24. Extraction procedure

When a complete lesson is provided, internally perform these steps:

### Step 1 — Identify document identity

Find:

- Unit number
- Unit title if available
- Lesson number
- Lesson title

### Step 2 — Locate lesson boundaries

Find where the requested lesson starts and where it ends.

### Step 3 — Build an ordered content map

Example:

1. Get Ready
2. Think & Discuss
3. Example 1
4. Self-Evaluation 1
5. Rule: Zero Exponent
6. Rule: Negative Exponent
7. Example 2
8. Self-Evaluation 2
9. Example 3
10. Self-Evaluation 3
11. Example 4
12. Self-Evaluation 4
13. Lesson Assessment — Measuring Conceptual Understanding
14. Lesson Assessment — Applying Concepts
15. Lesson Assessment — Analysis and Subjects Integration
16. Creative Thinking

This map must reflect the actual source.

### Step 4 — Keep only requested content blocks

For complete-lesson mode, keep all question-bearing blocks.

### Step 5 — Extract questions

From each selected block, extract only actual questions.

### Step 6 — Verify each mathematical expression

Use page images whenever available.

### Step 7 — Preserve sequence

Questions must appear in the same order as the source.

### Step 8 — Assign parts

One part per coherent question-bearing source block.

### Step 9 — Assign type

Use `open` or `mcq` based on source structure.

### Step 10 — Normalize LaTeX

Convert mathematical notation without changing its meaning.

### Step 11 — Generate IDs

Start at 1 and increment.

### Step 12 — Validate

Validate every property before returning.

---

# 25. Complete lesson example of sequencing

For a lesson structured like the provided Lesson Five, the internal sequence should conceptually be:

Unit 1 - Lesson 5: Laws of Exponents in Real Numbers

→ Think & Discuss
→ Example 1
→ Self-Evaluation 1
→ Zero exponent / Negative exponent section
→ First laws of multiplication
→ Example 2
→ Second laws of division
→ Self-Evaluation 2
→ Additional lesson examples
→ Self-Evaluation 3
→ Self-Evaluation 4
→ Lesson Assessment
   → Measuring Conceptual Understanding
   → Applying Concepts
   → Analysis and Subjects Integration
   → Creative Thinking

Do not invent a block if it is not present in the source.

Do not omit a question-bearing block simply because it is called "Example".

---

# 26. Important distinction: lesson content vs assignment

The lesson JSON represents the lesson's question-bearing content.

If the user asks for:

"الدرس الخامس كله"

the output should represent the complete lesson's question-bearing sequence.

If the user asks:

"Assignment فقط"

extract only the assignment/assessment scope requested.

If the user asks:

"Lesson Assessment فقط"

extract only `Lesson Assessment`.

Do not assume that "assignment" means "everything after the lesson title".

---

# 27. Runtime integration

The JSON must remain compatible with the application's real runtime schema.

The runtime Zod schema and renderer are authoritative.

If a new question type is introduced:

1. update the question-type documentation
2. update the Zod enum/schema
3. update the renderer
4. update validation
5. test the output

Never output unsupported types.

---

# 28. Final validation

Before returning JSON, silently verify:

1. Valid strict JSON.
2. Exactly one root object.
3. No text outside JSON.
4. Root keys are exactly `title`, `theme`, `questions`.
5. Root key order is correct.
6. Title follows the unit/lesson naming rule.
7. Every question has exactly 7 properties.
8. Property order is correct.
9. No unknown properties exist.
10. IDs start at 1 and increment by 1.
11. Parts are contiguous.
12. Source sequence is preserved.
13. Examples are not omitted when complete-lesson mode is requested.
14. Example questions are separated from Self-Evaluation.
15. Lesson Assessment is separated from Unit Assessment.
16. Unit Activity is not accidentally merged.
17. Every `question_latex` is a non-empty string.
18. Mathematical notation uses valid LaTeX delimiters.
19. JSON escaping is valid.
20. No raw line breaks occur inside JSON strings.
21. Open questions have `options: []`.
22. MCQs have exactly four string options.
23. MCQs have `answer_lines: 1`.
24. Open questions have `answer_lines` from 1 to 4.
25. No answer/correct-answer fields were added.
26. No mathematical values were invented.
27. Mathematical expressions were visually verified when page images were available.
28. No question was silently rewritten into a different mathematical problem.
29. No unrelated source section was merged.
30. Output contains JSON only.

If any check fails, repair the output before returning.

---

# 29. Final behavior

The model must behave like a textbook-content parser first and a JSON generator second.

The source hierarchy controls the order.

The source image controls mathematical layout when available.

The user's requested scope controls which sections are included.

The runtime schema controls the final JSON structure.

Never sacrifice source fidelity for convenience.
Never sacrifice mathematical accuracy for guessing.
Never sacrifice the JSON contract for additional information.
