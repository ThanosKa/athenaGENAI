export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: Date;
}

export class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  debug(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  error(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): void {
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

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = context ? `[${context}]` : "";
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

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  getLogsByLevel(level: LogLevel, count = 100): LogEntry[] {
    return this.logs.filter((log) => log.level === level).slice(-count);
  }

  getLogsByContext(context: string, count = 100): LogEntry[] {
    return this.logs.filter((log) => log.context === context).slice(-count);
  }

  clear(): void {
    this.logs = [];
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export const logger = new Logger(LogLevel.DEBUG);
