const express = require("express");
const cors = require("cors");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Absolute path (important for Render)
const DATA_FILE = path.join(__dirname, "device.json");

// Create file if missing
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }, null, 2));
}

function loadDB() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveDB(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const USERS = [
  { username: "Mr1", password: "7777" },
  { username: "Mr2", password: "8888" },
  { username: "Mr3", password: "9999" }

];

// Initialize DB with users
function initUsers() {
    const db = loadDB();
    USERS.forEach(u => {
        if (!db.users[u.username]) {
            db.users[u.username] = {
                password: u.password,
                deviceId: null,
                sessionToken: null,
                status: "logged_out",
                waitingDevice: null,
                requestId: null
            };
        }
    });
    saveDB(db);
}
initUsers();


/* =============== LOGIN =============== */
app.post("/login", (req, res) => {
    const { username, password, deviceId } = req.body;
    const db = loadDB();

    if (!db.users[username])
        return res.json({ success: false, message: "Invalid username" });

    const user = db.users[username];

    if (user.password !== password)
        return res.json({ success: false, message: "Wrong password" });

    // FIRST TIME
    if (!user.deviceId) {
        user.deviceId = deviceId;
        user.sessionToken = crypto.randomUUID();
        user.status = "active";
        saveDB(db);

        return res.json({
            success: true,
            token: user.sessionToken,
            url: "https://mdquiz02.blogspot.com/"
        });
    }

    // SAME DEVICE
    if (user.deviceId === deviceId) {
        return res.json({
            success: true,
            token: user.sessionToken,
            url: "https://mdquiz02.blogspot.com/"
        });
    }

    // DIFFERENT DEVICE → Need approval
    user.status = "pending";
    user.waitingDevice = deviceId;
    user.requestId = crypto.randomUUID();
    saveDB(db);

    return res.json({
        success: false,
        requiresApproval: true,
        requestId: user.requestId,
        message: "Someone is trying to login to your account."
    });
});


/* =============== FIRST DEVICE CHECK FOR REQUEST =============== */
app.post("/check-requests", (req, res) => {
    const { username } = req.body;
    const db = loadDB();
    const user = db.users[username];

    if (user.status === "pending") {
        return res.json({
            hasRequest: true,
            requestId: user.requestId
        });
    }

    return res.json({ hasRequest: false });
});


/* =============== APPROVE NEW DEVICE =============== */
app.post("/approve", (req, res) => {
    const { username, requestId } = req.body;
    const db = loadDB();
    const user = db.users[username];

    if (!user || user.requestId !== requestId)
        return res.json({ success: false });

    user.deviceId = user.waitingDevice;
    user.sessionToken = crypto.randomUUID();
    user.status = "active";
    user.waitingDevice = null;
    user.requestId = null;
    saveDB(db);

    return res.json({ success: true, token: user.sessionToken });
});


/* =============== DECLINE REQUEST =============== */
app.post("/decline", (req, res) => {
    const { username } = req.body;
    const db = loadDB();
    const user = db.users[username];

    user.status = "active";
    user.waitingDevice = null;
    user.requestId = null;
    saveDB(db);

    return res.json({ success: true });
});


/* =============== LOGOUT =============== */
app.post("/logout", (req, res) => {
    const { token } = req.body;
    const db = loadDB();

    for (let username in db.users) {
        const user = db.users[username];
        if (user.sessionToken === token) {
            user.deviceId = null;
            user.sessionToken = null;
            user.status = "logged_out";
            saveDB(db);
            return res.json({ success: true });
        }
    }
    res.json({ success: false });
});


// Render will auto detect port
app.listen(process.env.PORT || 3000, () =>
    console.log("Backend running...")
);
