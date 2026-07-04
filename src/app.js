import { localAssetSeeds } from "./assets.js";
import { mountScreenplayEditorHost } from "./opendraft/mountHost.js";
import { extractSceneNavigation } from "./opendraft/navigation.js";
import { createPersonalScreenwriter } from "./sdk.js";
import "./styles.css";

const STORAGE_KEY = "personal-screenwriter.project.v1";
const LIBRARY_KEY = "personal-screenwriter.library.v1";

const defaultProject = {
  title: "星轨试写",
  fountain: `Title: 星轨试写
Author: Personal Screenwriter

INT. 作家房间 - NIGHT

编剧
我们不再从空白页开始。

EXT. 天台 - DAWN

导演
让剧本自己长出场景、人物和镜头。`,
  bible: {
    characters: [
      { name: "编剧", role: "主创", goal: "把散落资料变成可执行剧本" },
      { name: "导演", role: "视觉判断", goal: "把场景转成镜头和调度" },
    ],
    locations: [{ name: "作家房间", notes: "独立产品的起点，写作资料在这里汇合" }],
    props: [{ name: "资料卡片", notes: "模板、工作流、场次规则和导出文件都可在这里汇合" }],
    rules: [{ name: "轻量工作台", notes: "浏览器本地保存，导出由用户主动触发" }],
  },
  assets: localAssetSeeds.slice(0, 24),
  writingType: "screenplay",
};

const saved = loadProject();
const savedLibrary = loadLibrary();
let projectLibrary = savedLibrary.projects.length ? savedLibrary : savedLibrary.save(saved || defaultProject);
const activeLibraryItem = projectLibrary.select(projectLibrary.activeProjectId);
projectLibrary = activeLibraryItem.library;
const studio = createPersonalScreenwriter({ project: activeLibraryItem.project });
const defaultWorkbench = studio.getWritingWorkbenchDefaults(activeLibraryItem.project.writingType || "screenplay");

const state = {
  activeTab: "doctor",
  assetFilter: "",
  projectFilter: "",
  aiTask: defaultWorkbench.aiTask,
  doctorReport: null,
  rewriteDraft: null,
  textQualityReport: null,
  selectedTemplateIds: defaultWorkbench.selectedTemplateIds,
  selectedWorkflowId: defaultWorkbench.selectedWorkflowId,
  selectedVersionId: "",
  compareTargetVersionId: "",
  sceneNavigation: [],
};

let screenplayHost = null;
let relationWallUnmount = null;

const app = document.querySelector("#app");
render();
studio.subscribe(() => renderDynamic());

