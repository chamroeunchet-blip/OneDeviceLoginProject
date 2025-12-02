const express = require("express");
const cors = require("cors");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "device.json");

// === Database Helper ===
function loadDB() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveDB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// === Users Config (Username & Password) ===
const USERS = [
   { username: "Yuos_chamroeun", password: "chamroeun@2025" },
  { username: "Soma", password: "soma@2025" },
  { username: "Sokthida", password: "sokthida@2025" },
  { username: "Vutha", password: "vutha@2055" },
  { username: "Simtap", password: "simtap@2025" },
  { username: "Chanlim", password: "chanlim@2025" },
  { username: "Raksa", password: "raksa@2025" },
  { username: "Sopheas", password: "sopheas@9999" },
  { username: "Saovanny", password: "vanny@99" },
  { username: "Soksangha", password: "@sangha9999" },
  { username: "Seanghai", password: "@seanghai99" },
  { username: "Saksophea", password: "sophea@2025" },
  { username: "Virak", password: "@virak9999" },
  { username: "Seyha", password: "@seyha999" },
  { username: "Sichan", password: "@sichan99" },
  { username: "Davy", password: "davy@9999" },
  { username: "Sreysros", password: "sreysros@99" },
  { username: "Chetra", password: "chetra@999" },
  { username: "Bunnavath", password: "bunavath@9999" },
  { username: "Davin", password: "davin#2025" },
  { username: "Sochar", password: "sochar@99" },
  { username: "Roza", password: "roza@9999" },
   { username: "Penglong", password: "long@99" },
  { username: "Kimhong", password: "kimhong@2025" },
  { username: "Kamsan", password: "kamsan@2025" },
  { username: "Meng_y", password: "mengy@2025" },
  { username: "Senghuor", password: "huor@9999" },
  { username: "Sipathnarath", password: "bunavath@9999" },
  { username: "Rathana", password: "rathana@2025" },
  { username: "Sochar", password: "sochar@99" },
  { username: "Leangmey", password: "leangmey@99" },
  { username: "Somnang", password: "somnang@99" },
  { username: "Chamroeun", password: "chomroeun03/11/1993" },
  { username: "Mengleang", password: "mengleang@168" },
  { username: "Chamnab", password: "chamnab@168" },
  { username: "Chandara", password: "dara@2025" },
  { username: "Kimleng", password: "kimleng@2025" },
  { username: "Lyheang", password: "lyheang@2025" }
];

// Init Users
(function initUsers() {
  const db = loadDB();
  if (!db.users) db.users = {};
  USERS.forEach(u => {
    if (!db.users[u.username]) {
      db.users[u.username] = {
        password: u.password,
        deviceId: null,
        sessionToken: null,
        status: "logged_out",
        waitingDevice: null,
        requestId: null,
        declineMessage: null,
        lastActive: 0
      };
    } else {
        db.users[u.username].password = u.password; // Update password if changed
    }
  });
  saveDB(db);
})();

function genToken() { return crypto.randomUUID(); }
function safeJson(res, obj) { res.json(obj); }

// === ROUTES ===

app.post("/login", (req, res) => {
  const { username, password, deviceId } = req.body || {};
  if (!username || !password || !deviceId) return safeJson(res, { success: false, message: "Missing inputs" });

  const db = loadDB();
  const user = db.users[username];
  
  if (!user) return safeJson(res, { success: false, message: "Invalid username" });
  if (user.password !== password) return safeJson(res, { success: false, message: "Wrong password" });

  // 1. Check Decline Message first
  if (user.declineMessage) {
      const msg = user.declineMessage;
      user.declineMessage = null; 
      saveDB(db);
      return safeJson(res, { success: false, isDeclined: true, message: msg });
  }

  user.lastActive = Date.now();

  // 2. If Same Device -> Allow & Refresh Token (Keep Owner)
  if (user.deviceId === deviceId) {
    // If token is missing (maybe cleared cache), generate new one
    if (!user.sessionToken) user.sessionToken = genToken();
    user.status = "active";
    saveDB(db);
    return safeJson(res, { success: true, token: user.sessionToken });
  }

  // 3. If No Device (First time or after timeout) -> Take Ownership
  if (!user.deviceId) {
    user.deviceId = deviceId;
    user.sessionToken = genToken();
    user.status = "active";
    saveDB(db);
    return safeJson(res, { success: true, token: user.sessionToken });
  }

  // 4. DIFFERENT DEVICE -> BLOCK & REQUEST APPROVAL
  // Do NOT allow login. Force "Pending".
  user.status = "pending";
  user.waitingDevice = deviceId;
  user.requestId = genToken();
  saveDB(db);

  return safeJson(res, {
    success: false,
    requiresApproval: true,
    requestId: user.requestId,
    message: "Waiting for approval..."
  });
});

