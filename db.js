// db.js — real SQLite database for CTM High School (admissions + results)
// Uses Node's BUILT-IN sqlite module (node:sqlite) — no external packages,
// no "npm install" needed. Requires Node.js 22.5+.
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(__dirname, 'school.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    father_name  TEXT NOT NULL,
    class        TEXT NOT NULL,
    phone        TEXT NOT NULL,
    address      TEXT NOT NULL,
    notes        TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS results (
    roll_no        TEXT PRIMARY KEY,
    student_name   TEXT NOT NULL,
    class          TEXT NOT NULL,
    marks_obtained INTEGER NOT NULL,
    marks_total    INTEGER NOT NULL,
    status         TEXT NOT NULL
  );
`);

// Seed a few SAMPLE rows only the first time the database is created,
// so the "Check Result" box has something to demonstrate with.
// These are placeholders — replace/add real student results using the
// admin endpoint described in README.md.
const existing = db.prepare('SELECT COUNT(*) AS c FROM results').get().c;
if (existing === 0) {
  const insert = db.prepare(`
    INSERT INTO results (roll_no, student_name, class, marks_obtained, marks_total, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insert.run('1024', 'Sample Student — Ahmed Raza', '10th', 712, 850, 'Pass');
  insert.run('1035', 'Sample Student — Bilal Hussain', '9th', 689, 850, 'Pass');
  insert.run('1050', 'Sample Student — Usman Ali', '10th', 745, 850, 'Pass');
}

module.exports = db;
