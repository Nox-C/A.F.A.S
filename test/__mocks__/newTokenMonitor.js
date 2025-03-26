import { EventEmitter } from 'events';

export default class NewTokenMonitor extends EventEmitter {
    constructor(alchemyManager, fixedPositionMatrix) {
        super();
        this.alchemyManager = alchemyManager;
        this.fixedPositionMatrix = fixedPositionMatrix;
    }

    async start() {
        return true;
    }

    async stop() {
        return true;
    }

    async validateNewToken(token) {
        return true;
    }

    async checkMonitoredTokens() {
        return true;
    }
}
