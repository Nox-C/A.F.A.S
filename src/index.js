require('dotenv').config();
const winston = require('winston');
const ArbitrageSynchronizer = require('./arbitrageSynchronizer');

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
    tokens: [
        'BNB', 
        'CAKE', 
        'USDT', 
        'XVS', 
        'BAKE'
    ],
    minProfitThreshold: 2.5, // 2.5% minimum profit
    executionTimeLimit: 500 // 500ms execution window
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
