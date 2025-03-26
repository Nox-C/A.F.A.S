import { performance } from 'perf_hooks';
import { validatePriceData } from '../utils/tradingUtils.js';

class AnalysisHub {
    constructor(config) {
        this.config = config;
        
        // Pre-defined DEXs and tokens for fixed positions
        this.dexes = [
            'PancakeSwap',
            'THENA',
            'DODORouter',
            'PancakeSwapStableswap',
            'UnchainXRouter'
        ];

        this.tokens = [
            'BNB',
            'CAKE',
            'USDT',
            'XVS',
            'BAKE'
        ];

        // Initialize the fixed-position matrix
        // Using a column-major layout for better cache locality when comparing prices across DEXs
        // [DEX][Token] layout is more efficient for our use case as we frequently compare
        // prices of the same token across different DEXs
        this.priceMatrix = new Float64Array(this.dexes.length * this.tokens.length);
        this.liquidityMatrix = new Float64Array(this.dexes.length * this.tokens.length);
        this.timestampMatrix = new Float64Array(this.dexes.length * this.tokens.length);
        
        // Create lookup maps for O(1) index access
        this.dexIndices = new Map(this.dexes.map((dex, index) => [dex, index]));
        this.tokenIndices = new Map(this.tokens.map((token, index) => [token, index]));

        // Opportunity detection thresholds
        this.minProfitThreshold = config.minProfitThreshold || 0.025; // 2.5%
        this.maxAgeMicroseconds = config.maxAgeMicroseconds || 500000; // 500ms

        // Performance monitoring
        this.metrics = {
            updates: 0,
            comparisons: 0,
            opportunities: 0,
            lastUpdateTime: performance.now()
        };
    }

    // Get the flat array index for a given DEX and token
    getIndex(dex, token) {
        const dexIndex = this.dexIndices.get(dex);
        const tokenIndex = this.tokenIndices.get(token);
        
        if (dexIndex === undefined || tokenIndex === undefined) {
            throw new Error(`Invalid DEX (${dex}) or token (${token})`);
        }

        // Column-major order: (dexIndex * numTokens + tokenIndex)
        return dexIndex * this.tokens.length + tokenIndex;
    }

    // Update price data with atomic timestamp
    updatePrice(dex, token, price, timestamp) {
        const index = this.getIndex(dex, token);
        this.priceMatrix[index] = price;
        this.timestampMatrix[index] = timestamp;
        this.metrics.updates++;

        // Return indices for quick access in opportunity detection
        return { dexIndex: this.dexIndices.get(dex), tokenIndex: this.tokenIndices.get(token) };
    }

    // Update liquidity data
    updateLiquidity(dex, token, liquidity) {
        const index = this.getIndex(dex, token);
        this.liquidityMatrix[index] = liquidity;
    }

    // Check for arbitrage opportunities for a specific token
    findArbitrageOpportunities(token) {
        const opportunities = [];
        const tokenIndex = this.tokenIndices.get(token);
        const currentTime = performance.now();

        // Compare prices across all DEX pairs
        for (let i = 0; i < this.dexes.length; i++) {
            for (let j = i + 1; j < this.dexes.length; j++) {
                this.metrics.comparisons++;

                const buyIndex = i * this.tokens.length + tokenIndex;
                const sellIndex = j * this.tokens.length + tokenIndex;

                const buyPrice = this.priceMatrix[buyIndex];
                const sellPrice = this.priceMatrix[sellIndex];
                const buyTimestamp = this.timestampMatrix[buyIndex];
                const sellTimestamp = this.timestampMatrix[sellIndex];

                // Skip if any price is 0 or undefined
                if (!buyPrice || !sellPrice) continue;

                // Verify data freshness
                const maxAge = Math.max(
                    currentTime - buyTimestamp,
                    currentTime - sellTimestamp
                );

                if (maxAge > this.maxAgeMicroseconds) continue;

                // Calculate profit potential
                const profitRatio = (sellPrice - buyPrice) / buyPrice;

                if (profitRatio > this.minProfitThreshold) {
                    opportunities.push({
                        token,
                        buyDex: this.dexes[i],
                        sellDex: this.dexes[j],
                        buyPrice,
                        sellPrice,
                        profitRatio,
                        buyLiquidity: this.liquidityMatrix[buyIndex],
                        sellLiquidity: this.liquidityMatrix[sellIndex],
                        timestamp: Math.min(buyTimestamp, sellTimestamp)
                    });
                    this.metrics.opportunities++;
                }
            }
        }

        return opportunities;
    }

    // Get a snapshot of current prices for a token across all DEXs
    getPriceSnapshot(token) {
        const tokenIndex = this.tokenIndices.get(token);
        const snapshot = {};

        for (let i = 0; i < this.dexes.length; i++) {
            const index = i * this.tokens.length + tokenIndex;
            snapshot[this.dexes[i]] = {
                price: this.priceMatrix[index],
                liquidity: this.liquidityMatrix[index],
                timestamp: this.timestampMatrix[index]
            };
        }

        return snapshot;
    }

    // Get performance metrics
    getMetrics() {
        const currentTime = performance.now();
        const timeDiff = (currentTime - this.metrics.lastUpdateTime) / 1000; // Convert to seconds

        return {
            ...this.metrics,
            updatesPerSecond: this.metrics.updates / timeDiff,
            comparisonsPerSecond: this.metrics.comparisons / timeDiff,
            opportunitiesPerSecond: this.metrics.opportunities / timeDiff
        };
    }

    // Reset metrics
    resetMetrics() {
        this.metrics = {
            updates: 0,
            comparisons: 0,
            opportunities: 0,
            lastUpdateTime: performance.now()
        };
    }
}

export default AnalysisHub;
