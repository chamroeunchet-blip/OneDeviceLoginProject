const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = __dirname + "/device.json";

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return { activeDevice: null, username: null };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ---------------- LOGIN ----------------
app.post("/login", (req, res) => {
  const { username, password, deviceId } = req.body;

  // USERS LIST
  const USERS = [
    { username: "doctor", password: "med123" },
    { username: "nurse", password: "123456" },
    { username: "admin", password: "admin123" }
  ];

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const data = readData();

  // If SAME device logs back in → allow instantly
  if (data.activeDevice === deviceId) {
    return res.json({ message: "Login OK (same device)" });
  }

  // If another device logged in → deny
  if (data.activeDevice && data.activeDevice !== deviceId) {
    return res.status(403).json({
      message:
        "Another device is currently logged in. Please logout from that device first."
    });
  }

  // Allow login
  data.activeDevice = deviceId;
  data.username = username;
  writeData(data);

  return res.json({ message: "Login successful" });
});

// ---------------- LOGOUT ----------------
app.post("/logout", (req, res) => {
  const { deviceId } = req.body;

  const data = readData();

  // Only reset if THAT device was logged in
  if (data.activeDevice === deviceId) {
    data.act
