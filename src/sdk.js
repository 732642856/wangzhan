import {
  addShotPlanShot,
  buildAiPacket,
  buildProjectCatalog,
  buildStoryExplorer,
  checkInVersion,
  compareVersions,
  createVersionSnapshot,
  createProjectLibrary,
  createProject,
  deleteShotPlanShot,
  exportFdx,
  exportFountain,
  generateShotPlan,
  generateScriptDoctorReport,
  getAiTaskPresets,
  getWritingTypeConfig,
  getKnowledgeTemplates,
  getWritingWorkbenchDefaults,
  getWorkflowPresets,
  importProject,
  parseFountain,
  restoreVersion,
  serializeProject,
  summarizeShotPlan,
  summarizeProject,
  updateDoctorAction,
  updateShotPlanShot,
} from "./core.js";

export function createPersonalScreenwriter(options = {}) {
  let project = createProject(options.project || {});
  const listeners = new Set();

  function emit() {
    const snapshot = getState();
    for (const listener of listeners) listener(snapshot);
  }

  function getState() {
    return {
      project,
      summary: summarizeProject(project),
    };
  }

  return {
    getState,
    buildProjectCatalog(project = getState().project) {
      return buildProjectCatalog(project);
    },
    createProjectLibrary,
    generateScriptDoctorReport(project = getState().project) {
      return generateScriptDoctorReport(project);
    },
    updateDoctorAction(actionId, patch) {
      project = updateDoctorAction(project, actionId, patch);
      emit();
      return getState();
    },
    parseFountain,
    setFountain(fountain) {
      project = createProject({ ...project, fountain });
      emit();
      return getState();
    },
    setScreenplayDoc(screenplayDoc) {
      const { fountain, ...rest } = project;
      void fountain;
      project = createProject({ ...rest, screenplayDoc });
      emit();
      return getState();
    },
    setProject(nextProject) {
      project = createProject(nextProject);
      emit();
      return getState();
    },
    importProject(text) {
      project = importProject(text);
      emit();
      return getState();
    },
    updateBible(section, items) {
      project = createProject({
        ...project,
        bible: {
          ...project.bible,
          [section]: Array.isArray(items) ? items : [],
        },
      });
      emit();
      return getState();
    },
    addAssets(assets) {
      project = createProject({
        ...project,
        assets: [...(project.assets || []), ...(Array.isArray(assets) ? assets : [assets])],
      });
      emit();
      return getState();
    },
    exportFountain() {
      return exportFountain(project);
    },
    exportFdx() {
      return exportFdx(project);
    },
    exportJson() {
      return serializeProject(project);
    },
    buildAiPacket(task) {
      return buildAiPacket(project, task);
    },
    buildStoryExplorer() {
      return buildStoryExplorer(project);
    },
    checkInVersion(message, author) {
      project = checkInVersion(project, message, author);
      emit();
      return getState();
    },
    compareVersions(fromVersionId, toVersionId) {
      return compareVersions(project, fromVersionId, toVersionId);
    },
    getAiTaskPresets,
    getWritingTypeConfig,
    getKnowledgeTemplates,
    getWritingWorkbenchDefaults,
    getWorkflowPresets,
    generateShotPlan() {
      project = generateShotPlan(project);
      emit();
      return getState();
    },
    addShotPlanShot(sceneId) {
      project = addShotPlanShot(project, sceneId);
      emit();
      return getState();
    },
    updateShotPlanShot(shotId, patch) {
      project = updateShotPlanShot(project, shotId, patch);
      emit();
      return getState();
    },
    deleteShotPlanShot(shotId) {
      project = deleteShotPlanShot(project, shotId);
      emit();
      return getState();
    },
    summarizeShotPlan() {
      return summarizeShotPlan(project);
    },
    createVersionSnapshot(label) {
      project = createVersionSnapshot(project, label);
      emit();
      return getState();
    },
    restoreVersion(versionId) {
      project = restoreVersion(project, versionId);
      emit();
      return getState();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(getState());
      return () => listeners.delete(listener);
    },
  };
}

if (typeof window !== "undefined") {
  window.PersonalScreenwriter = {
    createPersonalScreenwriter,
    createProject,
    parseFountain,
    summarizeProject,
    exportFountain,
    exportFdx,
    buildAiPacket,
    checkInVersion,
    compareVersions,
    getAiTaskPresets,
    generateShotPlan,
    getKnowledgeTemplates,
    getWorkflowPresets,
    summarizeShotPlan,
  };
}
