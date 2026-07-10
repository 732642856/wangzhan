# Deploy Checklist

## GitHub Pages

This repo includes a GitHub Actions Pages workflow.

1. Push to `main`.
2. Wait for `ci` to pass.
3. Wait for `deploy-pages` to pass.
4. Open the Pages URL.

## Vercel

1. Open Vercel.
2. Add New Project.
3. Import this GitHub repo.
4. Keep default Vite settings.
5. Deploy.

## Local Smoke Test

```bash
npm ci
npm test
npm run build
```

Then verify:

1. Open the hosted app.
2. Create a test project.
3. Switch between `剧本` and `文学剧本`.
4. Create a note and tag.
5. Export a `.json`.

## Local-Only Features

These are not part of hosted static mode:

- Codex skill installation
- MCP bridge
- Local filesystem indexing
- Private ebook/OCR source files
