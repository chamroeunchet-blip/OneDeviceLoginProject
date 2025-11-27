const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = __dirname + "/device.json";

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { activeDevice: null, activeUser: null };
  }
}

function writeDB(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

const USERS = [
  { username: "Mr1", password: "7777" },
  { username: "Mr2", password: "8888" },
  { username: "Mr3", password: "9999" }
];

// ================= LOGIN ==================
app.post("/login", (req, res) => {
  const { username, password, deviceId } = req.body;

  const db = readDB();

  // Check username & password
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.status(401).json({ message: "Invalid Login" });

  // If same device logs again → allow
  if (db.activeUser === username && db.activeDevice === deviceId) {
    return res.json({ message: "Login successful (same device)" });
  }

  // If this user is logged in from another device → BLOCK
  if (db.activeUser === username && db.activeDevice !== deviceId) {
    return res.status(403).json({
      message:
        "This user is already logged in on another device. Please logout from that device first."
    });
  }

  // Allow login
  db.activeUser = username;
  db.activeDevice = deviceId;
  writeDB(db);

  return res.json({ message: "Login successful" });
});

// ================= LOGOUT ==================
app.post("/logout", (req, res) => {
  const { deviceId } = req.body;

  const db = readDB();

  // Only logout if same device
  if (db.activeDevice === deviceId) {
    db.activeUser = null;
    db.activeDevice = null;
    writeDB(db);
  }

  res.json({ message: "Logged out" });
});

// ================= STATUS ==================
app.get("/status", (req, res) => {
  res.json(readDB());
});

app.listen(3000, () => console.log("Server running"));
