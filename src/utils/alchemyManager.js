import { Alchemy, Network } from 'alchemy-sdk';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import winston from 'winston';

class AlchemyManager {
    #alchemy;
    #rateLimiter;
    #requestQueue;
    #logger;
    #batchSize;
    #batchTimeout;

    constructor(config = {}) {
        // Initialize Alchemy SDK
        this.#alchemy = new Alchemy({
            apiKey: process.env.ALCHEMY_API_KEY,
            network: Network.ETH_MAINNET,
            maxRetries: 5
        });

        // Initialize rate limiter (20 requests per second to stay safely under the 25 rps limit)
        this.#rateLimiter = new RateLimiterMemory({
            points: 20,
            duration: 1
        });

        this.#requestQueue = [];
        this.#batchSize = config.batchSize || 10;
        this.#batchTimeout = config.batchTimeout || 100; // ms

        this.#logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'alchemy-manager.log' }),
                new winston.transports.Console()
            ]
        });
    }

    // Add request to queue and process batch if ready
    async queueRequest(method, params) {
        return new Promise((resolve, reject) => {
            this.#requestQueue.push({ method, params, resolve, reject });
            
            if (this.#requestQueue.length >= this.#batchSize) {
                this.processBatch();
            } else if (this.#requestQueue.length === 1) {
                // Start timeout for first item in new batch
                setTimeout(() => this.processBatch(), this.#batchTimeout);
            }
        });
    }

    // Process a batch of requests
    async processBatch() {
        if (this.#requestQueue.length === 0) return;

        const batch = this.#requestQueue.splice(0, this.#batchSize);
        const batchId = Date.now();

        try {
            // Wait for rate limiter
            await this.#rateLimiter.consume('default', 1);

            this.#logger.debug(`Processing batch ${batchId} with ${batch.length} requests`);

            // Group similar requests
            const groupedRequests = this.groupSimilarRequests(batch);

            // Process each group
            for (const [method, requests] of Object.entries(groupedRequests)) {
                try {
                    const results = await this.executeBatchedRequest(method, requests);
                    
                    // Distribute results back to original promises
                    requests.forEach((req, index) => {
                        req.resolve(results[index]);
                    });
                } catch (error) {
                    this.#logger.error(`Batch ${batchId} group ${method} failed`, { error });
                    requests.forEach(req => req.reject(error));
                }
            }
        } catch (error) {
            this.#logger.error(`Rate limit exceeded for batch ${batchId}`, { error });
            batch.forEach(req => req.reject(error));
        }
    }

    // Group similar requests to optimize batching
    groupSimilarRequests(batch) {
        const groups = new Map();
        
        batch.forEach(request => {
            if (!groups.has(request.method)) {
                groups.set(request.method, []);
            }
            groups.get(request.method).push(request);
        });

        return Object.fromEntries(groups);
    }

    // Execute a batched request for similar methods
    async executeBatchedRequest(method, requests) {
        switch (method) {
            case 'getTokenBalances':
                return this.batchGetTokenBalances(requests);
            case 'getAssetTransfers':
                return this.batchGetAssetTransfers(requests);
            default:
                // For methods that can't be batched, execute individually
                return Promise.all(requests.map(req => 
                    this.#alchemy.core[method](...req.params)
                ));
        }
    }

    // Batch token balance requests
    async batchGetTokenBalances(requests) {
        const addresses = requests.map(req => req.params[0]);
        const contractAddresses = requests.map(req => req.params[1]);
        
        const batchedResult = await this.#alchemy.core.getTokenBalances(
            addresses,
            contractAddresses.flat()
        );

        // Split result back into individual responses
        return requests.map((_, index) => ({
            address: addresses[index],
            tokenBalances: batchedResult.tokenBalances.filter(balance => 
                contractAddresses[index].includes(balance.contractAddress)
            )
        }));
    }

    // Batch asset transfer requests
    async batchGetAssetTransfers(requests) {
        // Combine time ranges and addresses
        const timeRanges = requests.map(req => req.params[0]);
        const minStartTime = Math.min(...timeRanges.map(r => r.startTime));
        const maxEndTime = Math.max(...timeRanges.map(r => r.endTime));
        
        const addresses = new Set(requests.flatMap(req => req.params[0].address || []));
        
        const batchedResult = await this.#alchemy.core.getAssetTransfers({
            fromAddress: Array.from(addresses),
            startTime: minStartTime,
            endTime: maxEndTime
        });

        // Filter results for each original request
        return requests.map(req => {
            const { startTime, endTime, address } = req.params[0];
            return batchedResult.transfers.filter(transfer => 
                transfer.timestamp >= startTime &&
                transfer.timestamp <= endTime &&
                (!address || address.includes(transfer.from))
            );
        });
    }

    // Cache management
    clearCache() {
        // Implement cache clearing logic if needed
    }
}

export default AlchemyManager;
