import { performance } from 'perf_hooks';

class TransactionValidator {
    constructor(config) {
        // Time constraints
        this.maxDataAge = config.maxDataAge || 500; // Maximum age of price data in milliseconds
        this.maxExecutionTime = config.maxExecutionTime || 2000; // Maximum time for transaction execution
        
        // Profitability constraints
        this.minProfitPercentage = config.minProfitPercentage || 2.5; // Minimum profit percentage
        this.minProfitUSD = config.minProfitUSD || 50; // Minimum profit in USD
        
        // Gas and slippage constraints
        this.maxSlippagePercent = config.maxSlippagePercent || 1.0; // Maximum allowed slippage
        this.maxGasPrice = config.maxGasPrice || 5; // Maximum gas price in Gwei
        
        // Validation metrics
        this.metrics = {
            totalChecks: 0,
            timeRejections: 0,
            profitRejections: 0,
            slippageRejections: 0,
            gasRejections: 0,
            approved: 0
        };
    }

    validateOpportunity(opportunity) {
        this.metrics.totalChecks++;
        const now = performance.now();
        const validationStart = now;

        // Create validation result object
        const result = {
            isValid: true,
            reasons: [],
            metrics: {
                dataAge: now - opportunity.timestamp,
                validationTime: 0,
                estimatedExecutionTime: 0,
                expectedProfit: 0,
                effectiveSlippage: 0
            }
        };

        // 1. Check data age
        if (result.metrics.dataAge > this.maxDataAge) {
            result.isValid = false;
            result.reasons.push(`Data age (${result.metrics.dataAge.toFixed(2)}ms) exceeds maximum (${this.maxDataAge}ms)`);
            this.metrics.timeRejections++;
            return result;
        }

        // 2. Calculate and check profitability
        const profitPercentage = ((opportunity.sellPrice - opportunity.buyPrice) / opportunity.buyPrice) * 100;
        const estimatedProfit = this.calculateEstimatedProfit(opportunity);
        result.metrics.expectedProfit = estimatedProfit;

        if (profitPercentage < this.minProfitPercentage) {
            result.isValid = false;
            result.reasons.push(`Profit percentage (${profitPercentage.toFixed(2)}%) below minimum (${this.minProfitPercentage}%)`);
            this.metrics.profitRejections++;
            return result;
        }

        if (estimatedProfit < this.minProfitUSD) {
            result.isValid = false;
            result.reasons.push(`Estimated profit ($${estimatedProfit.toFixed(2)}) below minimum ($${this.minProfitUSD})`);
            this.metrics.profitRejections++;
            return result;
        }

        // 3. Check slippage
        const effectiveSlippage = this.calculateEffectiveSlippage(opportunity);
        result.metrics.effectiveSlippage = effectiveSlippage;

        if (effectiveSlippage > this.maxSlippagePercent) {
            result.isValid = false;
            result.reasons.push(`Expected slippage (${effectiveSlippage.toFixed(2)}%) exceeds maximum (${this.maxSlippagePercent}%)`);
            this.metrics.slippageRejections++;
            return result;
        }

        // 4. Check gas price and estimate execution time
        const currentGasPrice = opportunity.gasPrice || 0;
        if (currentGasPrice > this.maxGasPrice) {
            result.isValid = false;
            result.reasons.push(`Gas price (${currentGasPrice} Gwei) exceeds maximum (${this.maxGasPrice} Gwei)`);
            this.metrics.gasRejections++;
            return result;
        }

        // 5. Estimate total execution time
        const estimatedExecutionTime = this.estimateExecutionTime(opportunity);
        result.metrics.estimatedExecutionTime = estimatedExecutionTime;

        if (estimatedExecutionTime > this.maxExecutionTime) {
            result.isValid = false;
            result.reasons.push(`Estimated execution time (${estimatedExecutionTime.toFixed(2)}ms) exceeds maximum (${this.maxExecutionTime}ms)`);
            this.metrics.timeRejections++;
            return result;
        }

        // Calculate validation time
        result.metrics.validationTime = performance.now() - validationStart;

        if (result.isValid) {
            this.metrics.approved++;
        }

        return result;
    }

    calculateEstimatedProfit(opportunity) {
        const { buyPrice, sellPrice, volume, gasPrice } = opportunity;
        const estimatedGasCost = (gasPrice || 0) * 350000 / 1e9; // Convert gas price to ETH
        const grossProfit = (sellPrice - buyPrice) * volume;
        return grossProfit - estimatedGasCost;
    }

    calculateEffectiveSlippage(opportunity) {
        const { buyLiquidity, sellLiquidity, volume } = opportunity;
        const buySlippage = (volume / buyLiquidity) * 100;
        const sellSlippage = (volume / sellLiquidity) * 100;
        return Math.max(buySlippage, sellSlippage);
    }

    estimateExecutionTime(opportunity) {
        // Base execution time (network latency + contract execution)
        const baseTime = 200;
        
        // Additional time based on current network congestion
        const congestionFactor = opportunity.gasPrice ? (opportunity.gasPrice / this.maxGasPrice) : 1;
        const congestionTime = 100 * congestionFactor;
        
        // Additional time based on transaction complexity
        const complexityTime = 50; // Base complexity time
        
        return baseTime + congestionTime + complexityTime;
    }

    getMetrics() {
        return {
            ...this.metrics,
            approvalRate: (this.metrics.approved / this.metrics.totalChecks) * 100,
            timeRejectionRate: (this.metrics.timeRejections / this.metrics.totalChecks) * 100,
            profitRejectionRate: (this.metrics.profitRejections / this.metrics.totalChecks) * 100,
            slippageRejectionRate: (this.metrics.slippageRejections / this.metrics.totalChecks) * 100,
            gasRejectionRate: (this.metrics.gasRejections / this.metrics.totalChecks) * 100
        };
    }

    resetMetrics() {
        this.metrics = {
            totalChecks: 0,
            timeRejections: 0,
            profitRejections: 0,
            slippageRejections: 0,
            gasRejections: 0,
            approved: 0
        };
    }
}

export default TransactionValidator;
