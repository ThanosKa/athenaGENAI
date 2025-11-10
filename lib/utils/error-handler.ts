/**
 * Error categories for classification
 */
export enum ErrorCategory {
  EXTRACTION = 'extraction',
  VALIDATION = 'validation',
  EXPORT = 'export',
  STORAGE = 'storage',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Structured error object
 */
export interface AppError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  details?: unknown;
  timestamp: Date;
}

/**
 * Centralized error handler
 */
export class ErrorHandler {
  /**
   * Handle an error and return user-friendly message
   */
  handle({
    error,
    category,
    context,
  }: {
    error: unknown;
    category: ErrorCategory;
    context?: string;
  }): AppError {
    const timestamp = new Date();
    let message = 'An unknown error occurred';
    let details: unknown;

    if (error instanceof Error) {
      message = error.message;
      details = {
        name: error.name,
        stack: error.stack,
      };
    } else if (typeof error === 'string') {
      message = error;
    } else {
      details = error;
    }

    const userMessage = this.getUserFriendlyMessage({
      category,
      message,
      context,
    });

    const appError: AppError = {
      category,
      message,
      userMessage,
      details,
      timestamp,
    };

    // Log the error
    console.error('[ErrorHandler]', {
      category,
      context,
      message,
      timestamp: timestamp.toISOString(),
      details,
    });

    return appError;
  }

  /**
   * Generate user-friendly error message
   */
  private getUserFriendlyMessage({
    category,
    message,
    context,
  }: {
    category: ErrorCategory;
    message: string;
    context?: string;
  }): string {
    const contextPrefix = context ? `${context}: ` : '';

    switch (category) {
      case ErrorCategory.EXTRACTION:
        if (message.includes('parse')) {
          return `${contextPrefix}Αδυναμία ανάγνωσης του αρχείου. Παρακαλώ βεβαιωθείτε ότι η μορφή είναι σωστή.`;
        }
        if (message.includes('encoding')) {
          return `${contextPrefix}Πρόβλημα με τη μορφοποίηση χαρακτήρων. Το αρχείο πρέπει να είναι UTF-8.`;
        }
        return `${contextPrefix}Σφάλμα κατά την εξαγωγή δεδομένων. Παρακαλώ ελέγξτε το αρχείο.`;

      case ErrorCategory.VALIDATION:
        if (message.includes('email')) {
          return `${contextPrefix}Μη έγκυρη διεύθυνση email.`;
        }
        if (message.includes('phone')) {
          return `${contextPrefix}Μη έγκυρος αριθμός τηλεφώνου.`;
        }
        if (message.includes('required')) {
          return `${contextPrefix}Λείπουν απαιτούμενα πεδία.`;
        }
        return `${contextPrefix}Τα δεδομένα δεν είναι έγκυρα.`;

      case ErrorCategory.EXPORT:
        if (message.includes('auth')) {
          return `${contextPrefix}Σφάλμα εξουσιοδότησης. Παρακαλώ ελέγξτε τις ρυθμίσεις Google Sheets.`;
        }
        if (message.includes('permission')) {
          return `${contextPrefix}Δεν έχετε δικαιώματα για αυτή την ενέργεια.`;
        }
        if (message.includes('network')) {
          return `${contextPrefix}Πρόβλημα δικτύου. Παρακαλώ ελέγξτε τη σύνδεσή σας.`;
        }
        return `${contextPrefix}Σφάλμα κατά την εξαγωγή στο Google Sheets.`;

      case ErrorCategory.STORAGE:
        if (message.includes('not found')) {
          return `${contextPrefix}Το αρχείο δεν βρέθηκε.`;
        }
        return `${contextPrefix}Σφάλμα αποθήκευσης δεδομένων.`;

      case ErrorCategory.NETWORK:
        return `${contextPrefix}Πρόβλημα σύνδεσης. Παρακαλώ ελέγξτε το δίκτυό σας.`;

      default:
        return `${contextPrefix}Παρουσιάστηκε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά.`;
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: AppError): boolean {
    // Network and temporary errors are usually recoverable
    return (
      error.category === ErrorCategory.NETWORK ||
      error.message.includes('timeout') ||
      error.message.includes('temporary')
    );
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

