import dotenv from 'dotenv';
import winston from 'winston';
import ArbitrageSynchronizer from './arbitrageSynchronizer.js';

dotenv.config();

// Configure global logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'app.log' }),
        new winston.transports.Console()
    ]
});

// Configuration for DEXs and tokens
const config = {
    dexes: [
        'PancakeSwap',
        'THENA',
        'DODORouter',
        'PancakeSwapStableswap',
        'UnchainXRouter'
    ],
    // Base assets (major tokens)
    baseAssets: [
        'BNB',   // BNB Chain native token
        'USDT',  // Tether
        'BUSD',  // Binance USD
        'ETH',   // Ethereum
        'USDC'   // USD Coin
    ],
    // Trading pairs (DeFi tokens)
    tradingAssets: [
        'CAKE',  // PancakeSwap
        'XVS',   // Venus
        'BAKE',  // BakerySwap
        'THE',   // THENA
        'DODO',  // DODO
        'ANKR',  // Ankr
        'ALPHA', // Alpha Finance
        'BAND',  // Band Protocol
        'BSW',   // Biswap
        'LINK'   // Chainlink
    ],
    // Stable pairs for arbitrage
    stableAssets: [
        'DAI',   // DAI Stablecoin
        'TUSD',  // TrueUSD
        'UST',   // TerraUSD
        'FRAX',  // Frax
        'MAI'    // Mai
    ],
    // Performance and safety settings
    settings: {
        minProfitThreshold: 2.5,    // 2.5% minimum profit
        executionTimeLimit: 500,     // 500ms execution window
        maxRequestsPerSecond: 20,    // Stay under Alchemy's 25 rps limit
        batchSize: 10,               // Number of requests to batch
        batchTimeout: 100,           // ms to wait before processing incomplete batch
        cacheTimeout: 1000,          // ms to cache blockchain data
        maxConcurrentPairs: 50,      // Maximum number of pairs to monitor concurrently
        rotationInterval: 60000      // ms between pair rotations (1 minute)
    }
};

// Main application function
async function main() {
    try {
        logger.info('Initializing Advanced Arbitrage Flash-loan System (A.F.A.S)');
        
        // Create synchronizer instance
        const synchronizer = new ArbitrageSynchronizer(config);
        
        // Start the synchronization process
        synchronizer.start();

        // Periodic performance reporting
        setInterval(() => {
            const performanceReport = synchronizer.generatePerformanceReport();
            logger.info('Performance Report', performanceReport);
        }, 60000); // Report every minute

        // Graceful shutdown handling
        process.on('SIGINT', () => {
            logger.warn('Received shutdown signal. Stopping synchronizer...');
            synchronizer.stop();
            process.exit(0);
        });

    } catch (error) {
        logger.error('Initialization failed', { error: error.message });
        process.exit(1);
    }
}

// Run the main application
main();
