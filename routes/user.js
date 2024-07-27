const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { broadcastUserData } = require('../utils/broadcast');
const router = express.Router();

let userAccounts = {};
let usersData = {};

// Load user data from file
function loadUserData() {
    fs.readFile(path.join(__dirname, '../data/userData.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return;
        }
        try {
            usersData = JSON.parse(data).userData;
            global.usersData = usersData;
            console.log('User data reloaded');
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    });
}

// Load user accounts from file
function loadUserAccounts() {
    fs.readFile(path.join(__dirname, '../data/userAccounts.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user accounts:', err);
            return;
        }
        try {
            userAccounts = JSON.parse(data).users;
            console.log('User accounts reloaded');
        } catch (err) {
            console.error('Error parsing user accounts:', err);
        }
    });
}

// Initial load of user data and accounts
loadUserData();
loadUserAccounts();

fs.watchFile(path.join(__dirname, '../data/userData.json'), (curr, prev) => {
    console.log('userData.json file changed, reloading user data...');
    loadUserData();
});

// Endpoint to get user data by user ID
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    if (usersData[userId]) {
        res.json(usersData[userId]);
    } else {
        res.status(404).send('User not found');
    }
});

// Endpoint to update user data
router.post('/:userId', (req, res) => {
    const userId = req.params.userId;
    const updatedData = req.body;

    console.log(`Received update for user ${userId}:`, updatedData);

    if (usersData[userId]) {
        if (updatedData.version <= usersData[userId].version) {
            return res.status(409).send('Conflict: Stale data update attempt');
        }

        usersData[userId] = { ...usersData[userId], ...updatedData };
        console.log(`Updated user data for ${userId}:`, usersData[userId]);

        fs.writeFile(path.join(__dirname, '../data/userData.json'), JSON.stringify({ userData: usersData }, null, 2), (err) => {
            if (err) {
                console.error('Error writing user data:', err);
                return res.status(500).send('Error updating user data');
            }
            console.log('User data written to file successfully');
            broadcastUserData(require('../server').wss, usersData);
            res.send('User data updated successfully');
        });
    } else {
        res.status(404).send('User not found');
    }
});

module.exports = router;

// Create a new user
router.post('/createUser', (req, res) => {
    const { email, password, nickname } = req.body;
    if (userAccounts[email]) {
        return res.status(400).send('User already exists');
    }

    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    userAccounts[email] = { password: hashedPassword, userId };
    usersData[userId] = {
        nickname: nickname,
        level: 1,
        userPriority: 0,
        version: 1,
        xp: 0
    };

    fs.writeFile('./data/userAccounts.json', JSON.stringify({ users: userAccounts }, null, 2), (err) => {
        if (err) {
            console.error('Error writing user accounts:', err);
            return res.status(500).send('Error creating user');
        }

        fs.writeFile('./data/userData.json', JSON.stringify({ userData: usersData }, null, 2), (err) => {
            if (err) {
                console.error('Error writing user data:', err);
                return res.status(500).send('Error creating user');
            }
            broadcastUserData(require('../server').wss);
            res.json({ userId, nickname, level: 1, userPriority: 0, version: 1, xp: 0 });
        });
    });
});

// Login an existing user
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!userAccounts[email]) {
        return res.status(404).send('User not found');
    }

    const { password: hashedPassword, userId } = userAccounts[email];
    if (bcrypt.compareSync(password, hashedPassword)) {
        res.json({
            userId,
            nickname: usersData[userId].nickname,
            level: usersData[userId].level,
            userPriority: usersData[userId].userPriority,
            version: usersData[userId].version,
            xp: usersData[userId].xp
        });
    } else {
        res.status(401).send('Invalid password');
    }
});

module.exports = router;