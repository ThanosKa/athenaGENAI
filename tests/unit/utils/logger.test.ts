import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, LogLevel } from '@/lib/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clear();
    vi.clearAllMocks();
  });

  it('should log info level messages', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('Test info message', { key: 'value' }, 'TestContext');

    expect(consoleSpy).toHaveBeenCalled();
    const logs = logger.getRecentLogs(1);
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe(LogLevel.INFO);
    expect(logs[0].message).toBe('Test info message');
    expect(logs[0].context).toBe('TestContext');

    consoleSpy.mockRestore();
  });

  it('should log error level messages', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Test error');
    logger.error('Error occurred', error, 'ErrorContext');

    expect(consoleSpy).toHaveBeenCalled();
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe(LogLevel.ERROR);
    expect(logs[0].message).toBe('Error occurred');
    expect(logs[0].context).toBe('ErrorContext');

    consoleSpy.mockRestore();
  });

  it('should log warning level messages', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('Warning message', { warning: true }, 'WarningContext');

    expect(consoleSpy).toHaveBeenCalled();
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe(LogLevel.WARN);

    consoleSpy.mockRestore();
  });

  it('should log debug level messages', () => {
    // Set logger to DEBUG level to ensure debug messages are logged
    logger.setMinLevel(LogLevel.DEBUG);
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.debug('Debug message', { debug: true }, 'DebugContext');

    expect(consoleSpy).toHaveBeenCalled();
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe(LogLevel.DEBUG);

    consoleSpy.mockRestore();
  });

  it('should attach context metadata', () => {
    logger.info('Test message', { data: 'value' }, 'TestContext');

    const logs = logger.getRecentLogs(1);
    expect(logs[0].context).toBe('TestContext');
    expect(logs[0].data).toEqual({ data: 'value' });
  });

  it('should include timestamp in log entries', () => {
    logger.info('Test message');

    const logs = logger.getRecentLogs(1);
    expect(logs[0].timestamp).toBeInstanceOf(Date);
  });

  it('should get recent logs', () => {
    logger.info('Message 1');
    logger.info('Message 2');
    logger.info('Message 3');

    const recentLogs = logger.getRecentLogs(2);
    expect(recentLogs.length).toBe(2);
    expect(recentLogs[0].message).toBe('Message 2');
    expect(recentLogs[1].message).toBe('Message 3');
  });

  it('should get logs by level', () => {
    logger.info('Info message');
    logger.error('Error message');
    logger.warn('Warning message');
    logger.info('Another info');

    const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].message).toBe('Error message');

    const infoLogs = logger.getLogsByLevel(LogLevel.INFO);
    expect(infoLogs.length).toBe(2);
  });

  it('should get logs by context', () => {
    logger.info('Message 1', undefined, 'Context1');
    logger.info('Message 2', undefined, 'Context2');
    logger.info('Message 3', undefined, 'Context1');

    const context1Logs = logger.getLogsByContext('Context1');
    expect(context1Logs.length).toBe(2);
    expect(context1Logs[0].context).toBe('Context1');
  });

  it('should clear all logs', () => {
    logger.info('Message 1');
    logger.info('Message 2');

    expect(logger.getRecentLogs().length).toBeGreaterThan(0);
    logger.clear();
    expect(logger.getRecentLogs().length).toBe(0);
  });

  it('should limit stored logs to maxLogs', () => {
    // Create more logs than maxLogs (1000)
    for (let i = 0; i < 1001; i++) {
      logger.info(`Message ${i}`);
    }

    const logs = logger.getRecentLogs();
    expect(logs.length).toBeLessThanOrEqual(1000);
  });

  it('should respect minimum log level', () => {
    logger.setMinLevel(LogLevel.WARN);

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    const allLogs = logger.getRecentLogs();
    const debugLogs = allLogs.filter(l => l.level === LogLevel.DEBUG);
    const infoLogs = allLogs.filter(l => l.level === LogLevel.INFO);
    const warnLogs = allLogs.filter(l => l.level === LogLevel.WARN);
    const errorLogs = allLogs.filter(l => l.level === LogLevel.ERROR);

    expect(debugLogs.length).toBe(0);
    expect(infoLogs.length).toBe(0);
    expect(warnLogs.length).toBeGreaterThan(0);
    expect(errorLogs.length).toBeGreaterThan(0);
  });
});

