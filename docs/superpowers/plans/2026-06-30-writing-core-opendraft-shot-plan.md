# Writing Core OpenDraft Shot Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the independent writing product with OpenDraft-style version check-in/diff/restore semantics and a text-only Shot Plan second page that prepares structured shot data for future StarCanvas handoff.

**Architecture:** Keep the product as a local-first writing core. Extend the existing `core.js`/`sdk.js` data model instead of importing OpenDraft backend services. Borrow the interaction model from OpenDraft version history and the layout ideas from `storyboard-app`, but keep the second page text-only and non-overlapping with StarCanvas canvas/generation features.

**Tech Stack:** Vanilla ES modules, Vite, Node test runner, existing local JSON project model

## Global Constraints

- Only build screenplay / novel / writing scope.
- Do not overlap with StarCanvas canvas, image generation, timeline production, or asset generation features.
- Prefer local data model reuse over new dependencies.
- Use TDD: failing test first, then minimal implementation.

---

### Task 1: OpenDraft-style version semantics

**Files:**
- Modify: `src/core.js`
- Modify: `src/sdk.js`
- Test: `tests/core.test.js`

**Interfaces:**
- Produces: `checkInVersion(project, message, author?)`, `compareVersions(project, fromVersionId, toVersionId?)`
- Updates: `restoreVersion(project, versionId)` to create a restore entry

### Task 2: Text-only shot planning data model

**Files:**
- Modify: `src/core.js`
- Modify: `src/sdk.js`
- Test: `tests/core.test.js`

**Interfaces:**
- Produces: `generateShotPlan(project)`, `addShotPlanShot(project, sceneId?)`, `updateShotPlanShot(project, shotId, patch)`, `deleteShotPlanShot(project, shotId)`, `summarizeShotPlan(project)`
- Updates: `createProject(input)` to persist `shotPlan`

### Task 3: UI wiring for writing page + shot plan page

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`

**Interfaces:**
- Uses: SDK methods from Tasks 1 and 2
- Produces: page switcher, check-in button, version diff view, text-only shot plan page

### Task 4: Verification

**Files:**
- Modify: `progress.md`

**Interfaces:**
- Run: `npm test`
- Run: `npm run build`
- Keep local dev URL working
