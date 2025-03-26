import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';

class ParallelProcessor {
    constructor(config) {
        this.numWorkers = config.numWorkers || cpus().length;
        this.workers = new Map();
        this.taskQueue = [];
        this.processingTasks = new Map();
        this.taskIdCounter = 0;
    }

    async initialize() {
        for (let i = 0; i < this.numWorkers; i++) {
            const worker = new Worker(`${process.cwd()}/src/utils/analysisWorker.js`);
            
            worker.on('message', (result) => {
                this.handleWorkerResult(worker.id, result);
            });

            worker.on('error', (error) => {
                console.error(`Worker ${worker.id} error:`, error);
                this.handleWorkerError(worker.id);
            });

            this.workers.set(worker.id, {
                worker,
                busy: false
            });
        }
    }

    async submitTask(taskData) {
        const taskId = this.taskIdCounter++;
        const task = {
            id: taskId,
            data: taskData,
            timestamp: Date.now()
        };

        // Check if we have any available workers
        const availableWorker = this.getAvailableWorker();
        if (availableWorker) {
            this.assignTaskToWorker(availableWorker, task);
        } else {
            this.taskQueue.push(task);
        }

        return new Promise((resolve, reject) => {
            this.processingTasks.set(taskId, { resolve, reject });
        });
    }

    getAvailableWorker() {
        for (const [id, workerInfo] of this.workers) {
            if (!workerInfo.busy) {
                return workerInfo;
            }
        }
        return null;
    }

    assignTaskToWorker(workerInfo, task) {
        workerInfo.busy = true;
        workerInfo.worker.postMessage({
            taskId: task.id,
            data: task.data
        });
    }

    handleWorkerResult(workerId, result) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) return;

        // Mark worker as available
        workerInfo.busy = false;

        // Resolve the task promise
        const taskPromise = this.processingTasks.get(result.taskId);
        if (taskPromise) {
            taskPromise.resolve(result.data);
            this.processingTasks.delete(result.taskId);
        }

        // Process next task if available
        if (this.taskQueue.length > 0) {
            const nextTask = this.taskQueue.shift();
            this.assignTaskToWorker(workerInfo, nextTask);
        }
    }

    handleWorkerError(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) return;

        // Recreate the worker
        const newWorker = new Worker(`${process.cwd()}/src/utils/analysisWorker.js`);
        newWorker.on('message', (result) => this.handleWorkerResult(newWorker.id, result));
        newWorker.on('error', (error) => this.handleWorkerError(newWorker.id));

        this.workers.set(workerId, {
            worker: newWorker,
            busy: false
        });
    }

    shutdown() {
        for (const [_, workerInfo] of this.workers) {
            workerInfo.worker.terminate();
        }
        this.workers.clear();
    }
}

export default ParallelProcessor;
