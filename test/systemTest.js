import dotenv from 'dotenv';
import { jest } from '@jest/globals';
import ArbitrageSynchronizer from '../src/arbitrageSynchronizer.js';
import AlchemyManager from '../src/utils/alchemyManager.js';
import FixedPositionMatrix from '../src/utils/fixedPositionMatrix.js';
import NewTokenMonitor from '../src/utils/newTokenMonitor.js';
import PairConfiguration from '../src/utils/pairConfiguration.js';

// Mock all dependencies
jest.mock('../src/arbitrageSynchronizer.js');
jest.mock('../src/utils/alchemyManager.js');
jest.mock('../src/utils/fixedPositionMatrix.js');
jest.mock('../src/utils/newTokenMonitor.js');

// Load test environment variables
dotenv.config({ path: '.env.test' });

describe('A.F.A.S System Integration Tests', () => {
    let synchronizer;
    let alchemyManager;
    let fixedPositionMatrix;
    let tokenMonitor;

    beforeAll(async () => {
        // Initialize core components
        alchemyManager = new AlchemyManager({
            apiKey: process.env.ALCHEMY_API_KEY,
            network: process.env.NETWORK,
            batchSize: 10,
            batchTimeout: 100
        });

        fixedPositionMatrix = new FixedPositionMatrix(PairConfiguration);
        
        tokenMonitor = new NewTokenMonitor(alchemyManager, fixedPositionMatrix);

        // Create test configuration
        const config = {
            alchemy: {
                apiKey: process.env.ALCHEMY_API_KEY,
                network: process.env.NETWORK,
                batchSize: 10,
                batchTimeout: 100
            },
            performance: {
                maxRequestsPerSecond: 20,
                maxConcurrentPairs: 50,
                rotationInterval: 60000,
                cacheTimeout: 1000
            },
            trading: {
                minProfitThreshold: 2.5,
                maxSlippage: 1.0,
                gasLimit: 500000,
                executionTimeLimit: 500
            },
            monitoring: {
                enableNewTokens: true,
                enableVisualization: true,
                logLevel: 'info',
                metricsInterval: 60000
            }
        };

        synchronizer = new ArbitrageSynchronizer({
            ...config,
            alchemyManager,
            fixedPositionMatrix,
            tokenMonitor
        });
    });

    afterAll(async () => {
        // Cleanup
        if (synchronizer && typeof synchronizer.stop === 'function') {
            await synchronizer.stop();
        }
    });

    test('System initialization', () => {
        expect(synchronizer).toBeDefined();
        expect(alchemyManager).toBeDefined();
        expect(fixedPositionMatrix).toBeDefined();
        expect(tokenMonitor).toBeDefined();
    });

    test('Fixed Position Matrix Configuration', () => {
        const tokens = fixedPositionMatrix.getTokens();
        const dexes = fixedPositionMatrix.getDexes();

        expect(tokens.length).toBeGreaterThan(0);
        expect(dexes.length).toBeGreaterThan(0);
    });

    test('Pair Configuration Loading', () => {
        const historicalPairs = PairConfiguration.getHistoricalPairs();
        const volatilePairs = PairConfiguration.getVolatilePairs();

        expect(historicalPairs.length).toBeGreaterThan(0);
        expect(volatilePairs.length).toBeGreaterThan(0);
    });

    test('Alchemy Manager Batch Processing', async () => {
        // Mock successful responses
        const mockResponses = {
            getGasPrice: { success: true, result: '0x1dcd6500' },
            getBlockNumber: { success: true, result: '0xf4240' }
        };

        // Mock the queueRequest method
        alchemyManager.queueRequest = jest.fn((method, params) => {
            return Promise.resolve(mockResponses[method]);
        });

        const requests = [
            { method: 'getGasPrice', params: [] },
            { method: 'getBlockNumber', params: [] }
        ];

        const results = await Promise.all(
            requests.map(req => alchemyManager.queueRequest(req.method, req.params))
        );

        expect(results.length).toBe(requests.length);
        expect(results.every(r => r.success)).toBe(true);
        expect(alchemyManager.queueRequest).toHaveBeenCalledTimes(2);
    });

    test('New Token Monitor Events', (done) => {
        const testToken = {
            address: '0x123...',
            price: 1.0,
            volume: 1000000,
            liquidity: 500000
        };

        tokenMonitor.on('highVolatility', (data) => {
            expect(data.token).toBeDefined();
            expect(data.priceChange).toBeGreaterThan(0);
            done();
        });

        // Simulate price change event
        tokenMonitor.emit('highVolatility', {
            token: testToken.address,
            priceChange: 20,
            oldPrice: testToken.price,
            newPrice: testToken.price * 1.2
        });
    });

    test('Arbitrage Opportunity Detection', async () => {
        // Add test data to matrix
        fixedPositionMatrix.updatePrice(
            'USDT', 'BUSD', 'PancakeSwap',
            1.001, 1000000, Date.now()
        );
        fixedPositionMatrix.updatePrice(
            'USDT', 'BUSD', 'THENA',
            0.999, 1000000, Date.now()
        );

        const opportunities = fixedPositionMatrix.findArbitrageOpportunities(0.1);
        expect(opportunities.length).toBeGreaterThan(0);
    });

    test('Performance Metrics Collection', async () => {
        await synchronizer.start();
        const metrics = synchronizer.getMetrics();

        expect(metrics).toBeDefined();
        expect(metrics.messageCount).toBeDefined();
        expect(metrics.processedCount).toBeDefined();
        expect(metrics.averageProcessingTime).toBeDefined();
    });
});
