export default class ArbitrageSynchronizer {
    constructor(config) {
        this.config = config;
        this.metrics = {
            messageCount: 0,
            processedCount: 0,
            averageProcessingTime: 0
        };
    }

    async start() {
        return true;
    }

    async stop() {
        return true;
    }

    getMetrics() {
        return this.metrics;
    }

    generatePerformanceReport() {
        return {
            messageCount: 0,
            processedCount: 0,
            averageProcessingTime: 0,
            uptime: 0
        };
    }
}
