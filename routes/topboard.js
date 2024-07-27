const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { broadcastUserData } = require('../utils/broadcast');

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
            broadcastUserData(global.wss, usersData);
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    });
}

// Initial load of user data
loadUserData();

// Watch for changes to userData.json and reload user data
fs.watchFile(path.join(__dirname, '../data/userData.json'), (curr, prev) => {
    console.log('userData.json file changed, reloading user data...');
    loadUserData();
});

// Endpoint to get top 100 users by level
router.get('/top100', (req, res) => {
    console.log('Fetching top 100 users'); // Debugging log
    if (!usersData) {
        return res.status(500).send('User data not loaded');
    }
    const sortedUsers = Object.entries(usersData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.level - a.level)
        .slice(0, 100);

    console.log('Sorted users:', sortedUsers); // Debugging log
    res.json({ userData: sortedUsers });
});

module.exports = { router, loadUserData };