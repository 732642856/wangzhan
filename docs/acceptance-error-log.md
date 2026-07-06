# Acceptance Error Log

Date started: 2026-07-06

## Work rule

Read this file before changing UI or acceptance tests. If a user-visible miss repeats, add it here and add the smallest regression check that would have caught it.

## Incidents

### Static chat that looked right but could not be used

- Symptom: right Copilot panel had chat-like bubbles, but no real visible input path.
- Missed by: token-only tests accepted class names without checking an input, Run button, Copy button, or handler wiring.
- Guard: `tests/acceptance-regression.test.js` checks `laperChatInput`, `laperChatRun`, `laperChatCopy`, `generateScriptDoctorReport()`, `copyAiPacket()`, and visible input CSS.

### Visual screenshot/DOM mismatch

- Symptom: DOM checks said right panel existed, but cropped screenshots were misleading because screenshot/crop coordinates did not match the actual viewport preview.
- Missed by: relying on one signal.
- Guard: for visual acceptance, verify DOM rects and a standard 1280x720 Playwright screenshot before claiming UI parity.

### GitHub Pages deploy step can fail after upload succeeds

- Symptom: CI/build/upload passed, but `actions/deploy-pages` failed intermittently at deploy.
- Missed by: treating build success as deployment success.
- Guard: check both `ci` and `deploy-pages`; retry deployment with an empty commit only when code tests/build already pass.

### Token-only tests missed UX regressions

- Symptom: tests checked labels/classes but not whether the user could complete the workflow.
- Missed by: static token list only.
- Guard: add behavior-shaped assertions for critical workflows: visible control, handler, state update, user feedback.

### Temp cloud worktree may disappear between sessions

- Symptom: `/tmp/wangzhan-m25` existed but was no longer a Git repository or app checkout, so sync created stray files and `npm test` failed with missing `package.json`.
- Missed by: assuming a temp directory from a previous run was still valid.
- Guard: before syncing or running cloud checks, verify both `.git` and `package.json`; reclone if either is missing.

### Fresh cloud clone needs dependencies before tests

- Symptom: `npm test` in a fresh clone failed with `ERR_MODULE_NOT_FOUND` for `inkjs` and `@tiptap/core`.
- Missed by: running tests before `npm ci`.
- Guard: after recloning cloud worktree, run `npm ci` before `npm test` and `npm run build`.
