import EventEmitter from 'events';
import winston from 'winston';

class DataGraph extends EventEmitter {
    constructor(config) {
        super();

        // Configuration
        this.config = config;
        this.assets = config.assets || [];
        this.assetPairs = config.assetPairs || [];
        this.dexes = config.dexes || [];

        // Logging
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'data-graph.log' }),
                new winston.transports.Console()
            ]
        });

        // Configuration for opportunity detection
        this.opportunityConfig = {
            absoluteDifferenceCutoff: config.absoluteDifferenceCutoff || 0.01,
            percentageDifferenceThreshold: config.percentageDifferenceThreshold || 2.5
        };

        // Initialize the structured data matrix
        this.dataMatrix = this.initializeDataMatrix();

        // Rolling window configuration
        this.rollingWindowSize = config.rollingWindowSize || 10;
        this.dataWindow = this.initializeDataWindow();
    }

    // Initialize data matrix with a vertical asset structure and horizontal DEX columns
    initializeDataMatrix() {
        const matrix = {};

        // Combine assets and asset pairs
        const allEntities = [...this.assets, ...this.assetPairs];

        allEntities.forEach(entity => {
            matrix[entity] = {};
            this.dexes.forEach(dex => {
                matrix[entity][dex] = {
                    price: {
                        current: null,
                        previous: null,
                        timestamps: {
                            current: null,
                            previous: null
                        }
                    },
                    volume: {
                        current: null,
                        previous: null,
                        timestamps: {
                            current: null,
                            previous: null
                        }
                    },
                    liquidity: {
                        current: null,
                        previous: null,
                        timestamps: {
                            current: null,
                            previous: null
                        }
                    }
                };
            });
        });

        return matrix;
    }

    // Initialize rolling data window
    initializeDataWindow() {
        const window = {};
        const allEntities = [...this.assets, ...this.assetPairs];

        allEntities.forEach(entity => {
            window[entity] = {};
            this.dexes.forEach(dex => {
                window[entity][dex] = {
                    prices: [],
                    volumes: [],
                    liquidities: []
                };
            });
        });

        return window;
    }

    // Update data for a specific asset/asset pair on a specific DEX
    updateData(entity, dex, dataType, value) {
        if (!this.dataMatrix[entity] || !this.dataMatrix[entity][dex]) {
            this.logger.warn(`Invalid entity or DEX: ${entity}, ${dex}`);
            return false;
        }

        const currentTime = Date.now();
        const entityData = this.dataMatrix[entity][dex];
        const dataWindow = this.dataWindow[entity][dex];

        // Shift and update current data
        entityData[dataType].previous = entityData[dataType].current;
        entityData[dataType].timestamps.previous = entityData[dataType].timestamps.current;
        entityData[dataType].current = value;
        entityData[dataType].timestamps.current = currentTime;

        // Update rolling window
        dataWindow[`${dataType}s`].push(value);
        if (dataWindow[`${dataType}s`].length > this.rollingWindowSize) {
            dataWindow[`${dataType}s`].shift();
        }

        // Check for arbitrage opportunities after each data update
        this.checkArbitrageOpportunities(entity);

        return true;
    }

    // Check for arbitrage opportunities for a specific asset/asset pair
    checkArbitrageOpportunities(entity) {
        // Ensure all DEXes have data for this entity
        const dexData = this.dexes.map(dex => ({
            dex,
            price: this.dataMatrix[entity][dex].price.current
        })).filter(data => data.price !== null);

        if (dexData.length < 2) return;

        // Sort prices to identify potential arbitrage
        const sortedPrices = dexData.sort((a, b) => a.price - b.price);
        const lowestPriceDex = sortedPrices[0];
        const highestPriceDex = sortedPrices[sortedPrices.length - 1];

        const absoluteDifference = Math.abs(highestPriceDex.price - lowestPriceDex.price);
        const percentageDifference = (absoluteDifference / lowestPriceDex.price) * 100;

        // Opportunity detection based on configurable thresholds
        const opportunityDetected = 
            absoluteDifference >= this.opportunityConfig.absoluteDifferenceCutoff &&
            percentageDifference >= this.opportunityConfig.percentageDifferenceThreshold;

        if (opportunityDetected) {
            const opportunityDetails = {
                entity,
                buyDex: lowestPriceDex.dex,
                sellDex: highestPriceDex.dex,
                buyPrice: lowestPriceDex.price,
                sellPrice: highestPriceDex.price,
                absoluteDifference,
                percentageDifference
            };

            // Emit event for arbitrage opportunity
            this.emit('arbitrageOpportunity', opportunityDetails);
            
            this.logger.info('Arbitrage Opportunity Detected', opportunityDetails);
        }
    }

    // Get current data matrix state
    getDataMatrix() {
        return this.dataMatrix;
    }

    // Get rolling window data
    getRollingWindowData() {
        return this.dataWindow;
    }

    // Export data for external analysis
    exportData() {
        return {
            dataMatrix: this.dataMatrix,
            rollingWindow: this.dataWindow,
            opportunityConfig: this.opportunityConfig
        };
    }

    // Reset entire data structure
    reset() {
        this.dataMatrix = this.initializeDataMatrix();
        this.dataWindow = this.initializeDataWindow();
    }
}

export default DataGraph;
