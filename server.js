// server.js — CTM High School backend.
// Pure Node.js (http + node:sqlite) — no Express, no npm install required.
// Serves the website AND a real database-backed API from one process.
//
// Run locally:   node server.js
// Deploy:        push this folder to Render / Railway / Fly.io / any Node 22+ host.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');

const PORT = process.env.PORT || 3000;
// Change this before deploying — required to add/update results via the API.
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me';
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function readJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fall back to index.html for any unknown route (simple SPA-style fallback)
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, data2) => {
        if (err2) { res.writeHead(404); return res.end('404 Not Found'); }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,x-admin-key'
    });
    return res.end();
  }

  try {
    // ---------- Health check ----------
    if (url.pathname === '/api/health' && req.method === 'GET') {
      return sendJSON(res, 200, { ok: true, service: 'CTM High School API' });
    }

    // ---------- Results: public lookup ----------
    if (url.pathname.startsWith('/api/results/') && req.method === 'GET') {
      const roll = decodeURIComponent(url.pathname.split('/').pop() || '').trim();
      if (!roll) return sendJSON(res, 400, { found: false, message: 'Roll number required.' });
      const row = db.prepare('SELECT * FROM results WHERE roll_no = ?').get(roll);
      if (!row) return sendJSON(res, 404, { found: false, message: 'No result found for this roll number.' });
      return sendJSON(res, 200, { found: true, result: row });
    }

    // ---------- Results: admin add/update ----------
    if (url.pathname === '/api/results' && req.method === 'POST') {
      if (req.headers['x-admin-key'] !== ADMIN_KEY) return sendJSON(res, 401, { error: 'Unauthorized' });
      const b = await readJSONBody(req);
      const required = ['roll_no', 'student_name', 'class', 'marks_obtained', 'marks_total', 'status'];
      for (const f of required) if (b[f] === undefined || b[f] === '') return sendJSON(res, 400, { error: `Missing field: ${f}` });
      db.prepare(`
        INSERT INTO results (roll_no, student_name, class, marks_obtained, marks_total, status)
        VALUES (@roll_no, @student_name, @class, @marks_obtained, @marks_total, @status)
        ON CONFLICT(roll_no) DO UPDATE SET
          student_name = excluded.student_name,
          class = excluded.class,
          marks_obtained = excluded.marks_obtained,
          marks_total = excluded.marks_total,
          status = excluded.status
      `).run(b);
      return sendJSON(res, 200, { ok: true });
    }

    // ---------- Admissions: public submit ----------
    if (url.pathname === '/api/admissions' && req.method === 'POST') {
      const b = await readJSONBody(req);
      const required = ['student_name', 'father_name', 'class', 'phone', 'address'];
      for (const f of required) if (!b[f]) return sendJSON(res, 400, { error: `Missing field: ${f}` });
      db.prepare(`
        INSERT INTO admissions (student_name, father_name, class, phone, address, notes)
        VALUES (@student_name, @father_name, @class, @phone, @address, @notes)
      `).run({ notes: '', ...b });
      return sendJSON(res, 200, { ok: true, message: 'Application received.' });
    }

    // ---------- Admissions: admin list ----------
    if (url.pathname === '/api/admissions' && req.method === 'GET') {
      if (req.headers['x-admin-key'] !== ADMIN_KEY) return sendJSON(res, 401, { error: 'Unauthorized' });
      const rows = db.prepare('SELECT * FROM admissions ORDER BY created_at DESC').all();
      return sendJSON(res, 200, { count: rows.length, admissions: rows });
    }

    // ---------- Static site ----------
    if (req.method === 'GET') return serveStatic(req, res, url.pathname);

    sendJSON(res, 404, { error: 'Not found' });
  } catch (e) {
    sendJSON(res, 500, { error: 'Server error', detail: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`CTM High School server running at http://localhost:${PORT}`);
});
