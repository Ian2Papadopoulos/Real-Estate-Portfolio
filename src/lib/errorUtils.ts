// Error handling utilities for the Real Estate Portfolio app

export interface AppError {
  code: string;
  message: string;
  details?: any;
  userMessage: string;
}

export class ErrorHandler {
  // Database/API errors
  static handleDatabaseError(error: any): AppError {
    console.error('Database error:', error);

    // Supabase specific errors
    if (error?.code) {
      switch (error.code) {
        case 'PGRST116': // Row Level Security violation
          return {
            code: 'RLS_VIOLATION',
            message: 'Row Level Security violation',
            details: error,
            userMessage: 'You do not have permission to access this data. Please contact your administrator.'
          };

        case '23505': // Unique violation
          return {
            code: 'DUPLICATE_ENTRY',
            message: 'Duplicate entry',
            details: error,
            userMessage: 'This record already exists. Please use different values.'
          };

        case '23503': // Foreign key violation
          return {
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Foreign key constraint violation',
            details: error,
            userMessage: 'This operation would create invalid data relationships.'
          };

        case '42501': // Insufficient privilege
          return {
            code: 'INSUFFICIENT_PRIVILEGE',
            message: 'Insufficient database privileges',
            details: error,
            userMessage: 'You do not have permission to perform this action.'
          };

        default:
          return {
            code: 'DATABASE_ERROR',
            message: error.message || 'Database operation failed',
            details: error,
            userMessage: 'A database error occurred. Please try again or contact support.'
          };
      }
    }

    // Generic database errors
    if (error?.message?.includes('duplicate key')) {
      return {
        code: 'DUPLICATE_ENTRY',
        message: 'Duplicate entry',
        details: error,
        userMessage: 'This record already exists.'
      };
    }

    if (error?.message?.includes('violates row-level security')) {
      return {
        code: 'RLS_VIOLATION',
        message: 'Row Level Security violation',
        details: error,
        userMessage: 'You do not have permission to access this data.'
      };
    }

    return {
      code: 'UNKNOWN_DATABASE_ERROR',
      message: error?.message || 'Unknown database error',
      details: error,
      userMessage: 'A database error occurred. Please try again.'
    };
  }

  // Authentication errors
  static handleAuthError(error: any): AppError {
    console.error('Auth error:', error);

    if (error?.message) {
      const message = error.message.toLowerCase();

      if (message.includes('invalid login credentials')) {
        return {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid login credentials',
          details: error,
          userMessage: 'Invalid email or password. Please check your credentials and try again.'
        };
      }

      if (message.includes('email already registered') || message.includes('user already registered')) {
        return {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email already registered',
          details: error,
          userMessage: 'An account with this email address already exists. Please sign in instead.'
        };
      }

      if (message.includes('email not confirmed')) {
        return {
          code: 'EMAIL_NOT_CONFIRMED',
          message: 'Email not confirmed',
          details: error,
          userMessage: 'Please confirm your email address before signing in. Check your inbox for a confirmation link.'
        };
      }

      if (message.includes('invalid email')) {
        return {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
          details: error,
          userMessage: 'Please enter a valid email address.'
        };
      }

      if (message.includes('password')) {
        return {
          code: 'WEAK_PASSWORD',
          message: 'Password requirements not met',
          details: error,
          userMessage: 'Password must be at least 6 characters long.'
        };
      }
    }

    return {
      code: 'AUTH_ERROR',
      message: error?.message || 'Authentication failed',
      details: error,
      userMessage: 'Authentication failed. Please try again.'
    };
  }

  // Network/API errors
  static handleNetworkError(error: any): AppError {
    console.error('Network error:', error);

    if (!navigator.onLine) {
      return {
        code: 'OFFLINE',
        message: 'No internet connection',
        details: error,
        userMessage: 'You appear to be offline. Please check your internet connection and try again.'
      };
    }

    if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        details: error,
        userMessage: 'Network error occurred. Please check your connection and try again.'
      };
    }

    if (error?.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timeout',
        details: error,
        userMessage: 'The request took too long to complete. Please try again.'
      };
    }

    return {
      code: 'UNKNOWN_NETWORK_ERROR',
      message: error?.message || 'Unknown network error',
      details: error,
      userMessage: 'A network error occurred. Please try again.'
    };
  }

  // Property validation errors
  static handleValidationError(field: string, value: any, rule: string): AppError {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    
    let userMessage = '';
    switch (rule) {
      case 'required':
        userMessage = `${fieldName} is required.`;
        break;
      case 'positive_number':
        userMessage = `${fieldName} must be a positive number.`;
        break;
      case 'positive_integer':
        userMessage = `${fieldName} must be a positive whole number.`;
        break;
      case 'valid_email':
        userMessage = `Please enter a valid email address.`;
        break;
      case 'min_length':
        userMessage = `${fieldName} must be at least 6 characters long.`;
        break;
      default:
        userMessage = `${fieldName} is invalid.`;
    }

    return {
      code: 'VALIDATION_ERROR',
      message: `Validation failed for ${field}: ${rule}`,
      details: { field, value, rule },
      userMessage
    };
  }

  // Agency/multi-tenancy errors
  static handleTenancyError(error: any): AppError {
    console.error('Tenancy error:', error);

    if (error?.message?.includes('agency_id')) {
      return {
        code: 'MISSING_AGENCY',
        message: 'Agency ID not found',
        details: error,
        userMessage: 'Your account is not associated with an agency. Please contact support.'
      };
    }

    return {
      code: 'TENANCY_ERROR',
      message: error?.message || 'Multi-tenancy error',
      details: error,
      userMessage: 'There was an issue with your account setup. Please contact support.'
    };
  }

  // Generic error handler - determines error type and routes to appropriate handler
  static handleError(error: any, context?: string): AppError {
    // Log the error with context for debugging
    console.error(`Error in ${context || 'unknown context'}:`, error);

    // Check error type and route to appropriate handler
    if (error?.code && (error.code.startsWith('PG') || error.code.startsWith('23'))) {
      return this.handleDatabaseError(error);
    }

    if (error?.message?.includes('auth') || error?.message?.includes('login') || error?.message?.includes('sign')) {
      return this.handleAuthError(error);
    }

    if (error?.name === 'NetworkError' || !navigator.onLine) {
      return this.handleNetworkError(error);
    }

    if (error?.message?.includes('agency')) {
      return this.handleTenancyError(error);
    }

    // Default generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred',
      details: error,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    };
  }
}

// Utility functions for common validations
export const ValidationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword: (password: string): boolean => {
    return password.length >= 6;
  },

  isPositiveNumber: (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0;
  },

  isPositiveInteger: (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseInt(value) : value;
    return !isNaN(num) && num >= 0 && Number.isInteger(num);
  },

  isValidPhoneNumber: (phone: string): boolean => {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  }
};

// Hook for error notifications (can be enhanced with toast notifications)
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string) => {
    const appError = ErrorHandler.handleError(error, context);
    
    // Here you could integrate with a toast notification system
    // For now, we'll just return the formatted error
    return appError;
  };

  return { handleError };
};