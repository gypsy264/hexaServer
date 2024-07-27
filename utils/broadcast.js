const WebSocket = require('ws');

function broadcastUserData(wss, usersData) {
    if (!wss) {
        console.error('WebSocket server not available');
        return;
    }

    if (!wss.clients || wss.clients.size === 0) {
        console.error('No WebSocket clients connected');
        return;
    }

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ userData: usersData }));
        } else {
            console.error(`Client not ready: state ${client.readyState}`);
        }
    });
}

module.exports = { broadcastUserData };