export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'link';
}

export interface EnhancedError {
  title: string;
  message: string;
  code?: string;
  type: 'error' | 'warning' | 'info';
  recoveryActions?: ErrorRecoveryAction[];
  technicalDetails?: string;
  timestamp?: Date;
}

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'quota'
  | 'network'
  | 'storage'
  | 'payment'
  | 'unknown';

export interface ErrorContext {
  category: ErrorCategory;
  userAction?: string;
  metadata?: Record<string, any>;
}
