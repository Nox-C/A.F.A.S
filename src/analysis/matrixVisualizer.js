import chalk from 'chalk';

class MatrixVisualizer {
    constructor(analysisHub) {
        this.hub = analysisHub;
        this.lastUpdate = new Map();
    }

    // Generate ASCII visualization of the price matrix
    visualizePriceMatrix() {
        const now = Date.now();
        let output = '\n' + chalk.bold('Price Matrix (DEXs × Tokens)') + '\n\n';

        // Header row with tokens
        output += '        '; // Spacing for DEX column
        this.hub.tokens.forEach(token => {
            output += chalk.cyan(token.padEnd(12));
        });
        output += '\n' + '─'.repeat(8 + this.hub.tokens.length * 12) + '\n';

        // Data rows
        this.hub.dexes.forEach((dex, i) => {
            output += chalk.yellow(dex.padEnd(8));
            
            this.hub.tokens.forEach((token, j) => {
                const index = i * this.hub.tokens.length + j;
                const price = this.hub.priceMatrix[index];
                const timestamp = this.hub.timestampMatrix[index];
                const age = now - timestamp;

                let cell = price ? price.toFixed(4).padEnd(12) : '----'.padEnd(12);
                
                // Color based on age
                if (price) {
                    if (age < 100) { // Fresh data (< 100ms)
                        cell = chalk.green(cell);
                    } else if (age < 500) { // Recent data (< 500ms)
                        cell = chalk.yellow(cell);
                    } else { // Stale data
                        cell = chalk.red(cell);
                    }
                } else {
                    cell = chalk.gray(cell);
                }

                output += cell;
            });
            output += '\n';
        });

        return output;
    }

    // Generate ASCII visualization of price differences
    visualizePriceDifferences() {
        let output = '\n' + chalk.bold('Price Differences (%)') + '\n\n';

        this.hub.tokens.forEach(token => {
            output += chalk.cyan(`\n${token}:\n`);
            output += '        '; // Spacing for DEX column
            
            this.hub.dexes.forEach(dex => {
                output += dex.substring(0, 3).padEnd(8);
            });
            output += '\n' + '─'.repeat(8 + this.hub.dexes.length * 8) + '\n';

            this.hub.dexes.forEach((dex1, i) => {
                output += chalk.yellow(dex1.substring(0, 3).padEnd(8));
                
                this.hub.dexes.forEach((dex2, j) => {
                    if (i === j) {
                        output += '----'.padEnd(8);
                        return;
                    }

                    const price1 = this.hub.priceMatrix[i * this.hub.tokens.length + this.hub.tokenIndices.get(token)];
                    const price2 = this.hub.priceMatrix[j * this.hub.tokens.length + this.hub.tokenIndices.get(token)];

                    if (!price1 || !price2) {
                        output += chalk.gray('N/A'.padEnd(8));
                        return;
                    }

                    const diff = ((price2 - price1) / price1 * 100).toFixed(2);
                    let cell = diff.padEnd(8);

                    if (diff > 0) {
                        cell = chalk.green(cell);
                    } else if (diff < 0) {
                        cell = chalk.red(cell);
                    }

                    output += cell;
                });
                output += '\n';
            });
        });

        return output;
    }

    // Generate summary of potential arbitrage opportunities
    visualizeOpportunities() {
        let output = '\n' + chalk.bold('Arbitrage Opportunities') + '\n\n';
        
        this.hub.tokens.forEach(token => {
            const opportunities = this.hub.findArbitrageOpportunities(token);
            
            if (opportunities.length > 0) {
                output += chalk.cyan(`\n${token}:\n`);
                opportunities.forEach(opp => {
                    const profit = (opp.profitRatio * 100).toFixed(2);
                    output += chalk.green(`  ${opp.buyDex} → ${opp.sellDex}: ${profit}% profit\n`);
                    output += `    Buy:  ${opp.buyPrice.toFixed(6)} (Liquidity: ${opp.buyLiquidity.toFixed(2)})\n`;
                    output += `    Sell: ${opp.sellPrice.toFixed(6)} (Liquidity: ${opp.sellLiquidity.toFixed(2)})\n`;
                });
            }
        });

        return output;
    }

    // Update and print all visualizations
    update() {
        console.clear();
        console.log(this.visualizePriceMatrix());
        console.log(this.visualizePriceDifferences());
        console.log(this.visualizeOpportunities());
        
        const metrics = this.hub.getMetrics();
        console.log(chalk.bold('\nPerformance Metrics:'));
        console.log(`Updates/sec: ${metrics.updatesPerSecond.toFixed(2)}`);
        console.log(`Comparisons/sec: ${metrics.comparisonsPerSecond.toFixed(2)}`);
        console.log(`Opportunities/sec: ${metrics.opportunitiesPerSecond.toFixed(2)}`);
    }
}

export default MatrixVisualizer;