function render() {
  const { project } = studio.getState();
  const writingType = project.writingType || "screenplay";
  const writingConfig = studio.getWritingTypeConfig(writingType);
  app.innerHTML = `
    <main class="shell professional-shell">
      <aside class="rail project-database">
        <div class="brand">
          <span class="brand-mark">剧</span>
          <div>
            <strong>Screenwriter Studio</strong>
            <small>剧本数据库 · AI 编剧室 · 制作预备</small>
          </div>
        </div>
        <section class="panel compact project-panel">
          <div class="panel-title">剧本数据库</div>
          <input id="projectTitle" class="input" aria-label="项目名" />
          <div class="type-switch" role="tablist" aria-label="写作类型">
            <button class="type-pill ${writingType === "screenplay" ? "active" : ""}" data-writing-type="screenplay">剧本</button>
            <button class="type-pill ${writingType === "literary-screenplay" ? "active" : ""}" data-writing-type="literary-screenplay">文学剧本</button>
          </div>
          <div class="project-meta">
            <span class="badge soft">${escapeHtml(writingConfig.navigationLabel)}</span>
            <small>${escapeHtml(writingConfig.aiFocus.join(" / "))}</small>
          </div>
          <div class="button-grid">
            <button id="saveProject" class="button primary">保存</button>
            <button id="snapshotProject" class="button">快照</button>
            <button id="checkinProject" class="button">Check-in</button>
            <button id="newProject" class="button">新建</button>
            <button id="importProject" class="button">导入</button>
            <button id="exportJson" class="button">JSON</button>
            <button id="importLibrary" class="button">导入库</button>
            <button id="exportLibrary" class="button">导出库</button>
          </div>
          <input id="projectFilter" class="input" placeholder="搜索项目" />
          <div id="projectList" class="project-list"></div>
          <input id="fileInput" type="file" accept=".fountain,.txt,.json,.fdx" hidden />
          <input id="libraryFileInput" type="file" accept=".json" hidden />
        </section>
        <section class="panel asset-panel">
          <div class="panel-heading">
            <div>
              <div class="panel-title">对象库</div>
              <small>Characters / Locations / Props / Beats / Assets</small>
            </div>
            <span id="assetCount" class="badge"></span>
          </div>
          <div class="button-grid tight">
            <button id="copyVisualPack" class="button">复制视觉包</button>
            <button id="downloadVisualPack" class="button">下载视觉包</button>
          </div>
          <input id="assetFilter" class="input" placeholder="搜索：人物、剧本、skill、分镜" />
          <div id="assetList" class="asset-list"></div>
        </section>
      </aside>

      <section class="writer">
        <div class="writer-head">
          <div class="toolbar">
            <div>
              <div class="eyebrow">Professional screenplay workbench</div>
              <h1>${escapeHtml(writingConfig.editorTitle)}</h1>
              <small>分页剧本、场景大纲、人物地点道具和 AI 会诊共用同一份剧本上下文。</small>
            </div>
            <div class="toolbar-actions">
              <button id="exportFountain" class="icon-button" title="导出 Fountain">Fountain</button>
              <button id="exportFdx" class="icon-button" title="导出 Final Draft XML">FDX</button>
              <button id="copyPrompt" class="icon-button" title="复制 AI 任务包">复制 AI 包</button>
            </div>
          </div>
          <div class="focus-strip">
            ${writingConfig.aiFocus.map((item) => `<span class="focus-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>
        <div id="screenplayHost" class="screenplay-host-shell"></div>
      </section>

      <aside class="inspector script-doctor">
        <section class="panel stats">
          <div class="panel-title">Script Doctor</div>
          <div id="statsGrid" class="stats-grid"></div>
        </section>
        <section class="panel">
          <div class="tabs">
            <button class="tab ${state.activeTab === "doctor" ? "active" : ""}" data-tab="doctor">诊断</button>
            <button class="tab ${state.activeTab === "explore" ? "active" : ""}" data-tab="explore">探索</button>
            <button class="tab ${state.activeTab === "bible" ? "active" : ""}" data-tab="bible">Bible</button>
            <button class="tab ${state.activeTab === "scenes" ? "active" : ""}" data-tab="scenes">场次</button>
            <button class="tab ${state.activeTab === "shotplan" ? "active" : ""}" data-tab="shotplan">Shot Plan</button>
            <button class="tab ${state.activeTab === "versions" ? "active" : ""}" data-tab="versions">版本</button>
            <button class="tab ${state.activeTab === "sdk" ? "active" : ""}" data-tab="sdk">接入</button>
          </div>
          <div id="tabContent"></div>
        </section>
      </aside>
    </main>
  `;

  bindEvents();
  renderDynamic();
}

function bindEvents() {
  const title = document.querySelector("#projectTitle");
  const fileInput = document.querySelector("#fileInput");
  const libraryFileInput = document.querySelector("#libraryFileInput");

  title.addEventListener("change", () => {
    const { project } = studio.getState();
    studio.setProject({ ...project, title: title.value });
    persist();
  });

  document.querySelector("#saveProject").addEventListener("click", () => {
    persist();
    flash("已保存到项目库");
  });

  document.querySelector("#snapshotProject").addEventListener("click", () => {
    const label = `快照 ${new Date().toLocaleString("zh-CN", { hour12: false })}`;
    studio.createVersionSnapshot(label);
    persist();
    state.activeTab = "versions";
    flash("已保存版本快照");
    render();
  });

  document.querySelector("#checkinProject").addEventListener("click", () => {
    const message = window.prompt("输入本次版本说明", "完成当前改写");
    if (!message) return;
    studio.checkInVersion(message, "编剧");
    persist();
    state.activeTab = "versions";
    flash("已完成版本 check-in");
    render();
  });

  document.querySelector("#newProject").addEventListener("click", () => {
    studio.setProject({ ...defaultProject, id: `psw-${Date.now()}`, title: "未命名新剧本" });
    applyWorkbenchDefaults(defaultProject.writingType || "screenplay");
    state.doctorReport = null;
    persist();
    render();
  });

  document.querySelector("#importProject").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    studio.importProject(await file.text());
    persist();
    state.doctorReport = null;
    fileInput.value = "";
  });

  document.querySelector("#exportLibrary").addEventListener("click", () => {
    projectLibrary = projectLibrary.save(studio.getState().project);
    download("screenwriter-library.json", studio.serializeProjectLibrary(projectLibrary), "application/json");
    persist();
  });
  document.querySelector("#importLibrary").addEventListener("click", () => libraryFileInput.click());
  libraryFileInput.addEventListener("change", async () => {
    const file = libraryFileInput.files?.[0];
    if (!file) return;
    projectLibrary = studio.importProjectLibrary(await file.text());
    const next = projectLibrary.select(projectLibrary.activeProjectId);
    projectLibrary = next.library;
    studio.setProject(next.project);
    applyWorkbenchDefaults(next.project.writingType || "screenplay");
    state.doctorReport = null;
    libraryFileInput.value = "";
    persist();
    render();
    flash("项目库已导入");
  });
  document.querySelector("#exportJson").addEventListener("click", () => download("screenwriter-project.json", studio.exportJson(), "application/json"));
  document.querySelector("#exportFountain").addEventListener("click", () => download("screenplay.fountain", studio.exportFountain(), "text/plain"));
  document.querySelector("#exportFdx").addEventListener("click", () => download("screenplay.fdx", studio.exportFdx(), "application/xml"));
  document.querySelector("#copyPrompt").addEventListener("click", copyAiPacket);
  document.querySelector("#projectFilter").addEventListener("input", (event) => {
    state.projectFilter = event.target.value;
    renderProjects();
  });
  document.querySelector("#projectList").addEventListener("click", (event) => {
    const row = event.target.closest("[data-project-id]");
    if (!row) return;
    const projectId = row.dataset.projectId;
    projectLibrary = event.target.closest(".delete-project") ? projectLibrary.delete(projectId) : projectLibrary.select(projectId).library;
    const next = projectLibrary.select(projectLibrary.activeProjectId);
    projectLibrary = next.library;
    studio.setProject(next.project);
    applyWorkbenchDefaults(next.project.writingType || "screenplay");
    state.doctorReport = null;
    persist();
    render();
  });
  document.querySelectorAll("[data-writing-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextWritingType = button.dataset.writingType || "screenplay";
      const { project } = studio.getState();
      if ((project.writingType || "screenplay") === nextWritingType) return;
      studio.setProject({ ...project, writingType: nextWritingType });
      applyWorkbenchDefaults(nextWritingType);
      persist();
      render();
    });
  });

  document.querySelector("#assetFilter").addEventListener("input", (event) => {
    state.assetFilter = event.target.value;
    renderAssets();
  });
  document.querySelector("#copyVisualPack").addEventListener("click", async () => {
    const pack = studio.buildVisualDevelopmentPack();
    await navigator.clipboard?.writeText(pack.markdown);
    flash("视觉开发包已复制");
  });
  document.querySelector("#downloadVisualPack").addEventListener("click", () => {
    const pack = studio.buildVisualDevelopmentPack();
    download(`${studio.getState().project.title}-visual-pack.md`, pack.markdown, "text/markdown");
  });

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      if (state.activeTab === "shotplan") {
        const { project } = studio.getState();
        if (!project.shotPlan?.shots?.length && project.parsed.scenes.length) {
          studio.generateShotPlan();
          persist();
        }
      }
      document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === button));
      renderTab();
    });
  });
}

function renderDynamic() {
  const { project, summary } = studio.getState();
  const title = document.querySelector("#projectTitle");

  if (document.activeElement !== title) title.value = project.title;
  mountOrUpdateScreenplayHost(project);
  if (!state.sceneNavigation.length) {
    state.sceneNavigation = extractSceneNavigation(project.screenplayDoc);
  }

  document.querySelector("#statsGrid").innerHTML = [
    ["Scenes", summary.sceneCount],
    ["Characters", summary.characterCount],
    ["Locations", summary.locationCount],
    ["Beats", summary.beatCount],
    ["Frames", summary.frameCount],
    ["Relations", summary.relationCount],
  ]
    .map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`)
    .join("");

  renderAssets();
  renderProjects();
  renderTab();
}

