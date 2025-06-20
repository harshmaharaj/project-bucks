interface SecurityEvent {
  type: 'auth' | 'input' | 'error' | 'session' | 'access';
  action: string;
  userId?: string;
  details?: Record<string, any>;
  timestamp: number;
  userAgent: string;
  ip?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;

  private sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      // Remove potential PII patterns
      return data.replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL]')
                .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
                .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields
        if (['password', 'token', 'secret', 'key'].some(sensitive => 
          key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  logEvent(event: Omit<SecurityEvent, 'timestamp' | 'userAgent'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      details: event.details ? this.sanitizeForLogging(event.details) : undefined,
    };

    this.events.push(securityEvent);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // In production, send to secure logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecureLogging(securityEvent);
    } else {
      console.log('Security Event:', securityEvent);
    }
  }

  private async sendToSecureLogging(event: SecurityEvent): Promise<void> {
    // In a real application, this would send to a secure logging service
    // For now, we'll just store in localStorage for demo purposes
    try {
      const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      existingLogs.push(event);
      
      // Keep only last 100 events in localStorage
      const recentLogs = existingLogs.slice(-100);
      localStorage.setItem('security_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to store security log:', error);
    }
  }

  // Authentication events
  logSignIn(userId: string, success: boolean, details?: Record<string, any>): void {
    this.logEvent({
      type: 'auth',
      action: success ? 'signin_success' : 'signin_failure',
      userId: success ? userId : undefined,
      details: { success, ...details },
    });
  }

  logSignOut(userId: string): void {
    this.logEvent({
      type: 'auth',
      action: 'signout',
      userId,
    });
  }

  logSignUp(userId: string, success: boolean): void {
    this.logEvent({
      type: 'auth',
      action: success ? 'signup_success' : 'signup_failure',
      userId: success ? userId : undefined,
      details: { success },
    });
  }

  // Input validation events
  logInputValidation(action: string, success: boolean, details?: Record<string, any>): void {
    this.logEvent({
      type: 'input',
      action: `validation_${success ? 'success' : 'failure'}`,
      details: { action, success, ...details },
    });
  }

  // Error events
  logError(error: Error, context?: string, userId?: string): void {
    this.logEvent({
      type: 'error',
      action: 'application_error',
      userId,
      details: {
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace length
        context,
      },
    });
  }

  // Session events
  logSessionTimeout(userId: string): void {
    this.logEvent({
      type: 'session',
      action: 'session_timeout',
      userId,
    });
  }

  // Access control events
  logAccessAttempt(resource: string, userId?: string, granted: boolean = true): void {
    this.logEvent({
      type: 'access',
      action: granted ? 'access_granted' : 'access_denied',
      userId,
      details: { resource, granted },
    });
  }

  // Get recent events for debugging
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  // Clear events (for privacy compliance)
  clearEvents(): void {
    this.events = [];
    localStorage.removeItem('security_logs');
  }
}

export const securityLogger = new SecurityLogger();
