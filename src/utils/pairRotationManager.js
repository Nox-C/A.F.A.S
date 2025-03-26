import winston from 'winston';

class PairRotationManager {
    #baseAssets;
    #tradingAssets;
    #stableAssets;
    #maxConcurrentPairs;
    #rotationInterval;
    #activePairs;
    #logger;

    constructor(config) {
        this.#baseAssets = config.baseAssets;
        this.#tradingAssets = config.tradingAssets;
        this.#stableAssets = config.stableAssets;
        this.#maxConcurrentPairs = config.settings.maxConcurrentPairs;
        this.#rotationInterval = config.settings.rotationInterval;
        this.#activePairs = new Set();

        this.#logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'pair-rotation.log' }),
                new winston.transports.Console()
            ]
        });

        // Start rotation
        this.startRotation();
    }

    // Generate all possible pairs
    generateAllPairs() {
        const pairs = new Set();

        // Base-Trading pairs
        for (const base of this.#baseAssets) {
            for (const trading of this.#tradingAssets) {
                pairs.add(`${base}-${trading}`);
            }
        }

        // Base-Stable pairs
        for (const base of this.#baseAssets) {
            for (const stable of this.#stableAssets) {
                pairs.add(`${base}-${stable}`);
            }
        }

        // Trading-Stable pairs
        for (const trading of this.#tradingAssets) {
            for (const stable of this.#stableAssets) {
                pairs.add(`${trading}-${stable}`);
            }
        }

        // Trading-Trading pairs (selective)
        for (let i = 0; i < this.#tradingAssets.length; i++) {
            for (let j = i + 1; j < this.#tradingAssets.length; j++) {
                if (this.isHighLiquidityPair(this.#tradingAssets[i], this.#tradingAssets[j])) {
                    pairs.add(`${this.#tradingAssets[i]}-${this.#tradingAssets[j]}`);
                }
            }
        }

        return Array.from(pairs);
    }

    // Check if a trading pair typically has high liquidity
    isHighLiquidityPair(token1, token2) {
        const highLiquidityPairs = new Set([
            'CAKE-XVS',
            'CAKE-DODO',
            'CAKE-LINK',
            'XVS-LINK',
            'DODO-LINK'
        ]);

        return highLiquidityPairs.has(`${token1}-${token2}`) || 
               highLiquidityPairs.has(`${token2}-${token1}`);
    }

    // Get the current active pairs
    getActivePairs() {
        return Array.from(this.#activePairs);
    }

    // Rotate to a new set of pairs
    rotatePairs() {
        const allPairs = this.generateAllPairs();
        const newActivePairs = new Set();

        // Prioritize pairs with stable coins
        const stablePairs = allPairs.filter(pair => 
            this.#stableAssets.some(stable => pair.includes(stable))
        );

        // Prioritize pairs with base assets
        const basePairs = allPairs.filter(pair =>
            this.#baseAssets.some(base => pair.includes(base)) &&
            !stablePairs.includes(pair)
        );

        // Other pairs
        const otherPairs = allPairs.filter(pair =>
            !stablePairs.includes(pair) && !basePairs.includes(pair)
        );

        // Select pairs maintaining priority ratios
        const stableCount = Math.floor(this.#maxConcurrentPairs * 0.4); // 40% stable pairs
        const baseCount = Math.floor(this.#maxConcurrentPairs * 0.4);   // 40% base pairs
        const otherCount = this.#maxConcurrentPairs - stableCount - baseCount; // 20% other pairs

        // Randomly select pairs from each category
        this.addRandomPairs(newActivePairs, stablePairs, stableCount);
        this.addRandomPairs(newActivePairs, basePairs, baseCount);
        this.addRandomPairs(newActivePairs, otherPairs, otherCount);

        // Update active pairs
        this.#activePairs = newActivePairs;
        this.#logger.info('Rotated active pairs', {
            pairCount: this.#activePairs.size,
            stablePairCount: stablePairs.length,
            basePairCount: basePairs.length,
            otherPairCount: otherPairs.length
        });

        return Array.from(this.#activePairs);
    }

    // Add random pairs from source to target set
    addRandomPairs(target, source, count) {
        const shuffled = source.sort(() => 0.5 - Math.random());
        shuffled.slice(0, count).forEach(pair => target.add(pair));
    }

    // Start the rotation interval
    startRotation() {
        // Initial rotation
        this.rotatePairs();

        // Set up interval for future rotations
        setInterval(() => {
            this.rotatePairs();
        }, this.#rotationInterval);
    }

    // Stop the rotation interval
    stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
    }
}

export default PairRotationManager;
