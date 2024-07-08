const fs = require('fs');

function loadUserData(wss) {
    fs.readFile('./data/userData.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return;
        }
        try {
            const usersData = JSON.parse(data).userData;
            console.log('User data reloaded');
            broadcastUserData(wss, usersData);
        } catch (err) {
            console.error('Error parsing user data:', err);
        }
    });
}

function loadUserAccounts() {
    fs.readFile('./data/userAccounts.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user accounts:', err);
            return;
        }
        try {
            const userAccounts = JSON.parse(data).users;
            console.log('User accounts reloaded');
        } catch (err) {
            console.error('Error parsing user accounts:', err);
        }
    });
}

function broadcastUserData(wss, usersData) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ userData: usersData }));
        }
    });
}

module.exports = {
    loadUserData,
    loadUserAccounts,
    broadcastUserData
};