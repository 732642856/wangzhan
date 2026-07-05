# Deploy Checklist

## 1. Create standalone repo

From `/Users/wuyongnaren/Documents/编剧助手`:

```bash
npm run export:cloud --prefix /Users/wuyongnaren/Documents/编剧助手/personal-screenwriter
```

Default output:

```text
/Users/wuyongnaren/Documents/personal-screenwriter-cloud
```

## 2. Push to GitHub

```bash
cd /Users/wuyongnaren/Documents/personal-screenwriter-cloud
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 3. Deploy on Vercel

1. Open Vercel
2. Add New Project
3. Import the GitHub repo
4. Keep default settings
5. Deploy

## 3a. Deploy on GitHub Pages

Build `dist/`, publish it to the `gh-pages` branch, then set GitHub Pages to serve `gh-pages` from `/`.

Current published URL:

```text
https://732642856.github.io/wangzhan/
```

This repo already includes:

- `vercel.json`
- `.github/workflows/ci.yml`

## 4. Verify hosted app

After deploy:

1. open the production URL
2. create a test project
3. switch between `剧本` and `文学剧本`
4. create a note / tag
5. export a `.json`

## 5. Keep local-only features local

Do not expect these to run in hosted mode:

- Codex plugin
- MCP bridge
- local filesystem indexing
