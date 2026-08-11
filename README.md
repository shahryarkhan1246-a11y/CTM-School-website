# Govt. CTM High School — Setup Guide

Two parts, deployed separately:

1. **The website** (`public/` folder) → GitHub Pages. Upload photos here any
   time and they update live — no code editing needed.
2. **The backend** (`server.js`, `db.js`) → a real Node host (Render/Railway),
   because GitHub Pages only serves static files and cannot run a database.
   This part is what makes admissions and results genuinely real.

You can run the website alone on GitHub Pages first (it works fine, with
demo results and email-only admissions), then add the real backend
whenever you're ready — one line of config connects them.

---

## Part 1 — Website on GitHub Pages (with easy photo uploads)

1. Create a new GitHub repository, e.g. `ctm-school-website`.
2. Upload everything **inside the `public/` folder** to the root of that
   repo: `index.html`, `gate.jpg`, `facade.jpg`, `courtyard.jpg`,
   `walkway.jpg`. (Do not upload the `backend` files here — GitHub Pages
   ignores them anyway since it can't run server code.)
3. Repo → **Settings → Pages** → Source: `main` branch, `/ (root)` → Save.
4. GitHub gives you a live URL in a minute or two, e.g.
   `https://yourusername.github.io/ctm-school-website/`.

### To change a photo later
Go to the file in GitHub (e.g. `gate.jpg`) → the pencil/upload icon →
**"Upload files"** → drag your new photo in with the **exact same
filename** (`gate.jpg`) → Commit. The site updates automatically within
a minute — no code changes needed. Same for `facade.jpg`, `courtyard.jpg`,
`walkway.jpg`. To add a completely new photo, upload it with a new name
and add one `<div class="gtile">` block in `index.html`'s gallery section
copying the pattern of the existing ones.

---

## Part 2 — Real backend (admissions + results database)

GitHub Pages cannot run this part — it needs an actual server. This uses
Node's **built-in** SQLite (`node:sqlite`), so there is nothing to
`npm install`; it just runs.

1. Free account at **render.com** (or railway.app).
2. New → Web Service → connect the repo (or upload the `backend/` folder
   directly if not using GitHub for this part).
3. Start command: `node server.js`. Environment variable `ADMIN_KEY` = a
   private password of your choice.
4. Deploy → you get a URL like `https://ctm-school.onrender.com`.

### Connect the two
Open `index.html`, find this block near the top of the `<script>` section:

```js
var API_BASE = "";
```

Change it to your Render URL:

```js
var API_BASE = "https://ctm-school.onrender.com";
```

Re-upload `index.html` to GitHub (same "Upload files" trick as photos).
From that point on, "Check Result" reads the real database and admissions
are actually stored — not just emailed.

### Adding real student results
```bash
curl -X POST https://YOUR-RENDER-URL/api/results \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR-ADMIN-KEY" \
  -d '{"roll_no":"1101","student_name":"Actual Student Name","class":"10th","marks_obtained":760,"marks_total":850,"status":"Pass"}'
```
Do this per student, or ask for a bulk CSV-import script if results are in
a spreadsheet.

### Viewing submitted admissions
```bash
curl https://YOUR-RENDER-URL/api/admissions -H "x-admin-key: YOUR-ADMIN-KEY"
```

---

## What's real right now, honestly

| Feature | Without backend (GitHub Pages only) | With backend deployed |
|---|---|---|
| Design, gallery, WhatsApp, guidelines | Real | Real |
| Contact / Admission → email | Real (FormSubmit) | Real (FormSubmit) |
| Admission → saved record | — | Real (SQLite) |
| Result checker | Demo data only (roll 1024/1035/1050) | Real database |

I can't create the GitHub repo or the Render account for you myself — no
network access on my side — but every step above is copy-paste simple.
