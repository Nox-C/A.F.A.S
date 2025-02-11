const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const v8 = require('v8');

class MonitoringDashboard {
    constructor(arbitrageSynchronizer, webSocketManager) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);

        this.arbitrageSynchronizer = arbitrageSynchronizer;
        this.webSocketManager = webSocketManager;

        this.setupRoutes();
        this.setupSocketEvents();
        this.startPeriodicUpdates();
    }

    setupRoutes() {
        // System health endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });

        // Performance metrics endpoint
        this.app.get('/metrics', (req, res) => {
            res.json(this.getSystemMetrics());
        });
    }

    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log('Client connected to monitoring dashboard');

            // Real-time arbitrage opportunity updates
            this.webSocketManager.on('arbitrageOpportunity', (opportunity) => {
                socket.emit('arbitrageOpportunity', opportunity);
            });

            // Disconnect handling
            socket.on('disconnect', () => {
                console.log('Client disconnected from monitoring dashboard');
            });
        });
    }

    startPeriodicUpdates() {
        // Broadcast system metrics every 5 seconds
        setInterval(() => {
            const metrics = this.getSystemMetrics();
            this.io.emit('systemMetrics', metrics);
        }, 5000);
    }

    getSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpus = os.cpus();

        return {
            system: {
                platform: os.platform(),
                arch: os.arch(),
                cpuCount: cpus.length
            },
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed
                }
            },
            v8: {
                heapStatistics: v8.getHeapStatistics(),
                heapSpaceStatistics: v8.getHeapSpaceStatistics()
            },
            performance: this.arbitrageSynchronizer 
                ? this.arbitrageSynchronizer.generatePerformanceReport() 
                : {}
        };
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`Monitoring dashboard running on port ${port}`);
        });
    }
}

module.exports = MonitoringDashboard;
