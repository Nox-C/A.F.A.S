import { parentPort } from 'worker_threads';
import { calculateGasPrice, estimateSlippage, checkMEVExposure } from './tradingUtils.js';

// Handle messages from the main thread
parentPort.on('message', async (task) => {
    try {
        const result = await analyzeOpportunity(task.data);
        parentPort.postMessage({
            taskId: task.taskId,
            data: result
        });
    } catch (error) {
        parentPort.postMessage({
            taskId: task.taskId,
            error: error.message
        });
    }
});

async function analyzeOpportunity(data) {
    const {
        buyDex,
        sellDex,
        token,
        buyPrice,
        sellPrice,
        timestamp,
        liquidityBuy,
        liquiditySell
    } = data;

    // 1. Basic profit calculation
    const rawProfitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;

    // 2. Gas cost analysis
    const gasPrice = await calculateGasPrice();
    const estimatedGasCost = gasPrice * 350000; // Estimated gas units for arbitrage

    // 3. Slippage estimation
    const buySlippage = await estimateSlippage(buyDex, token, liquidityBuy);
    const sellSlippage = await estimateSlippage(sellDex, token, liquiditySell);

    // 4. MEV protection check
    const mevRisk = await checkMEVExposure(buyDex, sellDex, token);

    // 5. Calculate optimal trade size
    const optimalSize = calculateOptimalTradeSize(
        buyPrice,
        sellPrice,
        liquidityBuy,
        liquiditySell,
        buySlippage,
        sellSlippage
    );

    // 6. Final profitability analysis
    const adjustedProfit = calculateAdjustedProfit(
        optimalSize,
        buyPrice,
        sellPrice,
        buySlippage,
        sellSlippage,
        estimatedGasCost
    );

    return {
        isProfileable: adjustedProfit.profitAfterCosts > 0,
        optimalSize,
        expectedProfit: adjustedProfit.profitAfterCosts,
        confidence: calculateConfidenceScore({
            timestamp,
            mevRisk,
            slippage: buySlippage + sellSlippage,
            liquidity: Math.min(liquidityBuy, liquiditySell)
        }),
        executionPlan: {
            buyDex,
            sellDex,
            token,
            amount: optimalSize,
            expectedBuyPrice: buyPrice * (1 + buySlippage),
            expectedSellPrice: sellPrice * (1 - sellSlippage),
            maxGasPrice: gasPrice * 1.2, // 20% buffer
            deadline: timestamp + 2000 // 2 second deadline
        }
    };
}

function calculateOptimalTradeSize(buyPrice, sellPrice, liquidityBuy, liquiditySell, buySlippage, sellSlippage) {
    // Implementation of optimal size calculation considering:
    // - Available liquidity
    // - Impact on price (slippage)
    // - Maximum profitable trade size
    const maxBuySize = liquidityBuy * 0.1; // Don't use more than 10% of liquidity
    const maxSellSize = liquiditySell * 0.1;
    
    return Math.min(maxBuySize, maxSellSize);
}

function calculateAdjustedProfit(size, buyPrice, sellPrice, buySlippage, sellSlippage, gasCost) {
    const effectiveBuyPrice = buyPrice * (1 + buySlippage);
    const effectiveSellPrice = sellPrice * (1 - sellSlippage);
    
    const totalCost = (size * effectiveBuyPrice) + gasCost;
    const expectedRevenue = size * effectiveSellPrice;
    
    return {
        profitAfterCosts: expectedRevenue - totalCost,
        profitPercentage: ((expectedRevenue - totalCost) / totalCost) * 100
    };
}

function calculateConfidenceScore({ timestamp, mevRisk, slippage, liquidity }) {
    const age = Date.now() - timestamp;
    const ageScore = Math.max(0, 1 - (age / 1000)); // Penalize data older than 1 second
    
    const mevScore = 1 - mevRisk;
    const slippageScore = Math.max(0, 1 - (slippage * 10));
    const liquidityScore = Math.min(1, liquidity / 1000000); // Scale based on liquidity
    
    return (ageScore * 0.4) + (mevScore * 0.2) + (slippageScore * 0.2) + (liquidityScore * 0.2);
}
