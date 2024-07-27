const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { broadcastUserData } = require('../utils/broadcast');
const router = express.Router();

let userAccounts = {};
let usersData = {};

// Load user data from file
function loadUserData() {
    fs.readFile('./data/userData.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return;
        }
        try {
            usersData = JSON.parse(data).userData;
            console.log('User data reloaded');
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    });
}

// Load user accounts from file
function loadUserAccounts() {
    fs.readFile('./data/userAccounts.json', 'utf8', (err, data) => {
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