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

// === USERS CONFIG ===
const USERS = [
  { username: "Yuos_chamroeun", password: "chamroeun@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Soma", password: "soma@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Sokthida", password: "sokthida@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Vutha", password: "vutha@17pro", startDate: "2025-11-11", durationDays: 365 },
  { username: "Simtap", password: "simtap@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Chanlim", password: "chanlim@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Raksa", password: "raksa@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Sopheas", password: "sopheas@9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Saovanny", password: "vanny@99", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Soksangha", password: "@sangha9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Seanghai", password: "@seanghai99", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Saksophea", password: "sophea@2025", startDate: "2025-11-11", durationDays: 1700 },
  { username: "Virak", password: "@virak9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Seyha", password: "@seyha999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Sichan", password: "@sichan99", startDate: "2025-11-11", durationDays: 1700 },
  { username: "Davy", password: "davy@9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Sreysros", password: "sreysros@99", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Chetra", password: "chetra@999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Bunnavath", password: "vath@168", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Davin", password: "davin#2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Sochar", password: "sochar@99", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Roza", password: "roza@9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Penglong", password: "long@99", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Kimhong", password: "kimhong@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Kamsan", password: "kamsan@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Meng_y", password: "mengy@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Senghuor", password: "huor@9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Sipathnarath", password: "naroth@9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Rathana", password: "rathana@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Leangmey", password: "leangmey@99", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Somnang", password: "somnang@99", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Chamroeun", password: "chomroeun03/11/1993", startDate: "2025-12-16", durationDays: 365 },
  { username: "Mengleang", password: "meng168leang", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Chamnab", password: "chamnab@168", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Chandara", password: "dara@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Kimleng", password: "kimleng@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Lyheang", password: "lyheang@2025", startDate: "2025-11-11", durationDays: 600 },
  { username: "Sovan", password: "sovan@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Seavmey", password: "seavmey@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Sokhethida", password: "thida@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Sokla", password: "sokla@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Vita", password: "vita@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Silin", password: "silin@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Soriya", password: "soriya@9999", startDate: "2025-11-11", durationDays: 365 },
  { username: "Chamnab", password: "chamnab@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Virak", password: "virak@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Chanvirak", password: "virak@2025", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Rethsamoun", password: "samoun@2025", startDate: "2025-11-11", durationDays: 1600 },
  { username: "Serysophea", password: "sophea@2025", startDate: "2025-11-11", durationDays: 600 },
  { username: "Soheng", password: "soheng@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Chenda", password: "chenda@9999", startDate: "2025-11-11", durationDays: 365 },
  { username: "Siphathnaroth", password: "naroth@9999", startDate: "2025-11-11", durationDays: 1200 },
  { username: "Senghuor", password: "senghuor@2025", startDate: "2025-11-11", durationDays: 365 },
  { username: "Sovan", password: "van@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Thearoth", password: "roth@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Chungkhoang", password: "Khoang@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Pheaktra", password: "tra@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Sotheavath", password: "vath@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Sothynorom", password: "rom@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Ponareay", password: "nareay@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Dalin", password: "dalin@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Lina", password: "na@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Savuth", password: "savuth@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Makara", password: "makara@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Seavmey", password: "mey@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Oudom", password: "dom@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Sopheak", password: "pheak@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Ponleu", password: "ponleu@168", startDate: "2025-11-16", durationDays: 1000 },
  { username: "Boline", password: "boline@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Rangsey", password: "sey@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Sovannarath", password: "rath@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Channak", password: "nak@151225", startDate: "2025-11-15", durationDays: 365 },
  { username: "Pichly", password: "pichly@151225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Soyvet", password: "vet@151225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Piseth", password: "seth@151225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Lyponleu", password: "ponleu@168", startDate: "2025-11-16", durationDays: 365 },
  { username: "Sreynet", password: "net@121225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Arunrefa", password: "refa@121225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Chakriya", password: "ya@121225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Dararaksmey", password: "smey@121225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Sengpheaktra", password: "tra@121225", startDate: "2025-11-16", durationDays: 365 },
  { username: "kimbunthav", password: "thav@171225", startDate: "2025-11-16", durationDays: 365 },
  { username: "Sokla", password: "sokla@2025", startDate: "2025-11-16", durationDays: 1200 },
  { username: "Linda", password: "linda@2026", startDate: "2025-11-16", durationDays: 1200 },
  { username: "Sovan", password: "sovan@2025", startDate: "2025-11-16", durationDays: 1200 },
  { username: "Longpheng", password: "pheng@2026", startDate: "2026-1-10", durationDays: 1 },
  { username: "Thavongvuth", password: "vuth@168", startDate: "2026-1-10", durationDays: 366 },
  { username: "Pichbondith", password: "bondith@168", startDate: "2026-1-14", durationDays: 366 },
  { username: "Samart", password: "art@168", startDate: "2026-1-14", durationDays: 366 },
  { username: "Kimsor", password: "kimsor@1280", startDate: "2026-1-14", durationDays: 365 },
  { username: "Kamsan2", password: "san@002", startDate: "2026-1-14", durationDays: 366 },
  { username: "Chheang", password: "Chheang7272", startDate: "2026-1-28", durationDays: 366 },
  { username: "Keyla", password: "262626", startDate: "2026-2-3", durationDays: 366 },
  { username: "Sokchan", password: "chan@168", startDate: "2026-2-3", durationDays: 366 },
   { username: "Puthea", password: "puthea@168", startDate: "2026-2-3", durationDays: 200},
   { username: "Vandy", password: "vandy@1280", startDate: "2026-2-3", durationDays: 168},
  
  //------laboratory accounts-----
  { username: "Test", password: "test@2026", startDate: "2026-01-08", durationDays: 30 },
  { username: "Test02", password: "test@2026", startDate: "2026-01-08", durationDays: 30 }
];

// === Initialize Users ===
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
        lastActive: 0,
        startDate: u.startDate || null,
        durationDays: u.durationDays || 365,
        // NEW: lastUrl field
        lastUrl: null 
      };
    } else {
      db.users[u.username].password = u.password;
      if (!db.users[u.username].startDate) db.users[u.username].startDate = u.startDate || null;
      if (!db.users[u.username].durationDays) db.users[u.username].durationDays = u.durationDays || 365;
      // Ensure lastUrl exists
      if (db.users[u.username].lastUrl === undefined) db.users[u.username].lastUrl = null;
    }
  });

  saveDB(db);
})();