function renderProjects() {
  const { project } = studio.getState();
  const filter = state.projectFilter.trim().toLowerCase();
  const projects = projectLibrary.projects.filter((item) => !filter || `${item.title} ${item.writingType}`.toLowerCase().includes(filter));
  document.querySelector("#projectList").innerHTML = projects
    .map((item) => {
      const sceneCount = item.parsed?.scenes?.length || 0;
      return `
        <button class="project-row ${item.id === project.id ? "active" : ""}" data-project-id="${escapeHtml(item.id)}">
          <span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.writingType || "screenplay")} · ${sceneCount} 场</small>
          </span>
          <span class="delete-project" title="删除">×</span>
        </button>
      `;
    })
    .join("");
}

function renderAssets() {
  const { project } = studio.getState();
  const filter = state.assetFilter.trim().toLowerCase();
  const catalog = studio.buildProjectCatalog(project);
  catalog.Assets = [...catalog.Assets, ...localAssetSeeds]
    .filter((asset, index, list) => list.findIndex((item) => item.path === asset.path) === index)
    .slice(0, 40);
  const groups = ["Scenes", "Characters", "Props", "Locations", "Assets"];
  const total = groups.reduce((sum, group) => sum + catalog[group].length, 0);
  document.querySelector("#assetCount").textContent = `${total}`;
  document.querySelector("#assetList").innerHTML = groups
    .map((group) => {
      const items = catalog[group].filter((item) => !filter || `${item.name || item.label} ${item.notes || ""} ${item.path || ""}`.toLowerCase().includes(filter)).slice(0, 18);
      return `
        <div class="asset-group">
          <div class="asset-group-title">${group}<span>${items.length}</span></div>
          ${items.map((item) => `
            <button class="asset" data-path="${escapeHtml(item.path || item.name || item.label || "")}">
              <span>${escapeHtml(item.name || item.label || "未命名")}</span>
              <small>${escapeHtml(item.notes || item.path || item.category || group)}</small>
            </button>
          `).join("")}
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".asset").forEach((button) => {
    button.addEventListener("click", () => {
      navigator.clipboard?.writeText(button.dataset.path);
      flash("已复制资料标识");
    });
  });
}

function renderDoctorReport(report) {
  const actions = report.actions || [];
  return `
    <article>
      <strong>${escapeHtml(report.summary)}</strong>
      <ul>${report.findings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <div class="panel-title">下一步</div>
      <div class="doctor-action-list">
        ${actions.map((action) => `
          <label class="doctor-action ${action.done ? "done" : ""}" data-action-id="${escapeHtml(action.id)}">
            <input type="checkbox" ${action.done ? "checked" : ""} />
            <span>${escapeHtml(action.text)}</span>
            <button type="button" class="button draft-action">生成草案</button>
            <button type="button" class="button send-action">发送到任务</button>
          </label>
        `).join("")}
      </div>
    </article>
  `;
}

function renderTab() {
  relationWallUnmount?.();
  relationWallUnmount = null;
  const { project } = studio.getState();
  const content = document.querySelector("#tabContent");

  if (state.activeTab === "doctor") {
    const templates = studio.getKnowledgeTemplates();
    const presets = studio.getAiTaskPresets();
    const workflows = studio.getWorkflowPresets();
    const report = state.doctorReport || (project.doctorActions?.length ? { ...studio.generateScriptDoctorReport(), actions: project.doctorActions } : null);
    const activeWorkflow = workflows.find((workflow) => workflow.id === state.selectedWorkflowId) || workflows[0];
    const doctorMeta = getDoctorWorkbenchMeta(project.writingType || "screenplay", activeWorkflow, state.selectedTemplateIds, templates);
    const packet = studio.buildAiPacket({
      task: state.aiTask,
      templateIds: state.selectedTemplateIds,
    });
    content.innerHTML = `
      ${doctorMeta.header}
      <label class="field-label">成品工作流</label>
      <div class="workflow-list">
        ${workflows
          .map(
            (workflow) => `
              <button class="workflow-card ${workflow.id === activeWorkflow?.id ? "active" : ""}" data-workflow-id="${escapeHtml(workflow.id)}">
                <strong>${escapeHtml(workflow.title)}</strong>
                <span>${escapeHtml(workflow.description)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
      ${
        activeWorkflow
          ? `
            <div class="workflow-panel">
              <div class="workflow-header">
                <div>
                  <div class="panel-title">当前工作流</div>
                  <strong>${escapeHtml(activeWorkflow.title)}</strong>
                  <small>${escapeHtml(activeWorkflow.source)}</small>
                </div>
              </div>
              <div class="workflow-stages">
                ${activeWorkflow.stages
                  .map(
                    (stage, index) => `
                      <button class="workflow-stage" data-stage-task-id="${escapeHtml(stage.taskPresetId)}">
                        <em>Step ${index + 1}</em>
                        <strong>${escapeHtml(stage.title)}</strong>
                        <span>${escapeHtml(stage.goal)}</span>
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          `
          : ""
      }
      <label class="field-label">常用任务</label>
      <div class="preset-list">
        ${presets
          .map(
            (preset) => `
              <button class="preset-button" data-preset-id="${escapeHtml(preset.id)}">
                ${escapeHtml(preset.title)}
              </button>
            `,
          )
          .join("")}
      </div>
      <label class="field-label" for="aiTask">AI 任务</label>
      <textarea id="aiTask" class="mini-editor">${escapeHtml(state.aiTask)}</textarea>
      <label class="field-label">方法模板</label>
      <div class="template-list">
        ${templates
          .map(
            (template) => `
              <label class="template-choice">
                <input type="checkbox" value="${escapeHtml(template.id)}" ${
                  state.selectedTemplateIds.includes(template.id) ? "checked" : ""
                } />
                <span>${escapeHtml(template.title)}</span>
                <small>${escapeHtml(template.source)}</small>
              </label>
            `,
          )
          .join("")}
      </div>
      ${doctorMeta.footer}
      <div class="doctor-actions">
        <button id="runDoctor" class="button primary">一键生成诊断</button>
        <button id="copyDoctor" class="button" ${report ? "" : "disabled"}>复制诊断</button>
        <button id="runQuality" class="button">生成质检</button>
        <button id="copyQuality" class="button" ${state.textQualityReport ? "" : "disabled"}>复制质检</button>
        <button id="copyDelivery" class="button">复制交付包</button>
        <button id="downloadDelivery" class="button">下载交付包</button>
      </div>
      <div id="doctorReport" class="doctor-report">
        ${report ? renderDoctorReport(report) : `<p class="empty">点击“一键生成诊断”，基于当前剧本、人物、地点和对白生成可执行改写清单。</p>`}
      </div>
      ${
        state.rewriteDraft
          ? `
            <div class="rewrite-draft">
              <div class="section-head">
                <div>
                  <small>Rewrite draft</small>
                  <strong>${escapeHtml(state.rewriteDraft.title)}</strong>
                </div>
                <button id="sendDraft" class="button">发送草案任务</button>
              </div>
              <textarea class="prompt-output" readonly>${escapeHtml(state.rewriteDraft.prompt)}</textarea>
            </div>
          `
          : ""
      }
      ${
        state.textQualityReport
          ? `
            <div class="rewrite-draft text-quality-report">
              <div class="section-head">
                <div>
                  <small>Text Quality Report</small>
                  <strong>${escapeHtml(state.textQualityReport.title)}</strong>
                </div>
              </div>
              <textarea class="prompt-output" readonly>${escapeHtml(state.textQualityReport.markdown)}</textarea>
            </div>
          `
          : ""
      }
      <label class="field-label">可复制任务包</label>
      <textarea class="prompt-output" readonly>${escapeHtml(packet.prompt)}</textarea>
    `;
    document.querySelector("#runDoctor").addEventListener("click", () => {
      state.doctorReport = studio.generateScriptDoctorReport();
      studio.setProject({ ...studio.getState().project, doctorActions: state.doctorReport.actions });
      persist();
      renderTab();
    });
    document.querySelector("#copyDoctor")?.addEventListener("click", async () => {
      if (!report) return;
      await navigator.clipboard?.writeText(report.markdown);
      flash("诊断已复制");
    });
    document.querySelector("#runQuality")?.addEventListener("click", () => {
      state.textQualityReport = studio.buildTextQualityReport();
      flash("文本质检已生成");
      renderTab();
    });
    document.querySelector("#copyQuality")?.addEventListener("click", async () => {
      if (!state.textQualityReport) return;
      await navigator.clipboard?.writeText(state.textQualityReport.markdown);
      flash("质检已复制");
    });
    document.querySelector("#copyDelivery")?.addEventListener("click", async () => {
      const delivery = studio.buildDeliveryPacket();
      await navigator.clipboard?.writeText(delivery.markdown);
      flash("交付包已复制");
    });
    document.querySelector("#downloadDelivery")?.addEventListener("click", () => {
      const delivery = studio.buildDeliveryPacket();
      download(delivery.filename, delivery.markdown, "text/markdown");
    });
    document.querySelectorAll(".doctor-action").forEach((row) => {
      row.querySelector("input")?.addEventListener("change", (event) => {
        studio.updateDoctorAction(row.dataset.actionId, { done: event.target.checked });
        state.doctorReport = null;
        persist();
        renderTab();
      });
      row.querySelector(".send-action")?.addEventListener("click", () => {
        const action = (report?.actions || []).find((item) => item.id === row.dataset.actionId);
        if (!action) return;
        state.aiTask = action.prompt;
        flash("已发送到 AI 任务");
        renderTab();
      });
      row.querySelector(".draft-action")?.addEventListener("click", () => {
        const action = (report?.actions || []).find((item) => item.id === row.dataset.actionId);
        if (!action) return;
        state.rewriteDraft = studio.generateRewriteDraft(action);
        flash("已生成改写草案");
        renderTab();
      });
    });
    document.querySelector("#sendDraft")?.addEventListener("click", () => {
      if (!state.rewriteDraft) return;
      state.aiTask = state.rewriteDraft.prompt;
      flash("草案任务已发送");
      renderTab();
    });
    document.querySelector("#aiTask").addEventListener("input", (event) => {
      state.aiTask = event.target.value;
      renderTab();
    });
    document.querySelectorAll(".workflow-card").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedWorkflowId = button.dataset.workflowId;
        renderTab();
      });
    });
    document.querySelectorAll(".workflow-stage").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = presets.find((item) => item.id === button.dataset.stageTaskId);
        if (!preset) return;
        state.aiTask = preset.task;
        state.selectedTemplateIds = preset.templateIds;
        renderTab();
      });
    });
    document.querySelectorAll(".preset-button").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = presets.find((item) => item.id === button.dataset.presetId);
        if (!preset) return;
        state.aiTask = preset.task;
        state.selectedTemplateIds = preset.templateIds;
        renderTab();
      });
    });
    document.querySelectorAll(".template-choice input").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        state.selectedTemplateIds = [...document.querySelectorAll(".template-choice input:checked")].map((item) => item.value);
        renderTab();
      });
    });
    return;
  }

  if (state.activeTab === "bible") {
    content.innerHTML = `
      ${renderBibleSection("characters", "人物", project.bible.characters)}
      ${renderBibleSection("locations", "地点", project.bible.locations)}
      ${renderBibleSection("props", "道具/资产", project.bible.props)}
      ${renderBibleSection("rules", "世界规则", project.bible.rules)}
    `;
    return;
  }

  if (state.activeTab === "explore") {
    const board = studio.buildBreakdownBoard();
    const explorer = studio.buildStoryExplorer();
    content.innerHTML = `
      <div class="explorer">
        <section class="breakdown-board">
          <div class="section-head">
            <div>
              <small>关系墙 / Breakdown board</small>
              <strong>按场景拆人物、地点、节拍和对象</strong>
            </div>
            <span class="badge soft">${board.relationships.edges.length} links</span>
          </div>
          <div class="breakdown-grid">
            ${board.scenes
              .map(
                (scene) => `
                  <article class="breakdown-card">
                    <small>${scene.index} · ${escapeHtml(scene.location || "未标地点")} ${scene.time ? "· " + escapeHtml(scene.time) : ""}</small>
                    <strong>${escapeHtml(scene.heading)}</strong>
                    <div class="relation-pills">
                      ${(scene.characters.length ? scene.characters : ["待标人物"])
                        .map((name) => `<span>${escapeHtml(name)}</span>`)
                        .join("")}
                    </div>
                    <em>${scene.beatCount} beats</em>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
        <div class="explorer-passages">
          ${explorer.passages
            .map(
              (passage) => `
                <article class="explorer-passage">
                  <small>${escapeHtml(passage.location || "章节")}</small>
                  <strong>${escapeHtml(passage.title)}</strong>
                  <p>${escapeHtml(passage.text)}</p>
                  <div class="choice-list">
                    ${
                      passage.choices.length
                        ? passage.choices.map((choice) => `<button class="choice-chip">${escapeHtml(choice.label)}</button>`).join("")
                        : `<span class="badge soft">终点</span>`
                    }
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
        <div class="clue-strip">
          ${explorer.clues
            .map(
              (clue) => `
                <article class="clue-card">
                  <small>${escapeHtml(clue.type)}</small>
                  <strong>${escapeHtml(clue.title)}</strong>
                  <span>${escapeHtml(clue.notes)}</span>
                </article>
              `,
            )
            .join("") || `<p class="empty">Story Bible 里还没有线索卡。</p>`}
        </div>
        <div id="relationWallHost" class="relation-wall"></div>
        <div class="edge-list">
          ${explorer.relationships.edges
            .slice(0, 12)
            .map((edge) => `<small>${escapeHtml(edge.source.replace("character:", ""))} -> ${escapeHtml(edge.target.replace("scene:", ""))}</small>`)
            .join("")}
        </div>
      </div>
    `;
    const relationWallHost = document.querySelector("#relationWallHost");
    if (relationWallHost) {
      import("./relationWall.js").then(({ mountRelationshipWall }) => {
        if (!relationWallHost.isConnected) return;
        relationWallUnmount = mountRelationshipWall(relationWallHost, explorer.relationships);
      });
    }
    return;
  }

  if (state.activeTab === "scenes") {
    content.innerHTML = `
      <div class="scene-list">
        ${(state.sceneNavigation.length ? state.sceneNavigation : project.parsed.scenes)
          .map(
            (scene) => `
              <article class="scene-card">
                <strong>${scene.index}. ${escapeHtml(scene.title || scene.heading)}</strong>
                <span>${escapeHtml(scene.location || "")} ${scene.time ? "· " + escapeHtml(scene.time) : ""}</span>
                ${scene.synopsis ? `<p>${escapeHtml(scene.synopsis)}</p>` : ""}
              </article>
            `,
          )
          .join("")}
      </div>
    `;
    return;
  }

  if (state.activeTab === "shotplan") {
    const shotPlan = project.shotPlan || { shots: [], updatedAt: "" };
    const shotSummary = studio.summarizeShotPlan();
    content.innerHTML = `
      <div class="shotplan-toolbar">
        <button class="button" id="regenerateShotPlan">按场次重建</button>
        <button class="button" id="addShotPlanRow">新增镜头</button>
        <small>${shotSummary.shotCount} 个镜头 · ${shotSummary.totalDuration} 秒</small>
      </div>
      <div class="shotplan-table">
        <div class="shotplan-head">
          <span>镜头</span>
          <span>场景</span>
          <span>景别</span>
          <span>机位</span>
          <span>运镜</span>
          <span>时长</span>
          <span>目的</span>
          <span>画面/备注</span>
          <span>对白/声音</span>
          <span>操作</span>
        </div>
        ${
          shotPlan.shots.length
            ? shotPlan.shots
                .map(
                  (shot) => `
                    <div class="shotplan-row" data-shot-id="${escapeHtml(shot.id)}">
                      <span>${escapeHtml(String(shot.shotNumber))}</span>
                      <span>${escapeHtml(shot.sceneHeading || "未绑定场景")}</span>
                      <input class="shot-input" data-field="shotSize" value="${escapeHtml(shot.shotSize)}" />
                      <input class="shot-input" data-field="cameraAngle" value="${escapeHtml(shot.cameraAngle)}" />
                      <input class="shot-input" data-field="movement" value="${escapeHtml(shot.movement)}" />
                      <input class="shot-input" data-field="duration" type="number" min="1" value="${escapeHtml(String(shot.duration))}" />
                      <textarea class="shot-textarea" data-field="goal">${escapeHtml(shot.goal)}</textarea>
                      <div class="shot-stack">
                        <textarea class="shot-textarea" data-field="visual" placeholder="画面">${escapeHtml(shot.visual)}</textarea>
                        <textarea class="shot-textarea" data-field="notes" placeholder="备注">${escapeHtml(shot.notes)}</textarea>
                      </div>
                      <div class="shot-stack">
                        <textarea class="shot-textarea" data-field="dialogue" placeholder="对白">${escapeHtml(shot.dialogue)}</textarea>
                        <textarea class="shot-textarea" data-field="sound" placeholder="声音">${escapeHtml(shot.sound)}</textarea>
                      </div>
                      <button class="button delete-shotplan-row">删除</button>
                    </div>
                  `,
                )
                .join("")
            : `<p class="empty">还没有镜头规划。先写场景标题，再点击“按场次重建”。</p>`
        }
      </div>
      <div class="shotplan-timeline">
        ${shotPlan.shots
          .map(
            (shot) => `
              <article class="timeline-chip">
                <strong>${escapeHtml(String(shot.shotNumber).padStart(2, "0"))} · ${escapeHtml(shot.shotSize)}</strong>
                <span>${escapeHtml(shot.sceneHeading || "未绑定场景")}</span>
                <small>${escapeHtml(String(shot.duration))}s · ${escapeHtml(shot.movement)}</small>
              </article>
            `,
          )
          .join("")}
      </div>
    `;

    document.querySelector("#regenerateShotPlan").addEventListener("click", () => {
      studio.generateShotPlan();
      persist();
      flash("已按场次重建 Shot Plan");
    });

    document.querySelector("#addShotPlanRow").addEventListener("click", () => {
      studio.addShotPlanShot(project.parsed.scenes[0]?.id || null);
      persist();
      flash("已新增镜头行");
    });

    document.querySelectorAll(".shotplan-row").forEach((row) => {
      const shotId = row.dataset.shotId;
      row.querySelectorAll(".shot-input, .shot-textarea").forEach((field) => {
        field.addEventListener("change", () => {
          const patch = field.dataset.field === "duration"
            ? { [field.dataset.field]: Number(field.value || 0) }
            : { [field.dataset.field]: field.value };
          studio.updateShotPlanShot(shotId, patch);
          persist();
        });
      });
      row.querySelector(".delete-shotplan-row")?.addEventListener("click", () => {
        studio.deleteShotPlanShot(shotId);
        persist();
        flash("已删除镜头行");
      });
    });
    return;
  }

  if (state.activeTab === "versions") {
    const versions = project.versions || [];
    const selectedId = state.selectedVersionId || versions[0]?.id || "";
    const compareId = state.compareTargetVersionId || versions[1]?.id || "";
    const diff = selectedId && compareId ? studio.compareVersions(compareId, selectedId) : null;
    content.innerHTML = `
      <div class="version-compare-bar">
        <select id="fromVersionSelect" class="input">
          ${versions.map((version) => `<option value="${escapeHtml(version.id)}" ${version.id === compareId ? "selected" : ""}>对比基线 · ${escapeHtml(version.label)}</option>`).join("")}
        </select>
        <select id="toVersionSelect" class="input">
          ${versions.map((version) => `<option value="${escapeHtml(version.id)}" ${version.id === selectedId ? "selected" : ""}>当前查看 · ${escapeHtml(version.label)}</option>`).join("")}
        </select>
      </div>
      <div class="version-list">
        ${
          versions.length
            ? versions
                .map(
                  (version) => `
                    <article class="version-card">
                      <div>
                        <strong>${escapeHtml(version.label)}</strong>
                        <span>${escapeHtml(new Date(version.createdAt).toLocaleString("zh-CN", { hour12: false }))}</span>
                      </div>
                      <small>${escapeHtml(version.kind || "snapshot")} · ${version.summary.sceneCount} 场 · ${version.summary.characterCount} 人物 · ${version.summary.wordCount} 字</small>
                      <button class="button restore-version" data-version-id="${escapeHtml(version.id)}">恢复</button>
                    </article>
                  `,
                )
                .join("")
            : `<p class="empty">还没有快照。点击左侧“快照”保存当前版本。</p>`
        }
      </div>
      ${
        diff
          ? `
            <div class="version-diff-card">
              <strong>${escapeHtml(diff.summary)}</strong>
              <div class="diff-columns">
                <div>
                  <div class="field-label">新增</div>
                  ${(diff.added.length ? diff.added : ["无"]).map((line) => `<p class="diff-line added">${escapeHtml(line)}</p>`).join("")}
                </div>
                <div>
                  <div class="field-label">删除</div>
                  ${(diff.removed.length ? diff.removed : ["无"]).map((line) => `<p class="diff-line removed">${escapeHtml(line)}</p>`).join("")}
                </div>
              </div>
            </div>
          `
          : ""
      }
    `;
    document.querySelector("#fromVersionSelect")?.addEventListener("change", (event) => {
      state.compareTargetVersionId = event.target.value;
      renderTab();
    });
    document.querySelector("#toVersionSelect")?.addEventListener("change", (event) => {
      state.selectedVersionId = event.target.value;
      renderTab();
    });
    document.querySelectorAll(".restore-version").forEach((button) => {
      button.addEventListener("click", () => {
        studio.restoreVersion(button.dataset.versionId);
        persist();
        flash("已恢复版本");
      });
    });
    return;
  }

  content.innerHTML = `
    <div class="sdk-box">
      <p>这个产品不是 StarCanvas 专属模块。任何应用可以通过浏览器全局对象或 ES module 接入。</p>
      <pre><code>import { createPersonalScreenwriter } from "./src/sdk.js";

const writer = createPersonalScreenwriter();
writer.setFountain("INT. 房间 - NIGHT\\n\\n人物\\n对白");
writer.checkInVersion("第一稿");
writer.generateShotPlan();
const packet = writer.buildAiPacket("诊断第一幕");</code></pre>
    </div>
  `;
}

function getDoctorWorkbenchMeta(writingType, activeWorkflow, selectedTemplateIds, templates) {
  if (writingType !== "literary-screenplay") {
    return { header: "", footer: "" };
  }

  const selected = templates.filter((template) => selectedTemplateIds.includes(template.id));
  const adaptationSignals = [
    ["改编路径", activeWorkflow?.title || "小说改编电影"],
    ["结构主线", selected.some((item) => item.id === "structuralist-screenwriting") ? "主题/情境/布局" : "待补结构卡"],
    ["拉片校验", selected.some((item) => item.id === "film-perusal-method") ? "开场/发展/高潮/结尾" : "待补拉片卡"],
    ["对白动作", selected.some((item) => item.id === "verbal-action-dialogue") ? "潜文本/试探/反击" : "待补对白卡"],
  ];
  const sourceList = selected.length
    ? selected.map((item) => `<li>${escapeHtml(item.title)} · ${escapeHtml(item.source)}</li>`).join("")
    : `<li>还没有选中改编方法卡。</li>`;

  return {
    header: `
      <div class="adaptation-rail">
        <div class="adaptation-rail-head">
          <strong>电影改编台</strong>
          <small>把母本立场、电影任务、关键场面和对白行动压在同一诊断面板。</small>
        </div>
        <div class="adaptation-grid">
          ${adaptationSignals.map(([label, value]) => `
            <div class="adaptation-cell">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `,
    footer: `
      <div class="adaptation-sidecar">
        <label class="field-label">改编检查</label>
        <div class="adaptation-checklist">
          <div class="adaptation-check">母本立场是否明确，不只是把小说剧情压缩成梗概。</div>
          <div class="adaptation-check">电影任务是否拆清：开场、转折、高潮、结尾各承担什么银幕功能。</div>
          <div class="adaptation-check">关系、事件、环境是否共同施压，而不是只靠设定讲解。</div>
          <div class="adaptation-check">对白是否在争取、试探、误导、反击，而不是替原作做摘要。</div>
        </div>
        <label class="field-label">当前已挂卡源</label>
        <ul class="adaptation-source-list">${sourceList}</ul>
      </div>
    `,
  };
}

function renderBibleSection(key, title, items = []) {
  return `
    <div class="bible-section">
      <h3>${title}</h3>
      ${
        items.length
          ? items
              .map(
                (item) => `
                  <article class="bible-item">
                    <strong>${escapeHtml(item.name || "未命名")}</strong>
                    <span>${escapeHtml(item.role || item.goal || item.notes || "")}</span>
                  </article>
                `,
              )
              .join("")
          : `<p class="empty">暂无，后续可从星轨故事/星轨人生生成。</p>`
      }
    </div>
  `;
}

async function copyAiPacket() {
  const packet = studio.buildAiPacket({
    task: state.aiTask,
    templateIds: state.selectedTemplateIds,
  });
  await navigator.clipboard?.writeText(JSON.stringify(packet, null, 2));
  flash("AI 任务包已复制");
}

function mountOrUpdateScreenplayHost(project) {
  const root = document.querySelector("#screenplayHost");
  if (!root) return;

  if (!screenplayHost) {
    screenplayHost = mountScreenplayEditorHost(root, {
      writingType: project.writingType,
      screenplayDoc: project.screenplayDoc,
      scriptNotes: project.scriptNotes,
      tagCategories: project.tagCategories,
      tagFieldMappings: project.tagFieldMappings,
      tags: project.tags,
      onChange({ screenplayDoc, navigation, scriptNotes, tagCategories, tagFieldMappings, tags }) {
        const { project: currentProject } = studio.getState();
        studio.setProject({
          ...currentProject,
          screenplayDoc,
          scriptNotes,
          tagCategories,
          tagFieldMappings,
          tags,
        });
        state.sceneNavigation = navigation;
        persist();
      },
    });
    return;
  }

  screenplayHost.update({
    writingType: project.writingType,
    screenplayDoc: project.screenplayDoc,
    scriptNotes: project.scriptNotes,
    tagCategories: project.tagCategories,
    tagFieldMappings: project.tagFieldMappings,
    tags: project.tags,
  });
}

function applyWorkbenchDefaults(writingType) {
  const defaults = studio.getWritingWorkbenchDefaults(writingType);
  state.aiTask = defaults.aiTask;
  state.selectedTemplateIds = defaults.selectedTemplateIds;
  state.selectedWorkflowId = defaults.selectedWorkflowId;
}

function persist() {
  projectLibrary = projectLibrary.save(studio.getState().project);
  localStorage.setItem(STORAGE_KEY, studio.exportJson());
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(projectLibrary));
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return createPersonalScreenwriter().createProjectLibrary(raw ? JSON.parse(raw) : {});
  } catch {
    return createPersonalScreenwriter().createProjectLibrary();
  }
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function flash(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
