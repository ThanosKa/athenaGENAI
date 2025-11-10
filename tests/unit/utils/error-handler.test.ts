import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler, ErrorCategory } from '@/lib/utils/error-handler';

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should categorize extraction errors correctly', () => {
    const error = new Error('Failed to parse email');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXTRACTION,
      context: 'Email extraction',
    });

    expect(appError.category).toBe(ErrorCategory.EXTRACTION);
    // Error message contains "parse" so it returns the parse-specific message
    expect(appError.userMessage).toContain('ανάγνωσης');
  });

  it('should categorize storage errors correctly', () => {
    const error = new Error('Record not found');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.STORAGE,
      context: 'Storage operation',
    });

    expect(appError.category).toBe(ErrorCategory.STORAGE);
    // Error message contains "not found" so it returns the not found message
    expect(appError.userMessage).toContain('δεν βρέθηκε');
  });

  it('should categorize validation errors correctly', () => {
    const error = new Error('Invalid email format');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.VALIDATION,
      context: 'Form validation',
    });

    expect(appError.category).toBe(ErrorCategory.VALIDATION);
    expect(appError.userMessage).toContain('email');
  });

  it('should generate user-friendly messages', () => {
    const error = new Error('Parse error');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXTRACTION,
      context: 'Test context',
    });

    expect(appError.userMessage).toBeDefined();
    expect(appError.userMessage.length).toBeGreaterThan(0);
    expect(appError.userMessage).toContain('Test context');
  });

  it('should log technical details', () => {
    const error = new Error('Test error');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXTRACTION,
    });

    expect(appError.message).toBe('Test error');
    expect(appError.details).toBeDefined();
    if (appError.details && typeof appError.details === 'object') {
      const details = appError.details as { name?: string; stack?: string };
      expect(details.name).toBe('Error');
      expect(details.stack).toBeDefined();
    }
  });

  it('should handle unknown error types', () => {
    const error = { custom: 'error object' };
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.UNKNOWN,
    });

    expect(appError.category).toBe(ErrorCategory.UNKNOWN);
    expect(appError.userMessage).toBeDefined();
  });

  it('should handle string errors', () => {
    const error = 'String error message';
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXTRACTION,
    });

    expect(appError.message).toBe('String error message');
  });

  it('should handle export errors with auth messages', () => {
    // Error message must contain lowercase "auth" to match the condition
    const error = new Error('auth failed');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXPORT,
    });

    // Error message contains "auth" so it should match the auth condition
    expect(appError.userMessage.toLowerCase()).toContain('εξουσιοδότησης');
  });

  it('should handle export errors with permission messages', () => {
    // Error message must contain "permission" to match the condition
    const error = new Error('permission denied');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXPORT,
    });

    // Error message contains "permission" so it should match the permission condition
    expect(appError.userMessage.toLowerCase()).toContain('δικαιώματα');
  });

  it('should handle validation errors for email', () => {
    const error = new Error('Invalid email');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.VALIDATION,
    });

    expect(appError.userMessage).toContain('email');
  });

  it('should handle validation errors for phone', () => {
    const error = new Error('Invalid phone');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.VALIDATION,
    });

    expect(appError.userMessage).toContain('τηλεφώνου');
  });

  it('should handle validation errors for required fields', () => {
    // Error message must contain "required" to match the condition
    const error = new Error('required field missing');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.VALIDATION,
    });

    // Error message contains "required" so it should match the required condition
    expect(appError.userMessage.toLowerCase()).toContain('απαιτούμενα');
  });

  it('should check if error is recoverable', () => {
    const networkError = errorHandler.handle({
      error: new Error('Network timeout'),
      category: ErrorCategory.NETWORK,
    });

    expect(errorHandler.isRecoverable(networkError)).toBe(true);

    const extractionError = errorHandler.handle({
      error: new Error('Parse error'),
      category: ErrorCategory.EXTRACTION,
    });

    expect(errorHandler.isRecoverable(extractionError)).toBe(false);
  });

  it('should include timestamp in error', () => {
    const error = new Error('Test error');
    const appError = errorHandler.handle({
      error,
      category: ErrorCategory.EXTRACTION,
    });

    expect(appError.timestamp).toBeInstanceOf(Date);
  });
});

