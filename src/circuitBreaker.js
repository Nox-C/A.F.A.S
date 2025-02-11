const winston = require('winston');

class CircuitBreaker {
    constructor(config = {}) {
        // Configuration parameters
        this.failureThreshold = config.failureThreshold || 5;
        this.recoveryTime = config.recoveryTime || 60000; // 1 minute
        this.cooldownPeriod = config.cooldownPeriod || 30000; // 30 seconds

        // Circuit state tracking
        this.failures = {};
        this.lastFailureTimes = {};
        this.circuitStates = {};

        // Logging
        this.logger = winston.createLogger({
            level: 'warn',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'circuit-breaker.log' }),
                new winston.transports.Console()
            ]
        });
    }

    // Record a failure for a specific entity
    recordFailure(entity) {
        if (!this.failures[entity]) {
            this.failures[entity] = 0;
        }
        
        this.failures[entity]++;
        this.lastFailureTimes[entity] = Date.now();

        // Check if circuit should be opened
        if (this.failures[entity] >= this.failureThreshold) {
            this.openCircuit(entity);
        }
    }

    // Open circuit for an entity
    openCircuit(entity) {
        this.circuitStates[entity] = {
            state: 'OPEN',
            openedAt: Date.now()
        };

        this.logger.warn(`Circuit opened for ${entity}`, {
            failures: this.failures[entity]
        });
    }

    // Check if circuit is closed and can proceed
    canProceed(entity) {
        const currentTime = Date.now();

        // No previous failures
        if (!this.circuitStates[entity]) {
            return true;
        }

        const circuitState = this.circuitStates[entity];

        // Circuit is closed, check recovery time
        if (circuitState.state === 'OPEN') {
            const timeSinceOpen = currentTime - circuitState.openedAt;

            if (timeSinceOpen >= this.recoveryTime) {
                this.halfOpenCircuit(entity);
                return true;
            }

            return false;
        }

        // Half-open state, allow limited traffic
        if (circuitState.state === 'HALF_OPEN') {
            return Math.random() < 0.5; // 50% chance of allowing request
        }

        return true;
    }

    // Transition circuit to half-open state
    halfOpenCircuit(entity) {
        this.circuitStates[entity] = {
            state: 'HALF_OPEN',
            openedAt: Date.now()
        };

        this.logger.info(`Circuit half-opened for ${entity}`);
    }

    // Reset circuit for an entity
    resetCircuit(entity) {
        this.failures[entity] = 0;
        this.lastFailureTimes[entity] = null;
        this.circuitStates[entity] = {
            state: 'CLOSED',
            openedAt: null
        };

        this.logger.info(`Circuit reset for ${entity}`);
    }

    // Get current circuit state
    getCircuitState(entity) {
        return this.circuitStates[entity] || { state: 'CLOSED' };
    }

    // Periodic maintenance to reset circuits
    runMaintenance() {
        const currentTime = Date.now();

        Object.keys(this.circuitStates).forEach(entity => {
            const state = this.circuitStates[entity];
            
            if (state.state === 'OPEN' && 
                currentTime - state.openedAt >= this.recoveryTime) {
                this.resetCircuit(entity);
            }
        });
    }
}

module.exports = CircuitBreaker;
