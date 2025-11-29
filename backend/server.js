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

// === Users Config ===
const USERS = [
 { username: "Yuos_chamroeun", password: "chamroeun@2025" },
  { username: "Soma", password: "soma@2025" },
  { username: "Sokthida", password: "sokthida@2025" },
  { username: "Vutha", password: "vutha@2055" },
  { username: "Simtap", password: "simtap@2025" }
  { username: "Chanlim", password: "chanlim@2025" }
  { username: "Raksa", password: "raksa@2025" }
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
        lastActive: 0 // Added to track inactivity
      };
    } else {
        // Ensure password is up to date if changed in config
        db.users[u.username].password = u.password;
        // Ensure lastActive exists
        if (!db.users[u.username].lastActive) db.users[u.username].lastActive = 0;
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

  // CHECK DECLINE
  if (user.declineMessage) {
      const msg = user.declineMessage;
      user.declineMessage = null; 
      saveDB(db);
      return safeJson(res, { success: false, isDeclined: true, message: msg });
  }

  // Update Activity on Login
  user.lastActive = Date.now();

  // 1. First time login OR deviceId was cleared (Logout)
  if (!user.deviceId) {
    user.deviceId = deviceId;
    user.sessionToken = genToken();
    user.status = "active";
    saveDB(db);
    return safeJson(res, { success: true, token: user.sessionToken });
  }

  // 2. Same device login
  if (user.deviceId === deviceId) {
    if (!user.sessionToken) user.sessionToken = genToken();
    user.status = "active";
    saveDB(db);
    return safeJson(res, { success: true, token: user.sessionToken });
  }

  // 3. Different device -> create request
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

app.post("/check-requests", (req, res) => {
  const { username } = req.body;
  const db = loadDB();
  const user = db.users[username];
  
  if (user) {
    // HEARTBEAT: Update lastActive timestamp
    // We update only if > 10 seconds to avoid excessive disk writes
    const now = Date.now();
    if (now - user.lastActive > 10000) {
        user.lastActive = now;
        saveDB(db);
    }

    if (user.status === "pending") {
      return safeJson(res, { hasRequest: true, requestId: user.requestId });
    }
  }
  return safeJson(res, { hasRequest: false });
});

app.post("/approve", (req, res) => {
  const { username, requestId } = req.body;
  const db = loadDB();
  const user = db.users[username];
  
  if (user && user.requestId === requestId) {
    user.deviceId = user.waitingDevice;
    user.sessionToken = genToken();
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
    user.lastActive = Date.now();
    saveDB(db);
    return safeJson(res, { success: true });
  }
  return safeJson(res, { success: false });
});

app.post("/logout", (req, res) => {
  const { token } = req.body;
  const db = loadDB();
  for (const k in db.users) {
    if (db.users[k].sessionToken === token) {
      db.users[k].sessionToken = null;
      
      // === CHANGE: Clear deviceId on Logout ===
      // This allows ANY device to login next time without permission
      db.users[k].deviceId = null; 
      
      db.users[k].status = "logged_out";
      saveDB(db);
      return safeJson(res, { success: true });
    }
  }
  return safeJson(res, { success: false });
});

// === AUTO LOGOUT INTERVAL (30 Minutes Offline) ===
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
setInterval(() => {
  try {
    const db = loadDB();
    const now = Date.now();
    let changed = false;

    for (const k in db.users) {
      const user = db.users[k];
      
      // If user is considered "active" (has a deviceId)
      if (user.deviceId && user.lastActive) {
        // Check if offline for > 30 mins
        if (now - user.lastActive > INACTIVITY_LIMIT) {
            console.log(`[Auto-Logout] User ${k} inactive for > 30mins. Resetting.`);
            
            // Reset user to allow new logins
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
  } catch (err) {
    console.error("Auto-logout interval error:", err);
  }
}, 60 * 1000); // Check every 1 minute

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