/**
 * NEW: SYNC STATUS (Heartbeat)
 * Checks: 
 * 1. Is my token valid? (If no -> Force Logout)
 * 2. Do I have approval requests? (If yes -> Show Popup)
 * 3. Updates lastActive time.
 */
app.post("/sync-status", (req, res) => {
  const { username, token } = req.body;
  const db = loadDB();
  const user = db.users[username];
  
  if (!user) return safeJson(res, { isValid: false });

  // CRITICAL SECURITY CHECK:
  // If the token sent by browser doesn't match DB token, 
  // it means someone else logged in or session expired.
  if (user.sessionToken !== token) {
      return safeJson(res, { isValid: false, reason: "Session expired or overwritten" });
  }

  // Update Activity
  const now = Date.now();
  if (now - user.lastActive > 10000) { // Optimize disk write
      user.lastActive = now;
      saveDB(db);
  }

  // Check for requests
  let response = { isValid: true, hasRequest: false };
  if (user.status === "pending" && user.requestId) {
      response.hasRequest = true;
      response.requestId = user.requestId;
  }

  return safeJson(res, response);
});

app.post("/approve", (req, res) => {
  const { username, requestId } = req.body;
  const db = loadDB();
  const user = db.users[username];
  
  if (user && user.requestId === requestId) {
    // Switch Owner
    user.deviceId = user.waitingDevice;
    user.sessionToken = genToken(); // NEW TOKEN (Kills old session)
    user.status = "active";
    user.waitingDevice = null;
    user.requestId = null;
    user.declineMessage = null;
    user.lastActive = Date.now();
    saveDB(db);
    return safeJson(res, { success: true });
  }
  return safeJson(res, { success: false });
});

app.post("/decline", (req, res) => {
  const { username } = req.body;
  const db = loadDB();
  const user = db.users[username];

  if (user) {
    user.declineMessage = "Sorry! Account owner not approve, សុំទោស!ម្ចាស់ដើមមិនអនុញ្ញាតទេ។ សូមអរគុណ";
    user.status = "active";
    user.waitingDevice = null;
    user.requestId = null;
    saveDB(db);
    return safeJson(res, { success: true });
  }
  return safeJson(res, { success: false });
});

app.post("/logout", (req, res) => {
  const { token } = req.body;
  const db = loadDB();
  let found = false;
  
  for (const k in db.users) {
    if (db.users[k].sessionToken === token) {
      db.users[k].sessionToken = null;
      db.users[k].deviceId = null; // Clear ownership
      db.users[k].status = "logged_out";
      found = true;
    }
  }
  
  saveDB(db); // Save once
  return safeJson(res, { success: found });
});

// === AUTO LOGOUT (30 Mins) ===
const INACTIVITY_LIMIT = 30 * 60 * 1000; 
setInterval(() => {
  try {
    const db = loadDB();
    const now = Date.now();
    let changed = false;

    for (const k in db.users) {
      const user = db.users[k];
      if (user.deviceId && user.lastActive) {
        if (now - user.lastActive > INACTIVITY_LIMIT) {
            console.log(`[Auto-Logout] User ${k}`);
            user.deviceId = null;
            user.sessionToken = null;
            user.status = "logged_out";
            user.waitingDevice = null;
            user.requestId = null;
            changed = true;
        }
      }
    }
    if (changed) saveDB(db);
  } catch (err) { console.error(err); }
}, 60000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