function genToken() { return crypto.randomUUID(); }

// === EXPIRATION HANDLER ===
function isExpired(user) {
  if (!user.startDate) return false;
  const start = new Date(user.startDate).getTime();
  const expire = start + user.durationDays * 24 * 60 * 60 * 1000;
  return Date.now() >= expire;
}

function expireTimestamp(user) {
  if (!user.startDate) return null;
  const start = new Date(user.startDate).getTime();
  return start + user.durationDays * 24 * 60 * 60 * 1000;
}

// === LOGIN ROUTE ===
app.post("/login", (req, res) => {
  const { username, password, deviceId } = req.body || {};
  if (!username || !password || !deviceId)
    return res.json({ success: false, message: "Missing inputs" });

  const db = loadDB();
  const user = db.users[username];

  if (!user) return res.json({ success: false, message: "Invalid username" });
  if (user.password !== password) return res.json({ success: false, message: "Wrong password" });

  // CHECK EXPIRATION
  if (isExpired(user)) {
    return res.json({
      success: false,
      expired: true,
      expireAt: expireTimestamp(user),
      message: "Account expired. Please contact admin."
    });
  }

  // CHECK DECLINE
  if (user.declineMessage) {
    const msg = user.declineMessage;
    user.declineMessage = null;
    saveDB(db);
    return res.json({ success: false, isDeclined: true, message: msg });
  }

  user.lastActive = Date.now();

  // FIRST LOGIN
  if (!user.deviceId) {
    user.deviceId = deviceId;
    user.sessionToken = genToken();
    user.status = "active";
    saveDB(db);
    return res.json({ 
      success: true, 
      token: user.sessionToken, 
      expireAt: expireTimestamp(user),
      lastUrl: user.lastUrl // Send saved URL
    });
  }

  // SAME DEVICE LOGIN
  if (user.deviceId === deviceId) {
    if (!user.sessionToken) user.sessionToken = genToken();
    user.status = "active";
    saveDB(db);
    return res.json({ 
      success: true, 
      token: user.sessionToken, 
      expireAt: expireTimestamp(user),
      lastUrl: user.lastUrl // Send saved URL
    });
  }

  // SECOND DEVICE LOGIN → REQUEST APPROVAL
  user.status = "pending";
  user.waitingDevice = deviceId;
  user.requestId = genToken();
  saveDB(db);

  return res.json({
    success: false,
    requiresApproval: true,
    requestId: user.requestId,
    message: "Waiting for approval..."
  });
});

