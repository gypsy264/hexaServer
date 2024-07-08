const WebSocket = require('ws');

function broadcastUserData(wss) {
    if (!wss || !wss.clients) {
        console.error('wss or wss.clients is undefined');
        return;
    }

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ userData: global.usersData }));
        }
    });
}

module.exports = { broadcastUserData };