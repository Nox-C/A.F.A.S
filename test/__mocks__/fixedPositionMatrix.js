export default class FixedPositionMatrix {
    constructor(config) {
        this.config = config;
    }

    getTokens() {
        return ['USDT', 'BUSD', 'BNB'];
    }

    getDexes() {
        return ['PancakeSwap', 'THENA'];
    }

    updatePrice(token1, token2, dex, price, liquidity, timestamp) {
        return true;
    }

    findArbitrageOpportunities(minSpread) {
        return [{
            token1: 'USDT',
            token2: 'BUSD',
            dex1: 'PancakeSwap',
            dex2: 'THENA',
            spread: 0.2
        }];
    }
}
