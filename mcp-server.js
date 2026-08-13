import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, "exam-paper.html");

const PAGE_DATA_START = "const pageData = ";
const PAGE_DATA_END = ";\n\n      const defaultPageData";

const questionShape = {
  id: z.number().int().positive(),
  part: z.string().min(1),
  part_intro: z.string().optional().default(""),
  type: z.enum(["open", "mcq"]).default("open"),
  question_latex: z.string().min(1),
  options: z.array(z.string()).default([]),
  answer_lines: z.number().int().min(1).max(4).default(4)
};

const pageDataShape = {
  title: z.string().optional().default(""),
  theme: z.enum(["professional", "modern-professional", "playful-kids", "classic", "school-blue", "soft-study", "minimal", "kids"]).default("classic"),
  questions: z.array(z.object(questionShape))
};

const idInput = {
  id: z.number().int().positive()
};

async function readHtml() {
  return fs.readFile(htmlPath, "utf8");
}

function locatePageData(source) {
  const start = source.indexOf(PAGE_DATA_START);
  const endMarker = /;[\r\n]+\s*const defaultPageData/;
  const endMatch = start >= 0 ? source.slice(start).search(endMarker) : -1;
  const end = endMatch >= 0 ? start + endMatch : -1;

  if (start < 0 || end < 0) {
    throw new Error("لم أجد كتلة pageData داخل exam-paper.html");
  }

  return {
    start,
    end,
    literalStart: start + PAGE_DATA_START.length
  };
}

async function readPageData() {
  const source = await readHtml();
  const location = locatePageData(source);
  const literal = source.slice(location.literalStart, location.end);

  // pageData may contain String.raw template literals for LaTeX.
  const parsed = vm.runInNewContext(`(${literal})`, { String });
  return pageDataSchema.parse(parsed);
}

async function writePageData(pageData) {
  const source = await readHtml();
  const location = locatePageData(source);
  const serialized = JSON.stringify(pageData, null, 2).replaceAll("\n", "\n      ");
  const replacement = `${PAGE_DATA_START}${serialized}`;
  const updated = source.slice(0, location.start) + replacement + source.slice(location.end);
  await fs.writeFile(htmlPath, updated, "utf8");
}

const pageDataSchema = z.object(pageDataShape);

