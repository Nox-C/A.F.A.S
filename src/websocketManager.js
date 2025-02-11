const WebSocket = require('ws');
const config = require('./config');

function connectToSmartWebSocket() {
    const ws = new WebSocket(config.MAINNET_WS);
    
    ws.on('open', () => {
        console.log('Connected to Smart WebSocket');
        // Subscribe to price updates from multiple DEXs
    });

    ws.on('message', (data) => {
        // Handle incoming price data
        console.log('Data from Smart WebSocket:', data);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('Disconnected from Smart WebSocket');
    });
}

connectToSmartWebSocket();
