import WebSocket from 'ws';
import EventEmitter from 'events';
import winston from 'winston';
import DataGraph from './dataGraph.js';
import AtomicTimestampManager from './utils/atomicTimestampManager.js';
import ParallelProcessor from './utils/parallelProcessor.js';
import TransactionValidator from './utils/transactionValidator.js';
import AnalysisHub from './analysis/analysisHub.js';
import MatrixVisualizer from './analysis/matrixVisualizer.js';
import { validatePriceData, measureExecutionTime } from './utils/tradingUtils.js';

class WebSocketManager extends EventEmitter {
    #visualizationInterval;
    #performanceMetrics;
    #connections;
    #logger;
    #dataGraph;
    #timestampManager;
    #parallelProcessor;
    #analysisHub;
    #transactionValidator;
    #visualizer;
    #config;
    #dexes;
    #assets;
    #assetPairs;
    constructor(config) {
        super();

        // Configuration
        this.#config = config;
        this.#dexes = config.dexes || [];
        this.#assets = config.assets || [];
        this.#assetPairs = config.assetPairs || [];

        // Initialize core components
        this.#dataGraph = new DataGraph(config);
        this.#timestampManager = new AtomicTimestampManager(50); // 50ms max drift
        this.#parallelProcessor = new ParallelProcessor(config);
        this.#analysisHub = new AnalysisHub(config);
        this.#transactionValidator = new TransactionValidator(config);
        
        // Initialize visualization if enabled
        if (config.enableVisualization) {
            this.#visualizer = new MatrixVisualizer(this.#analysisHub);
            this.startVisualization();
        }
        
        // Initialize parallel processing
        this.#parallelProcessor.initialize();

        // WebSocket connections storage
        this.#connections = {};
        
        // Performance monitoring
        this.#performanceMetrics = {
            messageCount: 0,
            processedCount: 0,
            averageProcessingTime: 0,
            lastMetricsReset: Date.now()
        };

