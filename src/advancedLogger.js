const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class AdvancedLogger {
    constructor(config = {}) {
        // Log directory configuration
        this.logDir = config.logDir || path.join(process.cwd(), 'logs');

        // Ensure log directory exists
        const fs = require('fs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }

        // Create logger with advanced configuration
        this.logger = winston.createLogger({
            level: config.level || 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json()
            ),
            defaultMeta: { 
                service: config.serviceName || 'A.F.A.S',
                environment: process.env.NODE_ENV || 'development'
            },
            transports: this.createTransports(config)
        });

        // Add console transport in development
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }));
        }
    }

    // Create log transports with rotation
    createTransports(config) {
        return [
            // Error log rotation
            new DailyRotateFile({
                filename: path.join(this.logDir, 'error-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                maxSize: '20m',
                maxFiles: '14d'
            }),

            // Combined log rotation
            new DailyRotateFile({
                filename: path.join(this.logDir, 'combined-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                level: config.level || 'info',
                maxSize: '20m',
                maxFiles: '14d'
            }),

            // Arbitrage-specific log
            new DailyRotateFile({
                filename: path.join(this.logDir, 'arbitrage-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                level: 'info',
                maxSize: '20m',
                maxFiles: '14d'
            })
        ];
    }

    // Log methods
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Performance logging
    logPerformance(operation, duration, details = {}) {
        this.logger.info('Performance Metric', {
            operation,
            duration,
            ...details
        });
    }

    // Audit logging for critical events
    audit(event, details = {}) {
        this.logger.info('Audit Event', {
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    // Exception tracking
    trackException(error, context = {}) {
        this.logger.error('Unhandled Exception', {
            error: error.message,
            stack: error.stack,
            context
        });
    }
}

module.exports = AdvancedLogger;
