const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const { loadUserData, loadUserAccounts, broadcastUserData } = require('./utils/loadData');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;

app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Ensure we only use the correct extension once
        cb(null, req.params.userId + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Load initial data
loadUserData(wss);
loadUserAccounts();

// Watch for changes to data files and reload
chokidar.watch('./data/userData.json').on('change', () => loadUserData(wss));
chokidar.watch('./data/userAccounts.json').on('change', loadUserAccounts);

// WebSocket broadcast on connection
wss.on('connection', (ws) => {
    console.log('A user connected');
    ws.on('close', () => {
        console.log('A user disconnected');
    });
});

// Endpoint for uploading profile pictures
app.post('/uploadProfilePicture/:userId', upload.single('profilePicture'), (req, res) => {
    res.send('Profile picture uploaded successfully');
});

// Endpoint for retrieving profile pictures
app.get('/profilePicture/:userId', (req, res) => {
    const userId = req.params.userId;
    const filePath = path.join(__dirname, 'uploads', userId);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).send('Profile picture not found');
        } else {
            res.sendFile(filePath);
        }
    });
});

// Import routes
const userRoutes = require('./routes/user');
const accountRoutes = require('./routes/account');

// Use routes
app.use('/user', userRoutes);
app.use('/account', accountRoutes);

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

module.exports = { wss };