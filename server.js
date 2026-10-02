const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database("users.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret-before-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(express.static(path.join(__dirname, "public")));

function validUsername(username) {
  return typeof username === "string" &&
    /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

function validPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!validUsername(username)) {
    return res.status(400).json({
      error: "Tên đăng nhập phải dài 3–30 ký tự và chỉ gồm chữ, số hoặc _."
    });
  }

  if (!validPassword(password)) {
    return res.status(400).json({
      error: "Mật khẩu phải có ít nhất 6 ký tự."
    });
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return res.status(409).json({ error: "Tên đăng nhập đã tồn tại." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    "INSERT INTO users (username, password_hash) VALUES (?, ?)"
  ).run(username, passwordHash);

  req.session.userId = result.lastInsertRowid;
  req.session.username = username;

  res.json({ ok: true, username });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?"
  ).get(username);

  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." });
  }

  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({ ok: true, username: user.username });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ authenticated: false });
  res.json({
    authenticated: true,
    username: req.session.username
  });
});

app.listen(PORT, () => {
  console.log(`Website đang chạy tại http://localhost:${PORT}`);
});
