export default class AlchemyManager {
    constructor(config) {
        this.config = config;
    }

    async queueRequest(method, params) {
        return { success: true, data: {} };
    }

    async start() {
        return true;
    }

    async stop() {
        return true;
    }
}