function textResult(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

function nextId(questions) {
  return questions.reduce((max, question) => Math.max(max, question.id), 0) + 1;
}

function findQuestionIndex(questions, id) {
  const index = questions.findIndex((question) => question.id === id);
  if (index < 0) throw new Error(`السؤال رقم ${id} غير موجود`);
  return index;
}

async function createServer() {
  const server = new McpServer({
    name: "exam-paper-designer",
    version: "1.0.0"
  });

  server.registerTool(
    "get_page",
    {
      description: "قراءة تصميم ورقة الامتحان الحالي بالكامل.",
      inputSchema: {}
    },
    async () => textResult({ file: htmlPath, page: await readPageData() })
  );

  server.registerTool(
    "set_page",
    {
      description: "استبدال تصميم الصفحة بالكامل بعنوان وقائمة أسئلة جديدة.",
      inputSchema: pageDataShape
    },
    async (input) => {
      const page = pageDataSchema.parse(input);
      await writePageData(page);
      return textResult({ ok: true, file: htmlPath, page });
    }
  );

  server.registerTool(
    "set_page_title",
    {
      description: "تغيير العنوان الاختياري أعلى ورقة A4.",
      inputSchema: { title: z.string() }
    },
    async ({ title }) => {
      const page = await readPageData();
      page.title = title;
      await writePageData(page);
      return textResult({ ok: true, title });
    }
  );

  server.registerTool(
    "add_question",
    {
      description: "إضافة سؤال جديد إلى قسم موجود أو إنشاء قسم جديد عند الحاجة.",
      inputSchema: {
        part: z.string().min(1).optional(),
        part_intro: z.string().optional().default(""),
        type: z.enum(["open", "mcq"]).optional().default("open"),
        question_latex: z.string().min(1),
        options: z.array(z.string()).optional().default([]),
        answer_lines: z.number().int().min(1).max(4).default(4)
      }
    },
    async (input) => {
      const page = await readPageData();
      const part = input.part || page.questions.at(-1)?.part || "Part 1: New Section";
      const question = {
        id: nextId(page.questions),
        part,
        part_intro: input.part_intro || "",
        type: input.type || "open",
        question_latex: input.question_latex,
        options: input.options || [],
        answer_lines: input.answer_lines || 4
      };
      page.questions.push(question);
      await writePageData(page);
      return textResult({ ok: true, added: question, page });
    }
  );

  server.registerTool(
    "add_part",
    {
      description: "إضافة قسم جديد مع أول سؤال بداخله.",
      inputSchema: {
        part: z.string().min(1),
        part_intro: z.string().optional().default(""),
        type: z.enum(["open", "mcq"]).optional().default("open"),
        question_latex: z.string().min(1),
        options: z.array(z.string()).optional().default([]),
        answer_lines: z.number().int().min(1).max(4).default(4)
      }
    },
    async (input) => {
      const page = await readPageData();
      const question = {
        id: nextId(page.questions),
        part: input.part,
        part_intro: input.part_intro || "",
        type: input.type || "open",
        question_latex: input.question_latex,
        options: input.options || [],
        answer_lines: input.answer_lines || 4
      };
      page.questions.push(question);
      await writePageData(page);
      return textResult({ ok: true, added: question, page });
    }
  );

  server.registerTool(
    "update_question",
    {
      description: "تعديل سؤال موجود. تغيير اسم القسم أو مقدمته يحدّث نفس القسم كله.",
      inputSchema: {
        ...idInput,
        part: z.string().min(1).optional(),
        part_intro: z.string().optional(),
        type: z.enum(["open", "mcq"]).optional(),
        question_latex: z.string().min(1).optional(),
        options: z.array(z.string()).optional(),
        answer_lines: z.number().int().min(1).max(4).optional()
      }
    },
    async (input) => {
      const page = await readPageData();
      const index = findQuestionIndex(page.questions, input.id);
      const question = page.questions[index];
      const oldPart = question.part;

      if (input.part !== undefined) {
        page.questions.forEach((item) => {
          if (item.part === oldPart) item.part = input.part;
        });
      }

      if (input.part_intro !== undefined) {
        page.questions.forEach((item) => {
          if (item.part === oldPart || item.id === input.id) item.part_intro = input.part_intro;
        });
      }

      if (input.question_latex !== undefined) question.question_latex = input.question_latex;
      if (input.type !== undefined) question.type = input.type;
      if (input.options !== undefined) question.options = input.options;
      if (input.answer_lines !== undefined) question.answer_lines = input.answer_lines;

      await writePageData(page);
      return textResult({ ok: true, updatedId: input.id, page });
    }
  );

  server.registerTool(
    "remove_question",
    {
      description: "حذف سؤال بالرقم.",
      inputSchema: idInput
    },
    async ({ id }) => {
      const page = await readPageData();
      const index = findQuestionIndex(page.questions, id);
      const [removed] = page.questions.splice(index, 1);
      await writePageData(page);
      return textResult({ ok: true, removed, page });
    }
  );

  server.registerTool(
    "move_question",
    {
      description: "تحريك سؤال لأعلى أو لأسفل داخل ترتيب الورقة.",
      inputSchema: {
        ...idInput,
        direction: z.enum(["up", "down"])
      }
    },
    async ({ id, direction }) => {
      const page = await readPageData();
      const index = findQuestionIndex(page.questions, id);
      const nextIndex = index + (direction === "up" ? -1 : 1);

      if (nextIndex >= 0 && nextIndex < page.questions.length) {
        [page.questions[index], page.questions[nextIndex]] = [page.questions[nextIndex], page.questions[index]];
        await writePageData(page);
      }

      return textResult({ ok: true, movedId: id, direction, page });
    }
  );

  server.registerTool(
    "clear_questions",
    {
      description: "مسح كل الأسئلة وترك صفحة فارغة.",
      inputSchema: {}
    },
    async () => {
      const page = await readPageData();
      page.questions = [];
      await writePageData(page);
      return textResult({ ok: true, page });
    }
  );

  server.registerTool(
    "export_page",
    {
      description: "إنشاء نسخة HTML مستقلة من التصميم الحالي وإرجاع مسارها.",
      inputSchema: { outputPath: z.string().min(1).optional() }
    },
    async ({ outputPath }) => {
      const page = await readPageData();
      const destination = outputPath
        ? path.resolve(here, outputPath)
        : path.join(here, "exam-paper-designed.html");
      const source = await readHtml();
      const location = locatePageData(source);
      const serialized = JSON.stringify(page, null, 2).replaceAll("\n", "\n      ");
      const replacement = `${PAGE_DATA_START}${serialized}`;
      const exported = source.slice(0, location.start) + replacement + source.slice(location.end);
      await fs.writeFile(destination, exported, "utf8");
      return textResult({ ok: true, outputPath: destination, page });
    }
  );

  return server;
}

const server = await createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`exam-paper-designer MCP ready: ${htmlPath}`);
