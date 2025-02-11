const DataGraph = require('../src/dataGraph');

describe('DataGraph', () => {
    let dataGraph;
    const mockConfig = {
        dexes: ['PancakeSwap', 'THENA', 'DODORouter'],
        assets: ['BNB', 'CAKE', 'USDT'],
        assetPairs: ['BNB/USDT', 'CAKE/USDT'],
        absoluteDifferenceCutoff: 0.01,
        percentageDifferenceThreshold: 2.5
    };

    beforeEach(() => {
        dataGraph = new DataGraph(mockConfig);
    });

    // Data Matrix Initialization
    describe('Initialization', () => {
        test('should create data matrix with correct structure', () => {
            const matrix = dataGraph.getDataMatrix();
            
            mockConfig.assets.forEach(asset => {
                mockConfig.dexes.forEach(dex => {
                    expect(matrix[asset][dex]).toBeDefined();
                    expect(matrix[asset][dex].price.current).toBeNull();
                });
            });
        });
    });

    // Data Update Mechanism
    describe('Data Update', () => {
        test('should update data correctly', () => {
            const dex = 'PancakeSwap';
            const asset = 'BNB';
            
            dataGraph.updateData(asset, dex, 'price', 300);
            const matrix = dataGraph.getDataMatrix();
            
            expect(matrix[asset][dex].price.current).toBe(300);
            expect(matrix[asset][dex].price.timestamps.current).not.toBeNull();
        });

        test('should maintain previous data point', () => {
            const dex = 'THENA';
            const asset = 'CAKE';
            
            dataGraph.updateData(asset, dex, 'price', 10);
            dataGraph.updateData(asset, dex, 'price', 15);
            
            const matrix = dataGraph.getDataMatrix();
            
            expect(matrix[asset][dex].price.current).toBe(15);
            expect(matrix[asset][dex].price.previous).toBe(10);
        });
    });

    // Arbitrage Opportunity Detection
    describe('Arbitrage Opportunity Detection', () => {
        let opportunityCallback;

        beforeEach(() => {
            opportunityCallback = jest.fn();
            dataGraph.on('arbitrageOpportunity', opportunityCallback);
        });

        test('should detect arbitrage opportunity', () => {
            const dexes = mockConfig.dexes;
            const asset = 'BNB';

            // Simulate price differences across DEXes
            dataGraph.updateData(asset, dexes[0], 'price', 300);
            dataGraph.updateData(asset, dexes[1], 'price', 305);
            dataGraph.updateData(asset, dexes[2], 'price', 310);

            expect(opportunityCallback).toHaveBeenCalled();
            
            const opportunity = opportunityCallback.mock.calls[0][0];
            expect(opportunity.entity).toBe(asset);
            expect(opportunity.percentageDifference).toBeGreaterThan(2.5);
        });

        test('should not detect arbitrage below thresholds', () => {
            const dexes = mockConfig.dexes;
            const asset = 'CAKE';

            // Simulate minimal price differences
            dataGraph.updateData(asset, dexes[0], 'price', 10);
            dataGraph.updateData(asset, dexes[1], 'price', 10.05);
            dataGraph.updateData(asset, dexes[2], 'price', 10.1);

            expect(opportunityCallback).not.toHaveBeenCalled();
        });
    });

    // Rolling Window
    describe('Rolling Window', () => {
        test('should maintain rolling window size', () => {
            const dex = 'DODORouter';
            const asset = 'USDT';
            const rollingWindowSize = 10;

            // Simulate multiple updates
            for (let i = 0; i < 15; i++) {
                dataGraph.updateData(asset, dex, 'price', i);
            }

            const rollingWindow = dataGraph.getRollingWindowData();
            expect(rollingWindow[asset][dex].prices.length).toBe(rollingWindowSize);
            expect(rollingWindow[asset][dex].prices[0]).toBe(5);
        });
    });
});
