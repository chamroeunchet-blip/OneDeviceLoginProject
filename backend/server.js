// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// <-- Ensure this path points to the same folder as server.js -->
const DATA_FILE = path.join(__dirname, "device.json");

// create device.json if missing (safe)
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }, null, 2));
  }
}
ensureDataFile();

function loadDB() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}
function saveDB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// === Users list (edit / add users here) ===
const USERS = [
  { username: "Mr1", password: "7777" },
  { username: "Mr2", password: "8888" },
  { username: "Mr3", password: "9999" },
  { username: "Mr4", password: "1111" }
];

// Initialize users in DB (only if not present)
function initUsers() {
  const db = loadDB();
  if (!db.users) db.users = {};
  USERS.forEach(u => {
    if (!u || !u.username) return; // safety
    if (!db.users[u.username]) {
      db.users[u.username] = {
        password: u.password,
        deviceId: null,
        sessionToken: null,
        status: "logged_out", // "logged_out" | "active" | "pending"
        waitingDevice: null,
        requestId: null
      };
    }
  });
  saveDB(db);
}
initUsers();

/* =================== HELPERS =================== */
function genToken() {
  return crypto.randomUUID();
}
function safeJson(res, obj) {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(obj));
}

/* =================== ROUTES =================== */

/**
 * POST /login
 * body: { username, password, deviceId }
 * responses:
 *  - { success: true, token, url }
 *  - { success: false, message }
 *  - { success: false, requiresApproval: true, requestId, message }
 */
app.post("/login", (req, res) => {
  try {
    const { username, password, deviceId } = req.body || {};
    if (!username || !password || !deviceId) {
      return safeJson(res, { success: false, message: "Missing username/password/deviceId" });
    }

    const db = loadDB();
    const user = db.users[username];
    if (!user) return safeJson(res, { success: false, message: "Invalid username" });
    if (user.password !== password) return safeJson(res, { success: false, message: "Wrong password" });

    // first time (no device)
    if (!user.deviceId) {
      user.deviceId = deviceId;
      user.sessionToken = genToken();
      user.status = "active";
      saveDB(db);
      return safeJson(res, { success: true, token: user.sessionToken, url: "https://mdquiz02.blogspot.com/" });
    }

    // same device -> accept
    if (user.deviceId === deviceId) {
      // ensure token exists
      if (!user.sessionToken) user.sessionToken = genToken();
      saveDB(db);
      return safeJson(res, { success: true, token: user.sessionToken, url: "https://mdquiz02.blogspot.com/" });
    }

    // different device -> create approval request
    user.status = "pending";
    user.waitingDevice = deviceId;
    user.requestId = genToken();
    saveDB(db);

    return safeJson(res, {
      success: false,
      requiresApproval: true,
      requestId: user.requestId,
      message: "Someone is trying to login to your account."
    });
  } catch (err) {
    console.error("LOGIN ERR:", err);
    return safeJson(res, { success: false, message: "Server error" });
  }
});

/**
 * POST /check-requests
 * body: { username }
 * returns { hasRequest: true/false, requestId? }
 */
app.post("/check-requests", (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return safeJson(res, { hasRequest: false });
    const db = loadDB();
    const user = db.users[username];
    if (!user) return safeJson(res, { hasRequest: false });
    if (user.status === "pending") {
      return safeJson(res, { hasRequest: true, requestId: user.requestId });
    }
    return safeJson(res, { hasRequest: false });
  } catch (err) {
    console.error("CHECK-REQ ERR:", err);
    return safeJson(res, { hasRequest: false });
  }
});

/**
 * POST /approve
 * body: { username, requestId }
 * approve waiting device -> switch session to waitingDevice
 */
app.post("/approve", (req, res) => {
  try {
    const { username, requestId } = req.body || {};
    if (!username || !requestId) return safeJson(res, { success: false, message: "Missing fields" });
    const db = loadDB();
    const user = db.users[username];
    if (!user) return safeJson(res, { success: false, message: "Invalid user" });
    if (user.requestId !== requestId) return safeJson(res, { success: false, message: "Request mismatch" });

    // switch to waiting device (auto-logout previous)
    user.deviceId = user.waitingDevice;
    user.sessionToken = genToken();
    user.status = "active";
    user.waitingDevice = null;
    user.requestId = null;
    saveDB(db);

    return safeJson(res, { success: true, token: user.sessionToken, message: "Approved" });
  } catch (err) {
    console.error("APPROVE ERR:", err);
    return safeJson(res, { success: false, message: "Server error" });
  }
});

/**
 * POST /decline
 * body: { username }
 */
app.post("/decline", (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return safeJson(res, { success: false });
    const db = loadDB();
    const user = db.users[username];
    if (!user) return safeJson(res, { success: false });
    // cancel pending
    user.status = "active";
    user.waitingDevice = null;
    user.requestId = null;
    saveDB(db);
    return safeJson(res, { success: true, message: "Declined" });
  } catch (err) {
    console.error("DECLINE ERR:", err);
    return safeJson(res, { success: false });
  }
});

/**
 * POST /logout
 * body: { token }
 */
app.post("/logout", (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return safeJson(res, { success: false, message: "Missing token" });

    const db = loadDB();
    for (const uname of Object.keys(db.users)) {
      const user = db.users[uname];
      if (user.sessionToken === token) {
        user.deviceId = null;
        user.sessionToken = null;
        user.status = "logged_out";
        saveDB(db);
        return safeJson(res, { success: true });
      }
    }
    return safeJson(res, { success: false, message: "Token not found" });
  } catch (err) {
    console.error("LOGOUT ERR:", err);
    return safeJson(res, { success: false });
  }
});

/* ===== Optional debug endpoints (safe to remove in production) ===== */

/**
 * GET /_status
 * returns simple server status
 */
app.get("/_status", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/**
 * GET /_users
 * returns users DB (for debug only)
 */
app.get("/_users", (req, res) => {
  const db = loadDB();
  // don't expose passwords in production; here for debug only
  res.json(db.users);
});

/* =================== START =================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

/* =============== DECLINE REQUEST =============== */
app.post("/decline", (req, res) => {
    const { username } = req.body;
    const db = loadDB();
    const user = db.users[username];

    if (!user) return res.json({ success: false });

    // store decline message for new device
    user.declineMessage = "Sorry! Admin did not approve your login.";

    user.status = "active";
    user.waitingDevice = null;
    user.requestId = null;

    saveDB(db);

    return res.json({ success: true });
});

/* =============== CHECK DECLINE MESSAGE =============== */
app.post("/check-decline", (req, res) => {
    const { username } = req.body;
    const db = loadDB();
    const user = db.users[username];

    if (!user) return res.json({ hasDecline: false });

    if (user.declineMessage) {
        const msg = user.declineMessage;
        user.declineMessage = null; // clear after sent
        saveDB(db);

        return res.json({ hasDecline: true, message: msg });
    }

    return res.json({ hasDecline: false });
});
