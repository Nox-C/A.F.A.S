class PairConfiguration {
    // Historical arbitrage opportunities based on past data
    static HISTORICAL_PAIRS = {
        // Stable-Stable pairs (known for consistent arbitrage)
        stableArbitrage: [
            { pair: ['USDT', 'BUSD'], minSpread: 0.1, exchanges: ['PancakeSwap', 'THENA'] },
            { pair: ['USDT', 'USDC'], minSpread: 0.1, exchanges: ['PancakeSwap', 'DODORouter'] },
            { pair: ['BUSD', 'DAI'], minSpread: 0.15, exchanges: ['PancakeSwap', 'UnchainXRouter'] },
            { pair: ['USDC', 'DAI'], minSpread: 0.15, exchanges: ['THENA', 'DODORouter'] },
            { pair: ['USDT', 'MAI'], minSpread: 0.2, exchanges: ['PancakeSwapStableswap', 'THENA'] }
        ],

        // Base asset pairs (high volume, frequent opportunities)
        baseArbitrage: [
            { pair: ['BNB', 'ETH'], minSpread: 0.3, exchanges: ['PancakeSwap', 'BiswapRouter'] },
            { pair: ['BNB', 'USDT'], minSpread: 0.25, exchanges: ['PancakeSwap', 'ApeSwapRouter'] },
            { pair: ['ETH', 'USDT'], minSpread: 0.25, exchanges: ['THENA', 'MDEXRouter'] },
            { pair: ['BNB', 'BUSD'], minSpread: 0.25, exchanges: ['PancakeSwap', 'UnchainXRouter'] },
            { pair: ['ETH', 'BUSD'], minSpread: 0.3, exchanges: ['DODORouter', 'BiswapRouter'] }
        ],

        // DeFi blue chips (proven arbitrage history)
        defiArbitrage: [
            { pair: ['CAKE', 'BNB'], minSpread: 0.5, exchanges: ['PancakeSwap', 'ApeSwapRouter'] },
            { pair: ['XVS', 'BNB'], minSpread: 0.6, exchanges: ['PancakeSwap', 'THENA'] },
            { pair: ['LINK', 'BNB'], minSpread: 0.5, exchanges: ['PancakeSwap', 'MDEXRouter'] },
            { pair: ['AAVE', 'ETH'], minSpread: 0.7, exchanges: ['DODORouter', 'THENA'] },
            { pair: ['UNI', 'ETH'], minSpread: 0.6, exchanges: ['PancakeSwap', 'BiswapRouter'] }
        ],

        // Farm token pairs (high volatility)
        farmArbitrage: [
            { pair: ['CAKE', 'USDT'], minSpread: 0.8, exchanges: ['PancakeSwap', 'ApeSwapRouter'] },
            { pair: ['BAKE', 'BNB'], minSpread: 0.9, exchanges: ['PancakeSwap', 'BabySwapRouter'] },
            { pair: ['BANANA', 'BNB'], minSpread: 1.0, exchanges: ['ApeSwapRouter', 'PancakeSwap'] },
            { pair: ['BELT', 'BNB'], minSpread: 1.0, exchanges: ['PancakeSwap', 'BiswapRouter'] },
            { pair: ['ALPACA', 'BUSD'], minSpread: 0.9, exchanges: ['PancakeSwap', 'THENA'] }
        ]
    };

    // High-risk, high-reward opportunities
    static VOLATILE_PAIRS = {
        // GameFi tokens (high volatility)
        gamefi: [
            { pair: ['AXS', 'BNB'], minSpread: 1.2, volatilityScore: 8 },
            { pair: ['MBOX', 'BUSD'], minSpread: 1.5, volatilityScore: 9 },
            { pair: ['TLM', 'BNB'], minSpread: 1.4, volatilityScore: 8 },
            { pair: ['HERO', 'USDT'], minSpread: 1.6, volatilityScore: 9 },
            { pair: ['RACA', 'BUSD'], minSpread: 1.5, volatilityScore: 8 }
        ],

        // NFT project tokens
        nft: [
            { pair: ['NFT', 'BNB'], minSpread: 1.8, volatilityScore: 9 },
            { pair: ['CEEK', 'BUSD'], minSpread: 1.6, volatilityScore: 8 },
            { pair: ['SFUND', 'BNB'], minSpread: 1.7, volatilityScore: 9 },
            { pair: ['BSCPAD', 'BUSD'], minSpread: 1.5, volatilityScore: 8 },
            { pair: ['CHESS', 'BNB'], minSpread: 1.4, volatilityScore: 7 }
        ]
    };

    // New token monitoring configuration
    static NEW_TOKEN_CONFIG = {
        // Minimum requirements for new token monitoring
        requirements: {
            minLiquidityUSD: 100000,    // Minimum liquidity in USD
            minHoldersCount: 500,       // Minimum number of holders
            maxHoldingByTop10: 50,      // Max percentage held by top 10 wallets
            minPairAge: 3600,           // Minimum age of trading pair in seconds
            requiredPairs: ['BNB', 'USDT', 'BUSD'] // Must have these trading pairs
        },

        // Monitoring parameters
        monitoring: {
            initialCheckInterval: 10000,    // Check every 10 seconds initially
            standardCheckInterval: 60000,   // Regular check interval
            monitoringDuration: 604800,     // Monitor for 7 days
            volatilityThreshold: 20,        // Alert if price changes more than 20% in 5 minutes
            volumeIncreaseThreshold: 200    // Alert if volume increases 200% in 1 hour
        },

        // Risk management
        riskManagement: {
            maxExposurePercent: 1,      // Maximum exposure as percentage of total capital
            maxSlippageTolerance: 3,    // Maximum slippage tolerance in percentage
            minLiquidityRatio: 10,      // Minimum ratio of liquidity to trade size
            maxHoldingTime: 180         // Maximum holding time in seconds
        }
    };

    // Get historically profitable pairs
    static getHistoricalPairs() {
        const allPairs = [];
        Object.values(this.HISTORICAL_PAIRS).forEach(category => {
            category.forEach(pair => allPairs.push(pair));
        });
        return allPairs;
    }

    // Get volatile pairs for high-risk opportunities
    static getVolatilePairs() {
        const allPairs = [];
        Object.values(this.VOLATILE_PAIRS).forEach(category => {
            category.forEach(pair => allPairs.push(pair));
        });
        return allPairs;
    }

    // Get monitoring configuration for new tokens
    static getNewTokenConfig() {
        return this.NEW_TOKEN_CONFIG;
    }

    // Calculate optimal batch size based on pair count
    static calculateOptimalBatchSize(pairCount) {
        // Ensure we stay under Alchemy's rate limits
        const maxRequestsPerSecond = 20;
        const averageRequestsPerPair = 2; // Price + liquidity check
        return Math.floor(maxRequestsPerSecond / (pairCount * averageRequestsPerPair));
    }

    // Prioritize pairs based on historical profitability
    static prioritizePairs(pairs, historicalData) {
        return pairs.sort((a, b) => {
            const aScore = this.calculatePriorityScore(a, historicalData);
            const bScore = this.calculatePriorityScore(b, historicalData);
            return bScore - aScore;
        });
    }

    // Calculate priority score for a pair
    static calculatePriorityScore(pair, historicalData) {
        const baseScore = pair.minSpread || 0;
        const volatilityBonus = pair.volatilityScore || 0;
        const historicalSuccess = historicalData[pair.pair.join('-')] || 0;
        
        return baseScore + (volatilityBonus * 0.5) + (historicalSuccess * 2);
    }
}

export default PairConfiguration;
