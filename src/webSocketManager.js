const WebSocket = require('ws');
const EventEmitter = require('events');
const winston = require('winston');
const DataGraph = require('./dataGraph');

class WebSocketManager extends EventEmitter {
    constructor(config) {
        super();

        // Configuration
        this.config = config;
        this.dexes = config.dexes || [];
        this.assets = config.assets || [];
        this.assetPairs = config.assetPairs || [];

        // Initialize DataGraph
        this.dataGraph = new DataGraph(config);

        // WebSocket connections storage
        this.connections = {};

        // Logging
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'websocket-manager.log' }),
                new winston.transports.Console()
            ]
        });

        // Forward arbitrage opportunities from DataGraph
        this.dataGraph.on('arbitrageOpportunity', (opportunity) => {
            this.emit('arbitrageOpportunity', opportunity);
        });
    }

    // Initialize WebSocket connections for each DEX
    initializeConnections() {
        this.dexes.forEach((dex) => {
            try {
                const websocketUrl = this.getWebSocketUrl(dex);
                const connection = new WebSocket(websocketUrl);

                connection.on('open', () => {
                    this.logger.info(`WebSocket connection established for ${dex}`);
                    this.subscribeToAssets(connection, dex);
                });

                connection.on('message', (rawData) => {
                    this.processIncomingData(dex, rawData);
                });

                connection.on('error', (error) => {
                    this.logger.error(`WebSocket error for ${dex}`, { error });
                });

                connection.on('close', () => {
                    this.logger.warn(`WebSocket connection closed for ${dex}. Attempting reconnect...`);
                    this.reconnect(dex);
                });

                this.connections[dex] = connection;
            } catch (error) {
                this.logger.error(`Failed to initialize WebSocket for ${dex}`, { error });
            }
        });
    }

    // Subscribe to assets for a specific DEX
    subscribeToAssets(connection, dex) {
        const allAssets = [...this.assets, ...this.assetPairs];
        const subscriptionMessage = JSON.stringify({
            type: 'subscribe',
            dex: dex,
            assets: allAssets
        });
        connection.send(subscriptionMessage);
    }

    // Get WebSocket URL for a specific DEX
    getWebSocketUrl(dex) {
        const dexWebSocketUrls = {
            'PancakeSwap': 'wss://stream.pancakeswap.finance/ws',
            'THENA': 'wss://ws.thena.fi/socket',
            'DODORouter': 'wss://ws.dodoex.io/socket',
            'PancakeSwapStableswap': 'wss://stream.pancakeswap.finance/stableswap',
            'UnchainXRouter': 'wss://ws.unchainx.io/socket',
            'default': 'wss://default-websocket-url.com'
        };
        return dexWebSocketUrls[dex] || dexWebSocketUrls['default'];
    }

    // Process incoming WebSocket data
    processIncomingData(dex, rawData) {
        try {
            const parsedData = this.parseWebSocketData(dex, rawData);
            
            if (parsedData) {
                const { entity, price, volume, liquidity } = parsedData;
                
                // Update DataGraph with received information
                this.dataGraph.updateData(entity, dex, 'price', price);
                this.dataGraph.updateData(entity, dex, 'volume', volume);
                this.dataGraph.updateData(entity, dex, 'liquidity', liquidity);
            }
        } catch (error) {
            this.logger.error(`Error processing WebSocket data for ${dex}`, { error, rawData });
        }
    }

    // Parse WebSocket data for specific DEX
    parseWebSocketData(dex, rawData) {
        try {
            // DEX-specific parsing logic
            switch(dex) {
                case 'PancakeSwap':
                    return this.parsePancakeSwapData(rawData);
                case 'THENA':
                    return this.parseTHENAData(rawData);
                case 'DODORouter':
                    return this.parseDODORouterData(rawData);
                default:
                    return this.parseDefaultData(rawData);
            }
        } catch (error) {
            this.logger.error(`Parsing error for ${dex}`, { error, rawData });
            return null;
        }
    }

    // Specific parsing methods for different DEXs
    parsePancakeSwapData(rawData) {
        const data = JSON.parse(rawData);
        return {
            entity: data.symbol || data.pair,
            price: parseFloat(data.price),
            volume: parseFloat(data.volume),
            liquidity: parseFloat(data.liquidity)
        };
    }

    parseTHENAData(rawData) {
        const data = JSON.parse(rawData);
        return {
            entity: data.tokenSymbol || data.pair,
            price: parseFloat(data.currentPrice),
            volume: parseFloat(data.tradeVolume),
            liquidity: parseFloat(data.poolLiquidity)
        };
    }

    parseDODORouterData(rawData) {
        const data = JSON.parse(rawData);
        return {
            entity: data.token || data.pair,
            price: parseFloat(data.marketPrice),
            volume: parseFloat(data.tradeVolume),
            liquidity: parseFloat(data.poolLiquidity)
        };
    }

    parseDefaultData(rawData) {
        const data = JSON.parse(rawData);
        return {
            entity: data.token || data.pair || 'UNKNOWN',
            price: parseFloat(data.price || 0),
            volume: parseFloat(data.volume || 0),
            liquidity: parseFloat(data.liquidity || 0)
        };
    }

    // Reconnection strategy
    reconnect(dex) {
        setTimeout(() => {
            try {
                const websocketUrl = this.getWebSocketUrl(dex);
                const newConnection = new WebSocket(websocketUrl);
                
                // Copy event listeners from previous connection
                this.attachEventListeners(dex, newConnection);
                
                this.connections[dex] = newConnection;
            } catch (error) {
                this.logger.error(`Reconnection failed for ${dex}`, { error });
            }
        }, 5000); // 5-second delay before reconnecting
    }

    // Attach event listeners to new connection
    attachEventListeners(dex, connection) {
        connection.on('open', () => {
            this.logger.info(`Reconnected WebSocket for ${dex}`);
            this.subscribeToAssets(connection, dex);
        });
        connection.on('message', (data) => this.processIncomingData(dex, data));
        connection.on('error', (error) => this.logger.error(`WebSocket error for ${dex}`, { error }));
        connection.on('close', () => this.reconnect(dex));
    }

    // Close all WebSocket connections
    closeAllConnections() {
        Object.values(this.connections).forEach(connection => {
            if (connection.readyState === WebSocket.OPEN) {
                connection.close();
            }
        });
    }

    // Export data for external analysis
    exportData() {
        return this.dataGraph.exportData();
    }
}

module.exports = WebSocketManager;
