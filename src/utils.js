// Utility functions for calculations

function calculateProfit(buyPrice, sellPrice, fees) {
    return sellPrice - buyPrice - fees;
}

module.exports = { calculateProfit };
