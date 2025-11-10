/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry structure
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: Date;
}

/**
 * Simple logger with context support
 */
export class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  /**
   * Debug log
   */
  debug(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info log
   */
  info(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning log
   */
  warn(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error log
   */
  error(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): void {
    // Check if this level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date(),
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output
    const prefix = context ? `[${context}]` : '';
    const timestamp = entry.timestamp.toISOString();

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${timestamp} DEBUG ${prefix}`, message, data);
        break;
      case LogLevel.INFO:
        console.info(`${timestamp} INFO ${prefix}`, message, data);
        break;
      case LogLevel.WARN:
        console.warn(`${timestamp} WARN ${prefix}`, message, data);
        break;
      case LogLevel.ERROR:
        console.error(`${timestamp} ERROR ${prefix}`, message, data);
        break;
    }
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel, count = 100): LogEntry[] {
    return this.logs.filter(log => log.level === level).slice(-count);
  }

  /**
   * Get logs by context
   */
  getLogsByContext(context: string, count = 100): LogEntry[] {
    return this.logs.filter(log => log.context === context).slice(-count);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Singleton instance
// In production, set to INFO or WARN
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