// === NEW ROUTE: UPDATE PROGRESS ===
app.post("/update-progress", (req, res) => {
  const { username, token, url } = req.body;
  if (!username || !token || !url) return res.json({ success: false });

  const db = loadDB();
  const user = db.users[username];

  // Security check: Match token
  if (user && user.sessionToken === token) {
    user.lastUrl = url;
    user.lastActive = Date.now(); // Also update activity
    saveDB(db);
    return res.json({ success: true });
  }
  return res.json({ success: false });
});

// === CHECK REQUESTS ===
app.post("/check-requests", (req, res) => {
  const { username } = req.body;

  const db = loadDB();
  const user = db.users[username];

  if (user) {
    const now = Date.now();
    // Only update lastActive if recent activity
    if (now - user.lastActive > 10000) {
      user.lastActive = now;
      saveDB(db);
    }

    if (user.status === "pending") {
      return res.json({ hasRequest: true, requestId: user.requestId });
    }
  }

  return res.json({ hasRequest: false });
});

// === APPROVE ===
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
    saveDB(db);
    return res.json({ success: true });
  }

  return res.json({ success: false });
});

// === DECLINE ===
app.post("/decline", (req, res) => {
  const { username } = req.body;

  const db = loadDB();
  const user = db.users[username];

  user.declineMessage =
    "Sorry! Account owner did not approve. សូមទោស! ម្ចាស់គណនីមិនអនុញ្ញាតទេ។";

  user.status = "active";
  user.waitingDevice = null;
  user.requestId = null;

  saveDB(db);
  return res.json({ success: true });
});

// === LOGOUT ===
app.post("/logout", (req, res) => {
  const { token } = req.body;

  const db = loadDB();

  for (const k in db.users) {
    const u = db.users[k];

    if (u.sessionToken === token) {
      u.sessionToken = null;
      u.deviceId = null;
      u.status = "logged_out";
      // We do NOT clear lastUrl on logout, so they can resume later
      saveDB(db);
      return res.json({ success: true });
    }
  }

  res.json({ success: false });
});

// === AUTO LOGOUT (30min inactive) ===
setInterval(() => {
  const db = loadDB();
  const now = Date.now();

  let updateNeeded = false;

  for (const k in db.users) {
    const u = db.users[k];

    if (u.deviceId && u.lastActive && now - u.lastActive > 30 * 60 * 1000) {
      u.deviceId = null;
      u.sessionToken = null;
      u.status = "logged_out";
      u.waitingDevice = null;
      u.requestId = null;

      updateNeeded = true;
    }
  }

  if (updateNeeded) saveDB(db);
}, 60000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port " + PORT));