        // Set up periodic metrics reset
        setInterval(() => this.resetMetrics(), 3600000); // Reset every hour

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
        this.#dataGraph.on('arbitrageOpportunity', (opportunity) => {
            this.emit('arbitrageOpportunity', opportunity);
        });
    }

    // Initialize WebSocket connections for each DEX
    initializeConnections() {
        this.#dexes.forEach((dex) => {
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
    async processIncomingData(dex, rawData) {
        const startTime = measureExecutionTime();
        this.#performanceMetrics.messageCount++;

        try {
            const parsedData = this.parseWebSocketData(dex, rawData);
            
            if (parsedData) {
                const { entity, price, volume, liquidity } = parsedData;
                const timestamp = Date.now();
                
                // Update AnalysisHub with latest data
                this.#analysisHub.updatePrice(dex, entity, price, timestamp);
                this.#analysisHub.updateLiquidity(dex, entity, liquidity);
                
                // Register update with atomic timestamp manager
                const syncData = this.#timestampManager.registerDexUpdate(dex, entity, {
                    price,
                    volume,
                    liquidity,
                    timestamp
                });

                if (syncData) {
                    // Find arbitrage opportunities
                    const opportunities = this.#analysisHub.findArbitrageOpportunities(entity);
                    
                    // Validate opportunities
                    for (const opportunity of opportunities) {
                        const validation = this.#transactionValidator.validateOpportunity({
                            ...opportunity,
                            timestamp,
                            gasPrice: this.getCurrentGasPrice()
                        });

                        if (validation.isValid) {
                            this.emit('arbitrageOpportunity', {
                                ...opportunity,
                                validation: validation.metrics
                            });
                        } else {
                            this.#logger.debug('Opportunity rejected', {
                                reasons: validation.reasons,
                                metrics: validation.metrics
                            });
                        }
                    }
                }

                // Update DataGraph for historical analysis
                this.#dataGraph.updateData(entity, dex, 'price', price);
                this.#dataGraph.updateData(entity, dex, 'volume', volume);
                this.#dataGraph.updateData(entity, dex, 'liquidity', liquidity);
            }

            // Update performance metrics
            this.#performanceMetrics.processedCount++;
            const processingTime = measureExecutionTime(startTime);
            this.updatePerformanceMetrics(processingTime);

        } catch (error) {
            this.#logger.error(`Error processing WebSocket data for ${dex}`, { error, rawData });
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
            this.#logger.error(`Parsing error for ${dex}`, { error, rawData });
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
                
                this.#connections[dex] = newConnection;
            } catch (error) {
                this.#logger.error(`Reconnection failed for ${dex}`, { error });
            }
        }, 5000); // 5-second delay before reconnecting
    }

    // Attach event listeners to new connection
    attachEventListeners(dex, connection) {
        connection.on('open', () => {
            this.#logger.info(`Reconnected WebSocket for ${dex}`);
            this.subscribeToAssets(connection, dex);
        });
        connection.on('message', (data) => this.processIncomingData(dex, data));
        connection.on('error', (error) => this.#logger.error(`WebSocket error for ${dex}`, { error }));
        connection.on('close', () => this.reconnect(dex));
    }

    // Close all WebSocket connections
    closeAllConnections() {
        Object.values(this.#connections).forEach(connection => {
            if (connection.readyState === WebSocket.OPEN) {
                connection.close();
            }
        });
        this.#connections = {};
    }

    // Export data for external analysis
    exportData() {
        return this.#dataGraph.exportData();
    }

    // Analyze synchronized data from multiple DEXs
    async analyzeSynchronizedData(syncData) {
        const opportunities = [];
        const { updates } = syncData;

        // Group updates by token/pair
        const entityUpdates = new Map();
        for (const update of updates) {
            const { dex, data } = update;
            const { entity } = data;
            
            if (!entityUpdates.has(entity)) {
                entityUpdates.set(entity, []);
            }
            entityUpdates.get(entity).push({ dex, ...data });
        }

        // Analyze each entity's updates
        for (const [entity, updates] of entityUpdates) {
            if (updates.length < 2) continue; // Need at least 2 DEXs for arbitrage

            // Find potential arbitrage opportunities
            for (let i = 0; i < updates.length; i++) {
                for (let j = i + 1; j < updates.length; j++) {
                    const dex1 = updates[i];
                    const dex2 = updates[j];

                    // Determine buy and sell DEX based on price
                    const [buyDex, sellDex] = dex1.price < dex2.price 
                        ? [dex1, dex2] 
                        : [dex2, dex1];

                    // Submit for parallel analysis
                    const analysisResult = await this.#parallelProcessor.submitTask({
                        buyDex: buyDex.dex,
                        sellDex: sellDex.dex,
                        token: entity,
                        buyPrice: buyDex.price,
                        sellPrice: sellDex.price,
                        timestamp: syncData.timestamp,
                        liquidityBuy: buyDex.liquidity,
                        liquiditySell: sellDex.liquidity
                    });

                    if (analysisResult) {
                        opportunities.push(analysisResult);
                    }
                }
            }
        }

        return opportunities;
    }

    // Update performance metrics
    updatePerformanceMetrics(processingTime) {
        const currentTime = Date.now();
        const timeSinceReset = currentTime - this.#performanceMetrics.lastMetricsReset;

        // Reset metrics every hour
        if (timeSinceReset >= 3600000) {
            this.#performanceMetrics = {
                messageCount: 0,
                processedCount: 0,
                averageProcessingTime: 0,
                lastMetricsReset: currentTime
            };
            return;
        }

        // Update average processing time
        this.#performanceMetrics.averageProcessingTime = 
            (this.#performanceMetrics.averageProcessingTime * (this.#performanceMetrics.processedCount - 1) + processingTime) /
            this.#performanceMetrics.processedCount;

        // Log metrics every minute
        if (timeSinceReset % 60000 < 1000) {
            this.#logger.info('WebSocket Performance Metrics', {
                metrics: this.#performanceMetrics,
                messagesPerSecond: this.#performanceMetrics.messageCount / (timeSinceReset / 1000),
                processedPerSecond: this.#performanceMetrics.processedCount / (timeSinceReset / 1000)
            });
        }
    }

    // Cleanup resources
    async shutdown() {
        this.closeAllConnections();
        await this.#parallelProcessor.shutdown();
        if (this.#visualizer) {
            clearInterval(this.#visualizationInterval);
        }
    }

    startVisualization() {
        // Update visualization every 500ms
        this.#visualizationInterval = setInterval(() => {
            this.#visualizer.update();
        }, 500);
    }

    resetMetrics() {
        this.#performanceMetrics = {
            messageCount: 0,
            processedCount: 0,
            averageProcessingTime: 0,
            lastMetricsReset: Date.now()
        };
        this.#transactionValidator.resetMetrics();
        this.#analysisHub.resetMetrics();
    }

    getCurrentGasPrice() {
        // This should be implemented to get the current gas price from your provider
        // For now, return a default value
        return 5; // 5 Gwei
    }
}

export default WebSocketManager;
