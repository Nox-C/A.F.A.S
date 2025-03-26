import { ethers } from 'ethers';
import { performance } from 'perf_hooks';

export async function calculateGasPrice() {
    // Get current gas price from network
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const gasPrice = await provider.getGasPrice();
    return gasPrice.toNumber();
}

export async function estimateSlippage(dex, token, liquidity) {
    // Implement DEX-specific slippage estimation
    // This is a simplified example
    const baseSlippage = 0.001; // 0.1% base slippage
    const liquidityFactor = Math.min(1, liquidity / 1000000); // Scale based on liquidity
    return baseSlippage / liquidityFactor;
}

export async function checkMEVExposure(buyDex, sellDex, token) {
    // Implement MEV risk analysis
    // This is a simplified example
    const riskFactors = {
        highActivity: await checkTokenActivity(token),
        sandwichRisk: await checkSandwichRisk(token),
        frontRunningRisk: await checkFrontRunningRisk(buyDex, sellDex)
    };

    return calculateMEVRiskScore(riskFactors);
}

async function checkTokenActivity(token) {
    // Check recent transaction volume and frequency
    // Return a risk score between 0 and 1
    return 0.5; // Placeholder
}

async function checkSandwichRisk(token) {
    // Analyze potential for sandwich attacks
    // Consider token liquidity, typical trade size, etc.
    return 0.3; // Placeholder
}

async function checkFrontRunningRisk(buyDex, sellDex) {
    // Analyze risk of front-running based on DEX characteristics
    // Consider gas prices, block times, etc.
    return 0.4; // Placeholder
}

function calculateMEVRiskScore(factors) {
    return (factors.highActivity * 0.3) +
           (factors.sandwichRisk * 0.4) +
           (factors.frontRunningRisk * 0.3);
}

export function measureExecutionTime(startTime = performance.now()) {
    return performance.now() - startTime;
}

export function validatePriceData(price, timestamp, maxAge = 1000) {
    const age = Date.now() - timestamp;
    return {
        isValid: age <= maxAge && price > 0,
        age,
        confidence: Math.max(0, 1 - (age / maxAge))
    };
}

export function calculateOptimalGasPrice(baseGasPrice, urgency = 'high') {
    const multipliers = {
        low: 1.1,    // 10% above base
        medium: 1.2,  // 20% above base
        high: 1.3     // 30% above base
    };
    return Math.ceil(baseGasPrice * multipliers[urgency]);
}
