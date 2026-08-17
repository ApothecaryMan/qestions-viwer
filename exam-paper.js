      const paper = document.getElementById("paper");
      const sectionNav = document.getElementById("section-nav");
      const previewStage = document.querySelector(".preview-stage");
      const designerPanel = document.querySelector(".designer-panel");
      const editorList = document.getElementById("editor-list");
      const paperTitleInput = document.getElementById("paper-title");
      const tabList = document.getElementById("tab-list");
      const editorCount = document.getElementById("editor-count");
      const questionSearch = document.getElementById("question-search");
      const questionTypeFilter = document.getElementById("question-type-filter");
      const questionPartFilter = document.getElementById("question-part-filter");
      const jsonModal = document.getElementById("json-modal");
      const jsonEditor = document.getElementById("json-editor");
      const themeList = document.getElementById("theme-list");
      const themeViewport = document.getElementById("theme-viewport");
      const themeCatalog = [
        { id: "professional", name: "Professional", description: "احترافي نظيف بدون حدود", swatch: "professional" },
        { id: "modern-professional", name: "Modern Professional", description: "عصري أنيق بحواف ناعمة", swatch: "modern-professional" },
        { id: "playful-kids", name: "Playful Kids", description: "Pastel colors and cute details", swatch: "playful-kids" },
        { id: "classic", name: "Classic", description: "أكاديمي بسيط", swatch: "classic" },
        { id: "school-blue", name: "School Blue", description: "مدرسي ومنظم", swatch: "school-blue" },
        { id: "soft-study", name: "Soft Study", description: "هادئ ومريح", swatch: "soft-study" },
        { id: "kids", name: "Kids", description: "مرح للحضانة", swatch: "kids" }
      ];
      const uiStorageKey = "exam-paper-ui-settings-v1";

      function readUiSettings() {
        try {
          const stored = JSON.parse(localStorage.getItem(uiStorageKey) || "{}");
          return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
        } catch {
          return {};
        }
      }

      const uiSettings = readUiSettings();

      function saveUiSettings() {
        try {
          localStorage.setItem(uiStorageKey, JSON.stringify(uiSettings));
        } catch {}
      }

      document.querySelector(".designer-header")?.remove();
      document.querySelector(".preview-label")?.remove();
      document.querySelector(".designer-panel")?.prepend(document.querySelector(".theme-carousel"));
      const editorState = {
        query: typeof uiSettings.editorQuery === "string" ? uiSettings.editorQuery : "",
        type: ["all", "open", "mcq"].includes(uiSettings.editorType) ? uiSettings.editorType : "all",
        part: typeof uiSettings.editorPart === "string" ? uiSettings.editorPart : "all",
        expandedIds: new Set(Array.isArray(uiSettings.editorExpandedIds) ? uiSettings.editorExpandedIds : [])
      };
      let selectedMcq = null;
      let linkedHoverKey = "";
      let activeTabId = "tab-1";
      const tabs = [{ id: activeTabId, name: "الورقة 1", kind: "", data: pageData }];

      const docStorageKey = "exam-paper-document-v1";

      function saveDocState() {
        try {
          const currentTab = getActiveTab();
          if (currentTab) currentTab.data = clonePageData(pageData);
          localStorage.setItem(docStorageKey, JSON.stringify({
            activeTabId,
            tabs: tabs.map((tab) => ({ id: tab.id, name: tab.name, kind: tab.kind || "", data: tab.data }))
          }));
        } catch {}
      }

      function restoreDocState() {
        try {
          const stored = JSON.parse(localStorage.getItem(docStorageKey) || "null");
          if (!stored || !Array.isArray(stored.tabs) || stored.tabs.length === 0) return false;
          const savedTabs = stored.tabs
            .map((tab) => ({
              id: String(tab?.id || ""),
              name: String(tab?.name || "الورقة"),
              kind: String(tab?.kind || getContentKind(tab?.name) || ""),
              data: clonePageData(normalizePageData(tab?.data))
            }))
            .filter((tab) => tab.id);
          if (savedTabs.length === 0) return false;
          tabs.splice(0, tabs.length, ...savedTabs);
          const savedActive = stored.tabs.find((tab) => String(tab?.id) === String(stored.activeTabId));
          const activeId = savedActive ? String(savedActive.id) : savedTabs[0].id;
          const activeData = tabs.find((tab) => tab.id === activeId)?.data;
          if (activeData) {
            copyIntoPageData(activeData);
            const currentTab = getActiveTab();
            if (currentTab) currentTab.data = pageData;
          }
          activeTabId = activeId;
          return true;
        } catch {
          return false;
        }
      }

      function saveEditorState() {
        uiSettings.editorQuery = editorState.query;
        uiSettings.editorType = editorState.type;
        uiSettings.editorPart = editorState.part;
        uiSettings.editorExpandedIds = Array.from(editorState.expandedIds);
        saveUiSettings();
      }

      restoreDocState();

      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function getThemeId(themeId) {
        return themeCatalog.some((theme) => theme.id === themeId) ? themeId : "classic";
      }

      function renderThemes() {
        const activeTheme = getThemeId(pageData.theme);
        themeList.innerHTML = themeCatalog.map((theme) => `
          <button class="theme-card ${theme.id === activeTheme ? "active" : ""}" type="button" data-theme-id="${theme.id}">
            <span class="theme-swatch theme-swatch-${theme.swatch}"></span>
            <span class="theme-card-copy">
              <span class="theme-card-name">${escapeHtml(theme.name)}</span>
              <span class="theme-card-description">${escapeHtml(theme.description)}</span>
            </span>
          </button>
        `).join("");
      }

      function setTheme(themeId) {
        pageData.theme = getThemeId(themeId);
        uiSettings.theme = pageData.theme;
        saveUiSettings();
        renderThemes();
        renderPreview();
        saveDocState();
      }

      function clonePageData(data) {
        return JSON.parse(JSON.stringify(data));
      }

      function createBlankPage() {
        return {
          title: "",
          theme: "classic",
          questions: [{
            id: 1,
            part: "Part 1: New Section",
            part_intro: "",
            type: "open",
            question_latex: String.raw`Write your question here \(x^2\).`,
            options: [],
            answer_lines: 4
          }]
        };
      }

      function getActiveTab() {
        return tabs.find((tab) => tab.id === activeTabId);
      }

      function getContentKind(value) {
        const text = String(value || "");
        if (/self[-\s]?evaluation/i.test(text)) return "Self-Evaluation";
        if (/assignment|lesson assessment/i.test(text)) return "Assignment";
        if (/example/i.test(text)) return "Examples";
        return "";
      }

      function getTabName(title, kind = "") {
        const baseName = String(title || "Lesson")
          .replace(/^Assignment\s*[—-]\s*/i, "")
          .replace(/^Unit\s*\d+\s*[—:-]\s*/i, "")
          .replace(/\s*[—-]\s*Unit\s*\d+/i, "")
          .trim() || "Lesson";
        return kind ? `${baseName} — ${kind}` : baseName;
      }

      function copyIntoPageData(source) {
        pageData.title = source.title || "";
        pageData.theme = getThemeId(source.theme);
        pageData.questions.splice(0, pageData.questions.length, ...clonePageData(source.questions || []));
      }

      function renderTabs() {
        tabList.innerHTML = tabs.map((tab) => `
          <div class="tab-item ${tab.id === activeTabId ? "active" : ""}" data-tab-id="${escapeHtml(tab.id)}">
            <button class="tab-select" type="button" title="اضغط مرتين لإعادة التسمية">${escapeHtml(tab.name)}</button>
            <button class="tab-close" type="button" data-tab-action="close" title="إغلاق التاب">×</button>
          </div>
        `).join("");
      }

      function switchTab(tabId) {
        if (tabId === activeTabId) return;
        const currentTab = getActiveTab();
        const nextTab = tabs.find((tab) => tab.id === tabId);
        if (!currentTab || !nextTab) return;

        currentTab.data = clonePageData(pageData);
        copyIntoPageData(nextTab.data);
        nextTab.data = pageData;
        activeTabId = tabId;
        selectedMcq = null;
        paperTitleInput.value = pageData.title;
        renderThemes();
        renderTabs();
        renderEditor();
        renderPreview();
        saveDocState();
      }

      function addTab() {
        const currentTab = getActiveTab();
        if (currentTab) currentTab.data = clonePageData(pageData);

        const tabId = `tab-${Date.now()}`;
        const nextTab = {
          id: tabId,
          name: `الورقة ${tabs.length + 1}`,
          kind: "",
          data: createBlankPage()
        };
        tabs.push(nextTab);
        copyIntoPageData(nextTab.data);
        nextTab.data = pageData;
        activeTabId = tabId;
        selectedMcq = null;
        paperTitleInput.value = pageData.title;
        renderThemes();
        renderTabs();
        renderEditor();
        renderPreview();
        saveDocState();
      }

      function openPageInTab(source, sourceName = "") {
        const kind = getContentKind(sourceName) || getContentKind(source.title);
        const currentTab = getActiveTab();
        const canReuseBlankTab = tabs.length === 1
          && currentTab?.name === "الورقة 1"
          && !pageData.title
          && pageData.questions.length === 0;

        if (canReuseBlankTab) {
          currentTab.name = getTabName(source.title, kind);
          currentTab.kind = kind;
          copyIntoPageData(source);
          currentTab.data = pageData;
          return;
        }

        if (currentTab) currentTab.data = clonePageData(pageData);
        const tabId = `tab-${Date.now()}-${tabs.length}`;
        const nextTab = {
          id: tabId,
          name: getTabName(source.title, kind),
          kind,
          data: clonePageData(source)
        };
        tabs.push(nextTab);
        copyIntoPageData(nextTab.data);
        nextTab.data = pageData;
        activeTabId = tabId;
        selectedMcq = null;
      }

      function closeTab(tabId) {
        if (tabs.length === 1) {
          window.alert("يجب ترك تاب واحد على الأقل مفتوحًا.");
          return;
        }

        const index = tabs.findIndex((tab) => tab.id === tabId);
        if (index < 0) return;
        if (tabId === activeTabId) {
          const currentTab = getActiveTab();
          if (currentTab) currentTab.data = clonePageData(pageData);
        }

        tabs.splice(index, 1);
        if (tabId === activeTabId) {
          const nextTab = tabs[Math.min(index, tabs.length - 1)];
          activeTabId = nextTab.id;
          copyIntoPageData(nextTab.data);
          nextTab.data = pageData;
          selectedMcq = null;
          paperTitleInput.value = pageData.title;
          renderThemes();
          renderEditor();
          renderPreview();
        }
        renderTabs();
        saveDocState();
      }

      function renameTab(tabId) {
        const tab = tabs.find((item) => item.id === tabId);
        const tabItem = tabList.querySelector(`[data-tab-id="${CSS.escape(tabId)}"]`);
        const tabButton = tabItem?.querySelector(".tab-select");
        if (!tab || !tabButton || tabItem.querySelector(".tab-rename-input")) return;

        const input = document.createElement("input");
        input.className = "tab-rename-input";
        input.type = "text";
        input.value = tab.name;
        input.setAttribute("aria-label", "اسم التاب");
        tabButton.replaceWith(input);
        input.focus();
        input.select();

        let finished = false;
        const finish = (save) => {
          if (finished) return;
          finished = true;
          const nextName = input.value.trim();
          if (save && nextName) tab.name = nextName;
          renderTabs();
          if (save) saveDocState();
        };

        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") finish(true);
          if (event.key === "Escape") finish(false);
        });
        input.addEventListener("blur", () => finish(true), { once: true });
      }

      function groupByPart(questions) {
        return questions.reduce((groups, question) => {
          const existingPart = groups.find((group) => group.title === question.part);

          if (existingPart) {
            existingPart.questions.push(question);
          } else {
            groups.push({
              title: question.part,
              intro: question.part_intro || "",
              type: question.type || "open",
              questions: [question]
            });
          }

          return groups;
        }, []);
      }

      function renderEditor() {
        const parts = [...new Set(pageData.questions.map((question) => question.part))];
        if (editorState.part !== "all" && !parts.includes(editorState.part)) editorState.part = "all";
        questionPartFilter.innerHTML = [
          '<option value="all">كل الأقسام</option>',
          ...parts.map((part) => `<option value="${escapeHtml(part)}">${escapeHtml(part)}</option>`)
        ].join("");
        questionPartFilter.value = editorState.part;
        questionTypeFilter.value = editorState.type;
        questionSearch.value = editorState.query;

        const query = editorState.query.trim().toLowerCase();
        const visibleQuestions = pageData.questions
          .map((question, index) => ({ question, index }))
          .filter(({ question }) => {
            const searchable = `${question.id} ${question.part} ${question.question_latex}`.toLowerCase();
            const matchesQuery = !query || searchable.includes(query);
            const matchesType = editorState.type === "all" || (question.type || "open") === editorState.type;
            const matchesPart = editorState.part === "all" || question.part === editorState.part;
            return matchesQuery && matchesType && matchesPart;
          });

        editorCount.textContent = `${visibleQuestions.length} من ${pageData.questions.length} سؤال`;

        if (!visibleQuestions.length) {
          editorList.innerHTML = '<div class="editor-empty">لا توجد أسئلة مطابقة للبحث أو الفلاتر الحالية.</div>';
          return;
        }

        editorList.innerHTML = visibleQuestions.map(({ question, index }) => {
          const questionType = question.type === "mcq" ? "MCQ" : "مفتوح";
          const previewText = question.question_latex.replace(/\s+/g, " ").trim();
          const isExpanded = editorState.expandedIds.has(question.id);

          return `
            <details class="editor-card" data-index="${index}" data-question-id="${question.id}" data-part-name="${escapeHtml(question.part)}" ${isExpanded ? "open" : ""}>
              <summary class="editor-summary">
                <span class="editor-number">${escapeHtml(question.id)}</span>
                <span class="editor-type">${questionType}</span>
                <span class="editor-summary-text">
                  <span class="editor-summary-part">${escapeHtml(question.part)}</span>
                  <span class="editor-summary-preview">${escapeHtml(previewText)}</span>
                </span>
                <span class="editor-chevron">›</span>
              </summary>

              <div class="editor-card-body">
                <div class="editor-card-header">
                  <strong>تعديل سؤال #${escapeHtml(question.id)}</strong>
                  <div class="card-tools">
                    <button class="remove-question" type="button" data-action="remove">حذف</button>
                    <button class="duplicate-question" type="button" data-action="duplicate" title="نسخ السؤال">نسخ</button>
                    <button type="button" data-action="down" title="تحريك لأسفل">↓</button>
                    <button type="button" data-action="up" title="تحريك لأعلى">↑</button>
                  </div>
                </div>

                <div class="editor-form-grid">
                  <label class="field">
                    القسم
                    <input data-field="part" type="text" value="${escapeHtml(question.part)}" />
                  </label>

                  <label class="field">
                    مقدمة القسم
                    <input data-field="part_intro" type="text" value="${escapeHtml(question.part_intro || "")}" placeholder="اختياري" />
                  </label>

                  <label class="field">
                    نوع السؤال
                    <select data-field="type">
                      <option value="open" ${question.type !== "mcq" ? "selected" : ""}>سؤال بإجابة مفتوحة</option>
                      <option value="mcq" ${question.type === "mcq" ? "selected" : ""}>اختيار من متعدد (MCQ)</option>
                    </select>
                  </label>

                  <label class="field">
                    عدد سطور الإجابة
                    <select data-field="answer_lines">
                      ${[{ value: 0, label: "بدون سطور" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }].map(({ value, label }) => `<option value="${value}" ${Number(question.answer_lines) === value ? "selected" : ""}>${label}</option>`).join("")}
                    </select>
                  </label>

                  <label class="field field-wide">
                    نص السؤال / LaTeX
                    <textarea data-field="question_latex" spellcheck="false">${escapeHtml(question.question_latex)}</textarea>
                  </label>

                  <label class="field field-wide ${question.type === "mcq" ? "" : "is-hidden"}">
                    الاختيارات — اختيار واحد في كل سطر
                    <textarea data-field="options" spellcheck="false" placeholder="مثال: (a) x + 1&#10;(b) x - 1">${escapeHtml((question.options || []).join("\n"))}</textarea>
                  </label>
                </div>
              </div>
            </details>
          `;
        }).join("");
      }

      function renderMath() {
        if (typeof window.renderMathInElement !== "function") return;

        window.requestAnimationFrame(() => {
          window.renderMathInElement(paper, {
            delimiters: [
              { left: "\\(", right: "\\)", display: false },
              { left: "$$", right: "$$", display: true }
            ],
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
          });
        });
      }

      function renderPreview() {
        paper.className = `paper theme-${getThemeId(pageData.theme)}`;
        paper.innerHTML = "";

        if (pageData.title.trim()) {
          const titleMatch = pageData.title.match(/^(Unit\s*\d+)\s*[—:-]\s*(Lesson\s*\d+)\s*[—:-]\s*(.+)$/i);
          const title = document.createElement("header");
          title.className = "paper-title";

          const meta = document.createElement("div");
          meta.className = "paper-title-meta";
          const contentKind = getActiveTab()?.kind || getContentKind(pageData.title);
          meta.textContent = titleMatch
            ? [titleMatch[1], titleMatch[2], contentKind].filter(Boolean).join(" · ")
            : contentKind;

          const name = document.createElement("h1");
          name.className = "paper-title-name";
          name.textContent = titleMatch ? titleMatch[3].trim() : pageData.title;
          title.append(meta, name);
          paper.appendChild(title);
        }

        groupByPart(pageData.questions).forEach((part) => {
          const section = document.createElement("section");
          section.className = "part";
          section.dataset.partName = part.title;
          const sourceIndex = pageData.questions.indexOf(part.questions[0]);

          const heading = document.createElement("h2");
          heading.className = "part-heading";
          heading.textContent = part.title;
          section.appendChild(heading);

          if (part.intro) {
            const intro = document.createElement("p");
            intro.className = "part-intro";
            intro.classList.add("preview-editable");
            intro.dataset.editIndex = sourceIndex;
            intro.dataset.editField = "part_intro";
            intro.textContent = part.intro;
            section.appendChild(intro);
          }

          const table = document.createElement("div");
          table.className = `question-table ${part.type === "mcq" ? "mcq-table" : ""}`;

          if (part.type === "mcq") {
            part.questions.forEach((question) => {
              const card = document.createElement("article");
              card.className = "mcq-question";
              card.dataset.previewQuestionId = question.id;

              const header = document.createElement("div");
              header.className = "mcq-question-header";

              const number = document.createElement("span");
              number.className = "mcq-number";
              number.textContent = question.id;

              const questionText = document.createElement("div");
              questionText.className = "mcq-question-text";
              questionText.classList.add("preview-editable");
              questionText.dataset.editIndex = pageData.questions.indexOf(question);
              questionText.dataset.editField = "question_latex";
              questionText.title = "اضغط مرتين لتعديل السؤال والمعادلة";
              questionText.textContent = question.question_latex;
              header.append(number, questionText);

              const options = document.createElement("div");
              options.className = "mcq-options";
              (question.options || []).forEach((option, optionIndex) => {
                const optionElement = document.createElement("div");
                optionElement.className = "mcq-option";
                optionElement.dataset.questionId = question.id;
                optionElement.dataset.optionIndex = optionIndex;
                optionElement.classList.toggle(
                  "selected",
                  selectedMcq?.questionId === question.id && selectedMcq?.optionIndex === optionIndex
                );
                optionElement.title = "اضغط لاختيار الإجابة أو إلغاء الاختيار";
                const label = document.createElement("span");
                label.className = "mcq-option-label";
                label.textContent = `(${String.fromCharCode(97 + optionIndex)})`;
                const optionText = document.createElement("span");
                optionText.classList.add("preview-editable");
                optionText.dataset.editIndex = pageData.questions.indexOf(question);
                optionText.dataset.editField = "options";
                optionText.dataset.optionIndex = optionIndex;
                optionText.title = "اضغط مرتين لتعديل الاختيار";
                optionText.textContent = option;
                optionElement.append(label, optionText);
                options.appendChild(optionElement);
              });

              card.append(header, options);
              table.appendChild(card);
            });
          } else {
            part.questions.forEach((question) => {
              const row = document.createElement("div");
              row.className = "question-row";
              row.dataset.previewQuestionId = question.id;

              const questionCell = document.createElement("div");
              questionCell.className = "question-cell";

              const number = document.createElement("span");
              number.className = "question-number";
              number.textContent = question.id;

              const questionText = document.createElement("div");
              questionText.className = "question-text";
              questionText.classList.add("preview-editable");
              questionText.dataset.editIndex = pageData.questions.indexOf(question);
              questionText.dataset.editField = "question_latex";
              questionText.title = "اضغط مرتين لتعديل السؤال والمعادلة";
              questionText.textContent = question.question_latex;

              questionCell.append(number, questionText);

              const answerCell = document.createElement("div");
              answerCell.className = "answer-cell";

              const answerLineCount = Number.isFinite(Number(question.answer_lines))
                ? Math.min(4, Math.max(0, Number(question.answer_lines)))
                : 4;
              for (let line = 0; line < answerLineCount; line += 1) {
                const answerLine = document.createElement("div");
                answerLine.className = "answer-line";
                answerCell.appendChild(answerLine);
              }

              row.append(questionCell, answerCell);
              table.appendChild(row);
            });
          }

          section.appendChild(table);
          paper.appendChild(section);
        });

        renderSectionNav();
        renderMath();
      }

      function renderSectionNav() {
        const parts = groupByPart(pageData.questions);
        sectionNav.innerHTML = "";
        sectionNav.hidden = parts.length === 0;

        parts.forEach((part, index) => {
          const button = document.createElement("button");
          button.className = "section-nav-item";
          button.type = "button";
          button.dataset.partName = part.title;
          button.dataset.navIndex = index;
          button.setAttribute("aria-label", `الانتقال إلى ${part.title}`);
          const label = document.createElement("span");
          label.className = "section-nav-label";
          const labelTitle = document.createElement("span");
          labelTitle.className = "section-nav-label-title";
          labelTitle.textContent = part.title;
          label.appendChild(labelTitle);
          button.appendChild(label);

          button.addEventListener("click", () => scrollPreviewToPart(part.title));
          sectionNav.appendChild(button);
        });

        updateSectionNavActive();
      }

      function scrollPreviewToPart(partName) {
        const target = [...paper.querySelectorAll(".part[data-part-name]")]
          .find((section) => section.dataset.partName === partName);
        if (!target) return;

        const stageRect = previewStage.getBoundingClientRect();
        const targetTop = target.getBoundingClientRect().top - stageRect.top + previewStage.scrollTop;
        previewStage.scrollTo({ top: Math.max(0, targetTop - 18), behavior: "smooth" });
      }

      function updateSectionNavActive() {
        if (sectionNav.hidden) return;

        const sections = [...paper.querySelectorAll(".part[data-part-name]")];
        const stageTop = previewStage.getBoundingClientRect().top;
        const threshold = Math.max(80, previewStage.clientHeight * 0.32);
        let activeName = sections[0]?.dataset.partName || "";

        sections.forEach((section) => {
          if (section.getBoundingClientRect().top - stageTop <= threshold) {
            activeName = section.dataset.partName;
          }
        });

        sectionNav.querySelectorAll(".section-nav-item").forEach((button) => {
          button.classList.toggle("active", button.dataset.partName === activeName);
        });
      }

      function clearLinkedHover() {
        linkedHoverKey = "";
        document.querySelectorAll(".link-hovered").forEach((element) => element.classList.remove("link-hovered"));
      }

      function scrollPreviewToQuestion(questionId) {
        const target = [...paper.querySelectorAll("[data-preview-question-id]")]
          .find((element) => element.dataset.previewQuestionId === String(questionId));
        if (!target) return;

        const stageRect = previewStage.getBoundingClientRect();
        const targetTop = target.getBoundingClientRect().top - stageRect.top + previewStage.scrollTop;
        previewStage.scrollTo({ top: Math.max(0, targetTop - 10), behavior: "smooth" });
      }

      function hoverQuestion(questionId) {
        if (document.body.classList.contains("tools-hidden")) {
          clearLinkedHover();
          return;
        }
        clearLinkedHover();
        linkedHoverKey = `question:${questionId}`;
        document.querySelectorAll(".editor-card[data-question-id]").forEach((card) => {
          if (card.dataset.questionId === String(questionId)) card.classList.add("link-hovered");
        });
        paper.querySelectorAll("[data-preview-question-id]").forEach((question) => {
          if (question.dataset.previewQuestionId === String(questionId)) question.classList.add("link-hovered");
        });
      }

      function hoverPart(partName) {
        if (document.body.classList.contains("tools-hidden")) {
          clearLinkedHover();
          return;
        }
        clearLinkedHover();
        linkedHoverKey = `part:${partName}`;
        document.querySelectorAll(".editor-card[data-part-name]").forEach((card) => {
          if (card.dataset.partName === partName) card.classList.add("link-hovered");
        });
        paper.querySelectorAll(".part[data-part-name]").forEach((part) => {
          if (part.dataset.partName === partName) part.classList.add("link-hovered");
        });
      }

      function isEntering(element, relatedTarget) {
        return !relatedTarget || !element.contains(relatedTarget);
      }

      function isLeaving(element, relatedTarget) {
        return !relatedTarget || !element.contains(relatedTarget);
      }

      function repairLatexEscapes(raw) {
        let out = "";
        let inString = false;
        for (let i = 0; i < raw.length; i++) {
          const ch = raw[i];
          if (inString) {
            if (ch === "\\") {
              const next = raw[i + 1];
              if (next === "\\" || next === '"') {
                out += ch + next;
                i += 1;
              } else {
                out += "\\\\";
              }
            } else {
              out += ch;
              if (ch === '"') inString = false;
            }
          } else {
            out += ch;
            if (ch === '"') inString = true;
          }
        }
        return out;
      }

      function parseJsonTolerant(raw) {
        // Canonical JSON only uses \n (newlines), \" and \\ as single-backslash
        // sequences. Any other single backslash means the LaTeX was not
        // JSON-escaped (e.g. \(x\) or \frac pasted from a chat/README), which
        // would fail to parse or silently corrupt the math. Repair it first.
        const needsRepair = /(^|[^\\])\\(?![\\"\/n])/.test(raw);
        const source = needsRepair ? repairLatexEscapes(raw) : raw;
        return JSON.parse(source);
      }

      function normalizePageData(input) {
        const source = Array.isArray(input) ? { title: "", questions: input } : input;
        if (!source || !Array.isArray(source.questions)) {
          throw new Error("JSON must contain a questions array.");
        }

        const usedIds = new Set();
        let fallbackId = 1;
        const questions = source.questions.map((rawQuestion, index) => {
          if (!rawQuestion || typeof rawQuestion !== "object") {
            throw new Error(`Question ${index + 1} is not an object.`);
          }

          let id = Number(rawQuestion.id);
          while (!Number.isInteger(id) || id < 1 || usedIds.has(id)) {
            id = fallbackId;
            fallbackId += 1;
          }
          usedIds.add(id);
          fallbackId = Math.max(fallbackId, id + 1);

          const questionLatex = String(rawQuestion.question_latex ?? "").trim();
          if (!questionLatex) throw new Error(`Question ${index + 1} has no question_latex.`);

          const parsedAnswerLines = Number(rawQuestion.answer_lines);
          const answerLines = Number.isFinite(parsedAnswerLines)
            ? Math.min(4, Math.max(0, Math.trunc(parsedAnswerLines)))
            : 4;
          const type = rawQuestion.type === "mcq" ? "mcq" : "open";
          const options = Array.isArray(rawQuestion.options)
            ? rawQuestion.options.map((option) => String(option)).filter(Boolean)
            : [];

          return {
            id,
            part: String(rawQuestion.part ?? `Part ${index + 1}: New Section`),
            part_intro: String(rawQuestion.part_intro ?? ""),
            type,
            question_latex: questionLatex,
            options,
            answer_lines: answerLines
          };
        });

        return {
          title: String(source.title ?? ""),
          theme: getThemeId(source.theme),
          questions
        };
      }

      function finishInlineEdit(index, field, value, optionIndex) {
        const question = pageData.questions[index];
        if (!question) return;

        if (field === "part" || field === "part_intro") {
          const oldPart = question.part;
          const nextValue = value.trim();
          pageData.questions.forEach((item) => {
            if (item.part === oldPart) item[field] = nextValue;
          });
        } else if (field === "options") {
          question.options = question.options || [];
          question.options[Number(optionIndex)] = value.trim();
        } else {
          question[field] = value;
        }

        renderEditor();
        renderPreview();
        saveDocState();
      }

      function startInlineEdit(element) {
        if (document.body.classList.contains("tools-hidden")) return;
        if (element.dataset.editing === "true") return;

        const index = Number(element.dataset.editIndex);
        const field = element.dataset.editField;
        const optionIndex = element.dataset.optionIndex;
        const question = pageData.questions[index];
        if (!question) return;

        const value = field === "options"
          ? (question.options || [])[Number(optionIndex)] || ""
          : question[field] || "";
        const editor = document.createElement(field === "part" ? "input" : "textarea");
        const computed = window.getComputedStyle(element);
        editor.className = "inline-preview-editor";
        editor.value = value;
        editor.spellcheck = false;
        editor.dataset.editing = "true";
        editor.style.width = `${Math.max(element.offsetWidth, 80)}px`;
        editor.style.height = `${Math.max(element.offsetHeight, 28)}px`;
        editor.style.margin = computed.margin;
        editor.style.fontFamily = computed.fontFamily;
        editor.style.fontSize = computed.fontSize;
        editor.style.fontWeight = computed.fontWeight;
        editor.style.lineHeight = computed.lineHeight;

        element.replaceWith(editor);
        editor.focus();
        editor.select();

        let finished = false;
        const finish = (save) => {
          if (finished) return;
          finished = true;
          if (save) finishInlineEdit(index, field, editor.value, optionIndex);
          else renderPreview();
        };

        editor.addEventListener("blur", () => finish(true), { once: true });
        editor.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            finish(false);
          }

          if (event.key === "Enter" && (field === "part" || event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            editor.blur();
          }
        });
      }

      const aiJsonTemplate = [
        "Create an exam-paper JSON object and return ONLY valid JSON, with no Markdown fences or explanation.",
        "Follow this exact schema and keep every field name unchanged:",
        "{",
        '  "title": "Exam title",',
        '  "theme": "classic",',
        '  "questions": [',
        "    {",
        '      "id": 1,',
        '      "part": "Part 1: New Section",',
        '      "part_intro": "",',
        '      "type": "open",',
        '      "question_latex": "Write your question here",',
        '      "options": [],',
        '      "answer_lines": 4',
        "    }",
        "  ]",
        "}",
        "Rules:",
        "- theme must be one of: professional, modern-professional, playful-kids, classic, school-blue, soft-study, kids.",
        "- type must be either open or mcq.",
        "- Use an empty options array for open questions; use an array of answer choices for mcq questions.",
        "- answer_lines must be an integer from 1 to 4.",
        "- Every question must have a unique positive integer id.",
        "- Keep questions in the questions array and use part to group them into sections.",
        "- Put mathematical notation in question_latex using the page's KaTeX delimiters."
      ].join("\n");

      async function copyAiTemplate() {
        const button = document.getElementById("copy-ai-template");
        const originalLabel = button.textContent;

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(aiJsonTemplate);
          } else {
            const textarea = document.createElement("textarea");
            textarea.value = aiJsonTemplate;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
          }

          button.textContent = "تم النسخ ✓";
          window.setTimeout(() => { button.textContent = originalLabel; }, 1400);
        } catch (error) {
          window.alert("تعذر نسخ قالب AI. يمكنك فتحه أو نسخه يدويًا من محرر JSON.");
        }
      }

      function downloadJson() {
        const blob = new Blob([JSON.stringify(pageData, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safeTitle = String(pageData.title || "exam-paper-questions")
          .replace(/[\\/:*?"<>|]+/g, "-")
          .replace(/\s+/g, " ")
          .trim();
        link.download = `${safeTitle || "exam-paper-questions"}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      function openJsonEditor() {
        jsonEditor.value = JSON.stringify(pageData, null, 2);
        jsonModal.hidden = false;
        jsonEditor.focus();
      }

      function closeJsonEditor() {
        jsonModal.hidden = true;
      }

      function applyJsonEditor() {
        try {
          const imported = normalizePageData(parseJsonTolerant(jsonEditor.value));
          pageData.title = imported.title;
          pageData.theme = imported.theme;
          pageData.questions.splice(0, pageData.questions.length, ...imported.questions);
          paperTitleInput.value = pageData.title;
          renderThemes();
          editorState.query = "";
          editorState.type = "all";
          editorState.part = "all";
          editorState.expandedIds.clear();
          selectedMcq = null;
          closeJsonEditor();
          renderEditor();
          renderPreview();
          saveDocState();
          saveEditorState();
        } catch (error) {
          window.alert(`تعذر تطبيق JSON: ${error.message}`);
        }
      }

      async function importJson(file) {
        if (!file) return;

        try {
          const imported = normalizePageData(parseJsonTolerant(await file.text()));
          pageData.title = imported.title;
          pageData.theme = imported.theme;
          pageData.questions.splice(0, pageData.questions.length, ...imported.questions);
          paperTitleInput.value = pageData.title;
          renderThemes();
          editorState.query = "";
          editorState.type = "all";
          editorState.part = "all";
          editorState.expandedIds.clear();
          renderEditor();
          renderPreview();
          saveDocState();
          saveEditorState();
        } catch (error) {
          window.alert(`تعذر رفع JSON: ${error.message}`);
        }
      }

      function syncMatchingInputs(field, indices, value, exceptTarget) {
        editorList.querySelectorAll(`[data-field="${field}"]`).forEach((input) => {
          const card = input.closest("[data-index]");
          const index = Number(card.dataset.index);
          if (input !== exceptTarget && indices.includes(index)) {
            input.value = value;
          }
        });
      }

      function updateQuestion(index, field, value, target) {
        const question = pageData.questions[index];

        if (field === "part" || field === "part_intro") {
          const oldPart = question.part;
          const affectedIndices = pageData.questions
            .map((item, itemIndex) => item.part === oldPart ? itemIndex : -1)
            .filter((itemIndex) => itemIndex >= 0);
          pageData.questions.forEach((item) => {
            if (item.part === oldPart) item[field] = value;
          });
          syncMatchingInputs(field, affectedIndices, value, target);
        } else if (field === "answer_lines") {
          question[field] = Number(value);
        } else if (field === "options") {
          question.options = value
            .split(/\r?\n/)
            .map((option) => option.trim())
            .filter(Boolean);
        } else if (field === "type") {
          question.type = value;
          renderEditor();
        } else {
          question[field] = value;
        }

        renderPreview();
        saveDocState();
      }

      function nextQuestionId() {
        return pageData.questions.reduce((max, question) => Math.max(max, Number(question.id) || 0), 0) + 1;
      }

      function addQuestion(newPart = false) {
        const lastQuestion = pageData.questions.at(-1);
        const partNumber = groupByPart(pageData.questions).length + 1;
        const newId = nextQuestionId();

        pageData.questions.push({
          id: newId,
          part: newPart ? `Part ${partNumber}: New Section` : (lastQuestion?.part || "Part 1: New Section"),
          part_intro: newPart ? "" : (lastQuestion?.part_intro || ""),
          type: "open",
          options: [],
          question_latex: String.raw`Write your question here \(x^2\).`,
          answer_lines: 4
        });

        editorState.query = "";
        editorState.type = "all";
        editorState.part = "all";
        editorState.expandedIds.add(newId);
        renderEditor();
        renderPreview();
        saveDocState();
        saveEditorState();
      }

      function removeQuestion(index) {
        if (pageData.questions.length === 1) {
          pageData.questions[0].question_latex = "Write your question here.";
          pageData.questions[0].part = "Part 1: New Section";
          pageData.questions[0].part_intro = "";
          pageData.questions[0].type = "open";
          pageData.questions[0].options = [];
        } else {
          pageData.questions.splice(index, 1);
        }

        renderEditor();
        renderPreview();
        saveDocState();
      }

      function duplicateQuestion(index) {
        const source = pageData.questions[index];
        if (!source) return;

        const duplicate = clonePageData(source);
        duplicate.id = nextQuestionId();
        pageData.questions.splice(index + 1, 0, duplicate);
        editorState.expandedIds.add(duplicate.id);
        renderEditor();
        renderPreview();
        saveDocState();
        saveEditorState();
      }

      function moveQuestion(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= pageData.questions.length) return;

        const [question] = pageData.questions.splice(index, 1);
        pageData.questions.splice(newIndex, 0, question);
        renderEditor();
        renderPreview();
        saveDocState();
      }

      function resetPaper() {
        if (!window.confirm("إرجاع التصميم إلى النسخة الافتراضية؟")) return;

        pageData.title = defaultPageData.title;
        pageData.theme = getThemeId(defaultPageData.theme);
        pageData.questions.splice(0, pageData.questions.length, ...JSON.parse(JSON.stringify(defaultPageData.questions)));
        paperTitleInput.value = pageData.title;
        renderThemes();
        editorState.query = "";
        editorState.type = "all";
        editorState.part = "all";
        editorState.expandedIds.clear();
        renderEditor();
        renderPreview();
        saveDocState();
        saveEditorState();
      }

      function clearPaper() {
        if (!window.confirm("مسح كل الأسئلة؟")) return;

        pageData.questions.splice(0, pageData.questions.length, {
          id: 1,
          part: "Part 1: New Section",
          part_intro: "",
          type: "open",
          question_latex: "Write your question here.",
          options: [],
          answer_lines: 4
        });
        editorState.query = "";
        editorState.type = "all";
        editorState.part = "all";
        editorState.expandedIds.clear();
        renderEditor();
        renderPreview();
        saveDocState();
        saveEditorState();
      }

      async function downloadPaper() {
        try {
          const readAsset = async (url, fallback) => {
            try {
              const response = await fetch(url);
              if (response.ok) return response.text();
            } catch {}
            return fallback();
          };
          const css = await readAsset("styles.css", () => document.querySelector("style")?.textContent || "");
          const runtime = await readAsset(
            "exam-paper.js",
            () => [...document.scripts].find((script) => script.textContent.includes("async function downloadPaper"))?.textContent || ""
          );
          if (!css || !runtime) throw new Error("Unable to load exported assets");
          const source = "<!doctype html>\n" + document.documentElement.outerHTML;
          const stylesLink = '<link rel="stylesheet" href="styles.css" />';
          const runtimeScript = /<script src="exam-paper\.js(?:\?[^\"]*)"><\/script>/;
          const sourceWithInlineAssets = source
            .replace(stylesLink, `<style>\n${css}\n    </style>`)
            .replace(runtimeScript, `<script>\n${runtime}\n    </script>`);
          const dataStart = sourceWithInlineAssets.indexOf("const pageData = ");
          const dataEnd = sourceWithInlineAssets.indexOf(";\n\n      const defaultPageData", dataStart);
          const serializedData = `const pageData = ${JSON.stringify(pageData, null, 2)}`;
          const exported = dataStart >= 0 && dataEnd >= 0
            ? sourceWithInlineAssets.slice(0, dataStart) + serializedData + sourceWithInlineAssets.slice(dataEnd)
            : sourceWithInlineAssets;
          const blob = new Blob([exported], { type: "text/html;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "exam-paper-designed.html";
          link.click();
          URL.revokeObjectURL(url);
        } catch {
          window.alert("تعذر تجهيز ملف HTML. تأكد من تشغيل الصفحة عبر خادم محلي.");
        }
      }

      editorList.addEventListener("input", (event) => {
        const target = event.target;
        const card = target.closest("[data-index]");
        if (!card || !target.dataset.field) return;
        updateQuestion(Number(card.dataset.index), target.dataset.field, target.value, target);
      });

      editorList.addEventListener("change", (event) => {
        const target = event.target;
        const card = target.closest("[data-index]");
        if (!card || !target.dataset.field) return;
        updateQuestion(Number(card.dataset.index), target.dataset.field, target.value, target);
        if (["part", "part_intro", "question_latex"].includes(target.dataset.field)) renderEditor();
      });

      editorList.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const card = button.closest("[data-index]");
        const index = Number(card.dataset.index);
        const action = button.dataset.action;

        if (action === "remove") removeQuestion(index);
        if (action === "duplicate") duplicateQuestion(index);
        if (action === "up") moveQuestion(index, -1);
        if (action === "down") moveQuestion(index, 1);
      });

      editorList.addEventListener("click", (event) => {
        const summary = event.target.closest(".editor-summary[data-question-id], .editor-card[data-question-id] > summary");
        if (!summary) return;
        const card = summary.closest(".editor-card[data-question-id]");
        if (card) window.requestAnimationFrame(() => scrollPreviewToQuestion(card.dataset.questionId));
      });

      editorList.addEventListener("toggle", (event) => {
        const card = event.target.closest("details[data-question-id]");
        if (!card) return;
        const questionId = Number(card.dataset.questionId);
        if (card.open) editorState.expandedIds.add(questionId);
        else editorState.expandedIds.delete(questionId);
        saveEditorState();
      }, true);

      editorList.addEventListener("mouseover", (event) => {
        const card = event.target.closest(".editor-card[data-question-id]");
        if (card && isEntering(card, event.relatedTarget)) hoverQuestion(card.dataset.questionId);
      });

      editorList.addEventListener("mouseout", (event) => {
        const card = event.target.closest(".editor-card[data-question-id]");
        if (card && isLeaving(card, event.relatedTarget)) clearLinkedHover();
      });

      questionSearch.addEventListener("input", () => {
        editorState.query = questionSearch.value;
        renderEditor();
        saveEditorState();
      });

      questionTypeFilter.addEventListener("change", () => {
        editorState.type = questionTypeFilter.value;
        renderEditor();
        saveEditorState();
      });

      questionPartFilter.addEventListener("change", () => {
        editorState.part = questionPartFilter.value;
        renderEditor();
        saveEditorState();
      });

      document.getElementById("collapse-all").addEventListener("click", () => {
        editorState.expandedIds.clear();
        renderEditor();
        saveEditorState();
      });

      document.getElementById("expand-all").addEventListener("click", () => {
        editorState.expandedIds = new Set(pageData.questions.map((question) => question.id));
        renderEditor();
        saveEditorState();
      });

      paperTitleInput.addEventListener("input", () => {
        pageData.title = paperTitleInput.value;
        renderPreview();
        saveDocState();
      });

      tabList.addEventListener("click", (event) => {
        const tabItem = event.target.closest("[data-tab-id]");
        if (!tabItem) return;

        if (event.target.closest("[data-tab-action=close]")) {
          closeTab(tabItem.dataset.tabId);
          return;
        }

        if (event.target.closest(".tab-select")) switchTab(tabItem.dataset.tabId);
      });

      tabList.addEventListener("dblclick", (event) => {
        const tabItem = event.target.closest("[data-tab-id]");
        if (tabItem && event.target.closest(".tab-select")) renameTab(tabItem.dataset.tabId);
      });

      document.getElementById("add-tab").addEventListener("click", addTab);

      themeList.addEventListener("click", (event) => {
        const themeCard = event.target.closest("[data-theme-id]");
        if (themeCard) setTheme(themeCard.dataset.themeId);
      });

      document.getElementById("theme-prev").addEventListener("click", () => {
        themeViewport.scrollBy({ left: -220, behavior: "smooth" });
      });

      document.getElementById("theme-next").addEventListener("click", () => {
        themeViewport.scrollBy({ left: 220, behavior: "smooth" });
      });

      const toggleToolsButton = document.getElementById("toggle-tools");
      toggleToolsButton.insertAdjacentHTML("afterend", `
        <div class="menu-panel" id="app-menu" role="menu" hidden>
          <button class="menu-action" id="menu-home" type="button">الرئيسية</button>
          <div class="menu-divider"></div>
          <button class="menu-action" id="menu-tools-toggle" type="button">إخفاء الأدوات</button>
          <div class="menu-divider"></div>
          <label class="menu-label" for="preview-zoom">
            <span>زوم المعاينة</span>
            <output id="zoom-value" for="preview-zoom">100%</output>
          </label>
          <div class="zoom-row">
            <input id="preview-zoom" type="range" min="60" max="250" step="5" value="100" />
            <button class="fit-preview" id="fit-preview" type="button">ملاءمة العرض</button>
          </div>
          <div class="menu-divider"></div>
          <label class="menu-switch" for="dark-mode-toggle">
            <input id="dark-mode-toggle" type="checkbox" />
            <span>الوضع الداكن</span>
          </label>
        </div>
      `);

      const appMenu = document.getElementById("app-menu");
      const menuHome = document.getElementById("menu-home");
      const menuToolsToggle = document.getElementById("menu-tools-toggle");
      const previewZoom = document.getElementById("preview-zoom");
      const zoomValue = document.getElementById("zoom-value");
      const fitPreview = document.getElementById("fit-preview");
      const darkModeToggle = document.getElementById("dark-mode-toggle");

      function setMenuOpen(open) {
        appMenu.hidden = !open;
        toggleToolsButton.setAttribute("aria-expanded", String(open));
      }

      function getMaxPreviewZoom() {
        const availableWidth = Math.max(120, previewStage.clientWidth - 18);
        // Keep the fit calculation stable even when CSS zoom was previously
        // applied to the paper. A4 width at 96 CSS pixels per inch is ~794px.
        const paperWidth = 210 / 25.4 * 96;
        const fitZoom = Math.floor((availableWidth / paperWidth) * 100 / 5) * 5;
        return Math.max(5, Math.min(250, fitZoom));
      }

      function syncPreviewZoomLimit() {
        const maxZoom = getMaxPreviewZoom();
        previewZoom.min = String(Math.min(60, maxZoom));
        previewZoom.max = String(maxZoom);
        return maxZoom;
      }

      function setPreviewZoom(value) {
        const maxZoom = syncPreviewZoomLimit();
        const minZoom = Number(previewZoom.min);
        const requestedZoom = Math.max(60, Math.min(250, Number(value) || 100));
        const nextZoom = Math.max(minZoom, Math.min(maxZoom, requestedZoom));
        previewZoom.value = String(nextZoom);
        zoomValue.textContent = `${nextZoom}%`;
        paper.style.zoom = String(nextZoom / 100);
        uiSettings.previewZoom = nextZoom;
        uiSettings.previewZoomRequested = requestedZoom;
        saveUiSettings();
      }

      function reapplyPreviewZoom() {
        setPreviewZoom(uiSettings.previewZoomRequested || uiSettings.previewZoom || 100);
      }

      function fitPreviewToWidth() {
        setPreviewZoom(getMaxPreviewZoom());
      }

      function setDarkMode(enabled) {
        document.body.classList.toggle("dark-mode", enabled);
        darkModeToggle.checked = enabled;
        uiSettings.darkMode = enabled;
        saveUiSettings();
      }

      let storedZoom = Number(uiSettings.previewZoomRequested || uiSettings.previewZoom) || 0;
      let storedDarkMode = typeof uiSettings.darkMode === "boolean" ? uiSettings.darkMode : null;
      try {
        if (!storedZoom) storedZoom = Number(localStorage.getItem("exam-paper-preview-zoom")) || 100;
        if (storedDarkMode === null) storedDarkMode = localStorage.getItem("exam-paper-dark-mode") === "1";
      } catch {}

      setPreviewZoom(storedZoom || 100);
      setDarkMode(storedDarkMode === true);

      const storedToolsHidden = uiSettings.toolsHidden === true;
      document.body.classList.toggle("tools-hidden", storedToolsHidden);
      menuToolsToggle.textContent = storedToolsHidden ? "إظهار الأدوات" : "إخفاء الأدوات";

      toggleToolsButton.addEventListener("click", (event) => {
        event.stopPropagation();
        setMenuOpen(appMenu.hidden);
      });

      menuHome.addEventListener("click", () => {
        window.location.href = "home.html";
      });

      menuToolsToggle.addEventListener("click", () => {
        const hidden = document.body.classList.toggle("tools-hidden");
        if (hidden) clearLinkedHover();
        menuToolsToggle.textContent = hidden ? "إظهار الأدوات" : "إخفاء الأدوات";
        uiSettings.toolsHidden = hidden;
        saveUiSettings();
        if (!hidden) restoreUiScrollPositions();
        reapplyPreviewZoom();
        setMenuOpen(false);
      });

      previewZoom.addEventListener("input", () => setPreviewZoom(previewZoom.value));
      fitPreview.addEventListener("click", fitPreviewToWidth);
      darkModeToggle.addEventListener("change", () => setDarkMode(darkModeToggle.checked));
      window.addEventListener("resize", reapplyPreviewZoom);

      let uiScrollSaveTimer = 0;

      function saveUiScrollPositions() {
        window.clearTimeout(uiScrollSaveTimer);
        uiScrollSaveTimer = window.setTimeout(() => {
          uiSettings.previewScrollTop = Math.round(previewStage.scrollTop);
          uiSettings.toolsScrollTop = Math.round(designerPanel?.scrollTop || 0);
          saveUiSettings();
        }, 120);
      }

      function restoreUiScrollPositions() {
        previewStage.scrollTop = Number(uiSettings.previewScrollTop) || 0;
        if (!document.body.classList.contains("tools-hidden") && designerPanel) {
          designerPanel.scrollTop = Number(uiSettings.toolsScrollTop) || 0;
        }
      }

      previewStage.addEventListener("scroll", saveUiScrollPositions, { passive: true });
      designerPanel?.addEventListener("scroll", saveUiScrollPositions, { passive: true });

      document.addEventListener("click", (event) => {
        if (!event.target.closest(".tab-actions")) setMenuOpen(false);
      });

      paper.addEventListener("click", (event) => {
        const label = event.target.closest(".mcq-option-label");
        if (!label) return;

        const option = label.closest(".mcq-option");
        const questionId = Number(option.dataset.questionId);
        const optionIndex = Number(option.dataset.optionIndex);
        const isSame = selectedMcq?.questionId === questionId && selectedMcq?.optionIndex === optionIndex;

        paper.querySelectorAll(".mcq-option.selected").forEach((item) => item.classList.remove("selected"));
        selectedMcq = isSame ? null : { questionId, optionIndex };
        if (!isSame) option.classList.add("selected");
      });

      paper.addEventListener("mouseover", (event) => {
        const question = event.target.closest("[data-preview-question-id]");
        if (question && isEntering(question, event.relatedTarget)) {
          hoverQuestion(question.dataset.previewQuestionId);
          return;
        }

        const part = event.target.closest(".part[data-part-name]");
        if (part && isEntering(part, event.relatedTarget)) hoverPart(part.dataset.partName);
      });

      paper.addEventListener("mouseout", (event) => {
        const question = event.target.closest("[data-preview-question-id]");
        if (question && isLeaving(question, event.relatedTarget)) {
          clearLinkedHover();
          return;
        }

        const part = event.target.closest(".part[data-part-name]");
        if (part && isLeaving(part, event.relatedTarget)) clearLinkedHover();
      });

      paper.addEventListener("mousemove", (event) => {
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const question = element?.closest?.("[data-preview-question-id]");
        if (question) {
          const key = `question:${question.dataset.previewQuestionId}`;
          if (linkedHoverKey !== key) hoverQuestion(question.dataset.previewQuestionId);
          return;
        }

        const part = element?.closest?.(".part[data-part-name]");
        if (part) {
          const key = `part:${part.dataset.partName}`;
          if (linkedHoverKey !== key) hoverPart(part.dataset.partName);
        }
      });

      paper.addEventListener("mouseleave", clearLinkedHover);
      previewStage.addEventListener("scroll", updateSectionNavActive, { passive: true });

      paper.addEventListener("dblclick", (event) => {
        if (document.body.classList.contains("tools-hidden")) return;
        const target = event.target.closest("[data-edit-index][data-edit-field]");
        if (target) startInlineEdit(target);
      });

      const importJsonInput = document.getElementById("import-json-input");
      document.getElementById("import-json").addEventListener("click", () => importJsonInput.click());
      importJsonInput.addEventListener("change", async () => {
        await importJson(importJsonInput.files[0]);
        importJsonInput.value = "";
      });
      document.getElementById("edit-json").addEventListener("click", openJsonEditor);
      document.getElementById("apply-json").addEventListener("click", applyJsonEditor);
      document.getElementById("close-json").addEventListener("click", closeJsonEditor);
      jsonModal.addEventListener("click", (event) => {
        if (event.target === jsonModal) closeJsonEditor();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !jsonModal.hidden) closeJsonEditor();
      });

      document.getElementById("add-question").addEventListener("click", () => addQuestion(false));
      document.getElementById("add-part").addEventListener("click", () => addQuestion(true));
      document.getElementById("print-paper").addEventListener("click", () => window.print());
      document.getElementById("download-paper").addEventListener("click", downloadPaper);
      document.getElementById("download-json").addEventListener("click", downloadJson);
      document.getElementById("save-questions").addEventListener("click", downloadJson);
      document.getElementById("copy-ai-template").addEventListener("click", copyAiTemplate);
      document.getElementById("reset-paper").addEventListener("click", resetPaper);
      document.getElementById("clear-paper").addEventListener("click", clearPaper);

      paperTitleInput.value = pageData.title;
      if (uiSettings.theme) pageData.theme = getThemeId(uiSettings.theme);
      renderThemes();
      renderTabs();
      renderEditor();
      renderPreview();
      restoreUiScrollPositions();
      requestAnimationFrame(() => requestAnimationFrame(reapplyPreviewZoom));

      const requestedFile = new URLSearchParams(window.location.search).get("file");
      if (requestedFile) {
        fetch(`lessions%20json/${encodeURIComponent(requestedFile)}`)
          .then(response => response.ok ? response.json() : Promise.reject(new Error("Unable to load file")))
          .then(data => {
            const imported = normalizePageData(data);
            if (uiSettings.theme) imported.theme = getThemeId(uiSettings.theme);
            openPageInTab(imported, requestedFile);
            paperTitleInput.value = pageData.title;
            renderTabs();
            renderEditor();
            renderPreview();
            saveDocState();
            window.history.replaceState({}, "", window.location.pathname);
            requestAnimationFrame(() => requestAnimationFrame(reapplyPreviewZoom));
          })
          .catch(error => console.error("Question file could not be loaded:", error));
      }
