# Exam Paper Designer MCP

هذا المشروع يحتوي على MCP server محلي يجعل الـAI يتحكم في تصميم ورقة الامتحان الموجودة في `exam-paper.html`.

## التثبيت

```powershell
npm install
```

## التشغيل

```powershell
npm run mcp
```

في إعدادات عميل MCP الذي تستخدمه، أضف خادمًا محليًا بهذه الصورة:

```json
{
  "mcpServers": {
    "exam-paper-designer": {
      "command": "node",
      "args": ["C:/Users/moham/OneDrive/Documents/ChatGPT/qestion create/mcp-server.js"]
    }
  }
}
```

## الأدوات المتاحة للـAI

- `get_page`: قراءة التصميم الحالي.
- `set_page`: استبدال الصفحة بالكامل.
- `set_page_title`: تغيير عنوان الورقة.
- `add_question`: إضافة سؤال إلى قسم.
- `add_part`: إضافة قسم جديد مع أول سؤال.
- `update_question`: تعديل النص أو القسم أو نوع السؤال أو الاختيارات أو عدد سطور الإجابة.
- `remove_question`: حذف سؤال.
- `move_question`: تحريك سؤال لأعلى أو لأسفل.
- `clear_questions`: تفريغ الصفحة.
- `export_page`: إنشاء ملف HTML مستقل من التصميم الحالي.

بعد أي تعديل من MCP، افتح الصفحة أو اعمل Refresh لـ`exam-paper.html` لرؤية التغيير.

لإنشاء سؤال اختيار من متعدد، استخدم `type: "mcq"` وأرسل `options` كمصفوفة نصوص. سيظهر قسم الـMCQ تلقائيًا في عمودين، بينما يظل `type: "open"` على شكل السؤال التقليدي بخانة الإجابة المنقطة.

## JSON format for AI-generated questions

Use this shape when generating a JSON file to upload with the **رفع JSON** button. JSON uses double escaping for LaTeX backslashes, so write `\\(` in the file to produce `\(` in the page.

```json
{
  "title": "Mathematics Exam",
  "theme": "school-blue",
  "questions": [
    {
      "id": 1,
      "part": "Part 1: Think & Discuss",
      "part_intro": "For any three real numbers \\(a\\), \\(b\\) and \\(c\\):",
      "type": "open",
      "question_latex": "Is \\(a-b=b-a\\)?",
      "options": [],
      "answer_lines": 2
    },
    {
      "id": 2,
      "part": "Part 2: Multiple Choice",
      "part_intro": "Choose the correct answer:",
      "type": "mcq",
      "question_latex": "If \\(a+\\sqrt{5}=0\\), what is the value of \\(a\\)?",
      "options": [
        "\\(0\\)",
        "\\(\\sqrt{5}\\)",
        "\\(-\\sqrt{5}\\)",
        "\\(\\frac{1}{\\sqrt{5}}\\)"
      ],
      "answer_lines": 1
    }
  ]
}
```

### Field rules

- `id`: positive integer. Duplicate or missing IDs are repaired during upload.
- `part`: section title. Questions with the same `part` are grouped together.
- `part_intro`: optional text shown below the section title.
- `type`: use `open` for the traditional answer-lines layout or `mcq` for the two-column multiple-choice layout.
- `question_latex`: required text. Use `\\(...)` for inline math or `$$...$$` for display math.
- `options`: array of strings. Use four options for a normal MCQ; it can be empty for `open` questions.
- `answer_lines`: integer from `1` to `4`, with `4` as the default for newly created or imported questions. It is mainly used by `open` questions.
- `theme`: one of `professional`, `modern-professional`, `classic`, `school-blue`, `soft-study`, `minimal`, or `kids`.

The app also supports uploading a plain array of question objects instead of the full `{ "title", "questions" }` object. Double-click any editable text in the A4 preview to edit it without changing the page structure.

The theme carousel is inside the tools panel and changes the current tab only. `kids` is intended for kindergarten-style worksheets; `modern-professional` adds a refined corporate look with soft rounded corners; the other themes cover academic, school, calm study, and minimal black-and-white layouts.

The menu button in the tab bar includes:

- Hide/show tools.
- Preview zoom from 60% to 250%, with a `ملاءمة العرض` shortcut that fits the A4 paper to the available preview width.
- Dark mode with high-contrast colors for easier reading. Printing automatically uses the light paper layout.

For MCQ preview interaction, click the option letter to select it. The highlight animates from left to right; click the same letter again to clear it, or click another question's letter to move the selection.

## Multiple tabs

- Click `+` in the tab bar to open a new independent page.
- Click a tab to switch its preview and tools.
- Double-click a tab name to rename it.
- Click `×` to close a tab. At least one tab remains open.
- JSON import/export and HTML export apply to the currently active tab.
- The JSON row has three actions: download the current JSON, edit it in the built-in editor, or upload a JSON file.

## UI settings storage

The browser stores UI-only preferences in Local Storage under `exam-paper-ui-settings-v1`: Dark Mode, preview zoom, tools visibility, and the last preview/tools scroll positions. Questions, page data, and tab question content are not written to Local Storage; they remain in the HTML/MCP data flow so they can be moved to a database later.

## Editing many questions

The editor panel has a search box plus filters for question type and section. Questions are shown as compact expandable cards; open only the question you want to edit, or use `فتح الكل` / `إغلاق الكل` for batch review. The compact summary shows the question number, type, section, and a shortened preview before opening the card.
