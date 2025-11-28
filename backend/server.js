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
  { username: "Mr3", password: "9999" },
  { username: "Mr4", password: "1111" }
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
        declineMessage: null // Added field for decline message
      };
    } else {
        // Ensure password is up to date if changed in config
        db.users[u.username].password = u.password;
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

  // CHECK DECLINE: If a decline message exists, return it to the polling device
  if (user.declineMessage) {
      const msg = user.declineMessage;
      // Clear it after sending so it doesn't block forever
      user.declineMessage = null; 
      saveDB(db);
      return safeJson(res, { 
          success: false, 
          isDeclined: true, 
          message: msg 
      });
  }

  // 1. First time login
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
    user.status = "active"; // Ensure active
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
  if (user && user.status === "pending") {
    return safeJson(res, { hasRequest: true, requestId: user.requestId });
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
    saveDB(db);
    return safeJson(res, { success: true });
  }
  return safeJson(res, { success: false });
});

// === UPDATED DECLINE ENDPOINT ===
app.post("/decline", (req, res) => {
  const { username } = req.body;
  const db = loadDB();
  const user = db.users[username];

  if (user) {
    // Set the specific message
    user.declineMessage = "Sorry! Account owner not approve, សុំទោស!ម្ចាស់ដើមមិនអនុញ្ញាតទេ។ សូមអរគុណ";
    
    // Reset status so owner remains owner
    user.status = "active";
    // Clear the waiting data
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
  for (const k in db.users) {
    if (db.users[k].sessionToken === token) {
      db.users[k].sessionToken = null;
      // We keep deviceId so they are still the "Owner", just logged out.
      // If you want to fully reset ownership, set deviceId = null here.
      db.users[k].status = "logged_out";
      saveDB(db);
      return safeJson(res, { success: true });
    }
  }
  return safeJson(res, { success: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
