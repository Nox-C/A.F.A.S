class FixedPositionMatrix {
    #matrix;
    #tokenIndexMap;
    #dexIndexMap;
    #tokens;
    #dexes;

    constructor(config) {
        this.#tokens = [
            // Base assets (0-4)
            'BNB', 'USDT', 'BUSD', 'ETH', 'USDC',
            
            // Major DeFi tokens (5-14)
            'CAKE', 'XVS', 'BAKE', 'THE', 'DODO',
            'ANKR', 'ALPHA', 'BAND', 'BSW', 'LINK',
            
            // Stablecoins (15-19)
            'DAI', 'TUSD', 'UST', 'FRAX', 'MAI',
            
            // Additional high-volume tokens (20-29)
            'WBNB', 'ADA', 'DOT', 'FIL', 'UNI',
            'AAVE', 'COMP', 'SNX', 'SUSHI', '1INCH',
            
            // Yield farming tokens (30-34)
            'BANANA', 'BELT', 'TWT', 'ALPACA', 'AUTO',
            
            // GameFi & NFT tokens (35-39)
            'AXS', 'MBOX', 'TLM', 'RACA', 'HERO',
            
            // BNB Chain ecosystem tokens (40-44)
            'BSCPAD', 'SFUND', 'CHESS', 'CEEK', 'NFT'
        ];

        this.#dexes = [
            'PancakeSwap',           // 0: Main DEX
            'THENA',                 // 1: AMM with concentrated liquidity
            'DODORouter',            // 2: PMM model
            'PancakeSwapStableswap', // 3: Stable pairs
            'UnchainXRouter',        // 4: Cross-chain
            'BiswapRouter',          // 5: Lower fees
            'ApeSwapRouter',         // 6: Yield farming focus
            'MDEXRouter',            // 7: Multi-chain
            'BabySwapRouter',        // 8: GameFi focus
            'KnightSwapRouter'       // 9: NFT focus
        ];

        // Create index maps for O(1) lookups
        this.#tokenIndexMap = new Map(this.#tokens.map((token, index) => [token, index]));
        this.#dexIndexMap = new Map(this.#dexes.map((dex, index) => [dex, index]));

        // Initialize the fixed position matrix
        this.initializeMatrix();
    }

    initializeMatrix() {
        const tokenCount = this.#tokens.length;
        const dexCount = this.#dexes.length;

        // Create 3D matrix: [token1][token2][dex] = { price, liquidity, timestamp }
        this.#matrix = Array(tokenCount).fill(null).map(() =>
            Array(tokenCount).fill(null).map(() =>
                Array(dexCount).fill(null).map(() => ({
                    price: null,
                    liquidity: null,
                    timestamp: null,
                    volume24h: null
                }))
            )
        );
    }

    // Update price data at fixed position
    updatePrice(token1, token2, dex, price, liquidity, timestamp, volume24h = null) {
        const [i, j] = this.getTokenIndices(token1, token2);
        const dexIndex = this.getDexIndex(dex);

        if (i !== -1 && j !== -1 && dexIndex !== -1) {
            this.#matrix[i][j][dexIndex] = {
                price,
                liquidity,
                timestamp,
                volume24h
            };
            // Also update reverse pair with inverse price
            this.#matrix[j][i][dexIndex] = {
                price: price ? 1 / price : null,
                liquidity,
                timestamp,
                volume24h
            };
            return true;
        }
        return false;
    }

    // Get price data from fixed position
    getPrice(token1, token2, dex) {
        const [i, j] = this.getTokenIndices(token1, token2);
        const dexIndex = this.getDexIndex(dex);

        if (i !== -1 && j !== -1 && dexIndex !== -1) {
            return this.#matrix[i][j][dexIndex];
        }
        return null;
    }

    // Get all prices for a token pair across all DEXs
    getAllPrices(token1, token2) {
        const [i, j] = this.getTokenIndices(token1, token2);
        if (i !== -1 && j !== -1) {
            return this.#matrix[i][j].map((data, dexIndex) => ({
                dex: this.#dexes[dexIndex],
                ...data
            }));
        }
        return [];
    }

    // Get token indices, maintaining consistent order
    getTokenIndices(token1, token2) {
        const i = this.#tokenIndexMap.get(token1);
        const j = this.#tokenIndexMap.get(token2);
        return [i, j];
    }

    // Get DEX index
    getDexIndex(dex) {
        return this.#dexIndexMap.get(dex);
    }

    // Get all supported tokens
    getTokens() {
        return [...this.#tokens];
    }

    // Get all supported DEXs
    getDexes() {
        return [...this.#dexes];
    }

    // Get high-value pairs for monitoring
    getHighValuePairs() {
        const pairs = [];
        
        // Base asset pairs (always monitor)
        for (let i = 0; i < 5; i++) {
            for (let j = i + 1; j < 5; j++) {
                pairs.push([this.#tokens[i], this.#tokens[j]]);
            }
        }

        // Stable pairs (high priority)
        for (let i = 15; i < 20; i++) {
            for (let j = i + 1; j < 20; j++) {
                pairs.push([this.#tokens[i], this.#tokens[j]]);
            }
            // Stable-Base pairs
            for (let j = 0; j < 5; j++) {
                pairs.push([this.#tokens[i], this.#tokens[j]]);
            }
        }

        // Major DeFi token pairs (high volume)
        for (let i = 5; i < 15; i++) {
            // With base assets
            for (let j = 0; j < 5; j++) {
                pairs.push([this.#tokens[i], this.#tokens[j]]);
            }
            // With stables
            for (let j = 15; j < 20; j++) {
                pairs.push([this.#tokens[i], this.#tokens[j]]);
            }
        }

        return pairs;
    }

    // Get arbitrage opportunities based on price differences
    findArbitrageOpportunities(minProfitPercent = 2.5) {
        const opportunities = [];
        const tokenCount = this.#tokens.length;
        const dexCount = this.#dexes.length;

        // Compare prices across all token pairs and DEXs
        for (let i = 0; i < tokenCount; i++) {
            for (let j = i + 1; j < tokenCount; j++) {
                for (let dex1 = 0; dex1 < dexCount; dex1++) {
                    for (let dex2 = dex1 + 1; dex2 < dexCount; dex2++) {
                        const data1 = this.#matrix[i][j][dex1];
                        const data2 = this.#matrix[i][j][dex2];

                        if (!data1?.price || !data2?.price) continue;

                        const priceDiff = Math.abs(data1.price - data2.price);
                        const avgPrice = (data1.price + data2.price) / 2;
                        const profitPercent = (priceDiff / avgPrice) * 100;

                        if (profitPercent >= minProfitPercent) {
                            opportunities.push({
                                token1: this.#tokens[i],
                                token2: this.#tokens[j],
                                dex1: this.#dexes[dex1],
                                dex2: this.#dexes[dex2],
                                price1: data1.price,
                                price2: data2.price,
                                profitPercent,
                                liquidity1: data1.liquidity,
                                liquidity2: data2.liquidity,
                                timestamp1: data1.timestamp,
                                timestamp2: data2.timestamp
                            });
                        }
                    }
                }
            }
        }

        return opportunities;
    }
}

export default FixedPositionMatrix;
