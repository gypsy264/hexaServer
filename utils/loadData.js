const fs = require('fs');
const path = require('path');
const { broadcastUserData } = require('./broadcast');

function loadUserData(wss) {
    fs.readFile(path.join(__dirname, '../data/userData.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return;
        }
        try {
            const usersData = JSON.parse(data).userData;
            global.usersData = usersData;
            console.log('User data reloaded');
            broadcastUserData(wss, usersData);
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    });
}

function loadUserAccounts() {
    fs.readFile(path.join(__dirname, '../data/userAccounts.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user accounts:', err);
            return;
        }
        try {
            global.userAccounts = JSON.parse(data).users;
            console.log('User accounts reloaded');
        } catch (err) {
            console.error('Error parsing user accounts:', err);
        }
    });
}

module.exports = {
    loadUserData,
    loadUserAccounts
};