const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'device.json');

const USERS = [
  { username: 'doctor', password: 'med123' },
  { username: 'nurse', password: 'health2024' },
  { username: 'admin', password: '123456' }
];

function readData(){
  try{
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  }catch(e){
    return { activeDevice: null, username: null };
  }
}

function writeData(obj){
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

app.post('/login', (req, res) =>{
  const { username, password, deviceId } = req.body || {};
  if(!username || !password || !deviceId) return res.status(400).json({ message: 'Missing fields' });

  const user = USERS.find(u => u.username === username && u.password === password);
  if(!user) return res.status(401).json({ message: 'Invalid credentials' });

  const data = readData();

  if(!data.activeDevice){
    data.activeDevice = deviceId;
    data.username = username;
    writeData(data);
    return res.json({ message: 'Login successful (this device is now active)' });
  }

  if(data.activeDevice === deviceId && data.username === username){
    return res.json({ message: 'Already logged in on this device' });
  }

  return res.status(403).json({ message: 'Another device is currently logged in. Please logout from that device first.' });
});

app.post('/logout', (req, res) =>{
  const { deviceId } = req.body || {};
  if(!deviceId) return res.status(400).json({ message: 'Missing deviceId' });

  const data = readData();
  if(data.activeDevice === deviceId){
    data.activeDevice = null;
    data.username = null;
    writeData(data);
    return res.json({ message: 'Logged out successfully' });
  }

  return res.status(400).json({ message: 'This device is not the active device' });
});

const PORT = 3000;
app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
