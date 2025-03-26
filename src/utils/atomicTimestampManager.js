import { performance } from 'perf_hooks';

class AtomicTimestampManager {
    constructor(maxTimeDriftMs = 50) { // 50ms max drift between DEX data
        this.maxTimeDriftMs = maxTimeDriftMs;
        this.timestamps = new Map();
        this.syncGroups = new Map();
    }

    createTimestamp() {
        return {
            systemTime: Date.now(),
            highPrecisionTime: performance.now(),
            monotonicCounter: process.hrtime.bigint()
        };
    }

    registerDexUpdate(dex, entity, data) {
        const timestamp = this.createTimestamp();
        const key = `${dex}:${entity}`;
        this.timestamps.set(key, {
            timestamp,
            data
        });

        // Group updates that are within the acceptable time window
        const groupKey = Math.floor(timestamp.systemTime / this.maxTimeDriftMs);
        if (!this.syncGroups.has(groupKey)) {
            this.syncGroups.set(groupKey, new Map());
        }
        this.syncGroups.get(groupKey).set(key, { timestamp, data });

        // Clean old sync groups
        this.cleanOldSyncGroups(groupKey);

        return this.checkForSynchronizedData(groupKey, entity);
    }

    checkForSynchronizedData(groupKey, entity) {
        const group = this.syncGroups.get(groupKey);
        if (!group) return null;

        // Find all updates for this entity across different DEXs
        const entityUpdates = Array.from(group.entries())
            .filter(([key]) => key.includes(`:${entity}`))
            .map(([key, value]) => ({
                dex: key.split(':')[0],
                ...value
            }));

        // If we have updates from multiple DEXs within the time window
        if (entityUpdates.length > 1) {
            // Verify timestamps are within acceptable drift
            const times = entityUpdates.map(u => u.timestamp.systemTime);
            const drift = Math.max(...times) - Math.min(...times);

            if (drift <= this.maxTimeDriftMs) {
                return {
                    timestamp: Math.max(...times),
                    updates: entityUpdates,
                    drift
                };
            }
        }

        return null;
    }

    cleanOldSyncGroups(currentGroupKey) {
        // Remove groups older than 2 windows
        for (const groupKey of this.syncGroups.keys()) {
            if (groupKey < currentGroupKey - 2) {
                this.syncGroups.delete(groupKey);
            }
        }
    }

    getLatestSynchronizedData(entity) {
        // Get all recent timestamps for this entity
        const relevantData = Array.from(this.timestamps.entries())
            .filter(([key]) => key.includes(`:${entity}`))
            .map(([key, value]) => ({
                dex: key.split(':')[0],
                ...value
            }))
            .sort((a, b) => b.timestamp.systemTime - a.timestamp.systemTime);

        // Group timestamps that are within maxTimeDriftMs of each other
        const synchronizedGroups = [];
        let currentGroup = [];

        for (const data of relevantData) {
            if (currentGroup.length === 0) {
                currentGroup.push(data);
            } else {
                const drift = data.timestamp.systemTime - currentGroup[0].timestamp.systemTime;
                if (Math.abs(drift) <= this.maxTimeDriftMs) {
                    currentGroup.push(data);
                } else {
                    if (currentGroup.length > 1) {
                        synchronizedGroups.push([...currentGroup]);
                    }
                    currentGroup = [data];
                }
            }
        }

        if (currentGroup.length > 1) {
            synchronizedGroups.push(currentGroup);
        }

        // Return the most recent synchronized group
        return synchronizedGroups[0] || null;
    }
}

export default AtomicTimestampManager;
