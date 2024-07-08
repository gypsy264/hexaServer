const express = require('express');
const fs = require('fs');
const { broadcastUserData } = require('../utils/broadcast');

const router = express.Router();

// Endpoint to get user data
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    if (global.usersData[userId]) {
        res.json(global.usersData[userId]);
    } else {
        res.status(404).send('User not found');
    }
});

// Endpoint to update user data
router.post('/:userId', (req, res) => {
    const userId = req.params.userId;
    global.usersData[userId] = req.body;
    fs.writeFile('./data/userData.json', JSON.stringify({ userData: global.usersData }, null, 2), (err) => {
        if (err) {
            console.error('Error writing user data:', err);
            res.status(500).send('Error saving user data');
            return;
        }
        broadcastUserData();
        res.send('User data updated');
    });
});

module.exports = router;