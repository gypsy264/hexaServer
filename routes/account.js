const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { broadcastUserData } = require('../utils/broadcast');
const router = express.Router();

function createUser(wss, req, res) {
    const { email, password, nickname } = req.body;
    if (global.userAccounts[email]) {
        return res.status(400).send('User already exists');
    }
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    global.userAccounts[email] = { password: hashedPassword, userId };
    global.usersData[userId] = {
        nickname: nickname,
        level: 1,
        userPriority: 0,
        version: 1,
        xp: 0
    };

    fs.writeFile('./data/userAccounts.json', JSON.stringify({ users: global.userAccounts }, null, 2), (err) => {
        if (err) {
            console.error('Error writing user accounts:', err);
            return res.status(500).send('Error creating user');
        }

        fs.writeFile('./data/userData.json', JSON.stringify({ userData: global.usersData }, null, 2), (err) => {
            if (err) {
                console.error('Error writing user data:', err);
                return res.status(500).send('Error creating user');
            }
            broadcastUserData(wss);
            res.json({ userId, nickname, level: 1, userPriority: 0, version: 1, xp: 0 });
        });
    });
}

router.post('/createUser', (req, res) => createUser(require('../server').wss, req, res));

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!global.userAccounts[email]) {
        return res.status(404).send('User not found');
    }
    const { password: hashedPassword, userId } = global.userAccounts[email];
    if (bcrypt.compareSync(password, hashedPassword)) {
        res.json({ 
            userId, 
            nickname: global.usersData[userId].nickname, 
            level: global.usersData[userId].level,
            userPriority: global.usersData[userId].userPriority,
            version: global.usersData[userId].version,
            xp: global.usersData[userId].xp
        });
    } else {
        res.status(401).send('Invalid password');
    }
});

module.exports = router;