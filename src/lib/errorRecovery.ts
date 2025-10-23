import { EnhancedError, ErrorRecoveryAction, ErrorCategory } from '../types/errors';

interface ErrorHandler {
  match: (error: any) => boolean;
  handle: (error: any) => EnhancedError;
}

export class ErrorRecoveryManager {
  private handlers: ErrorHandler[] = [];

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    // Email not confirmed
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('email not confirmed') ||
        error?.code === 'EMAIL_NOT_CONFIRMED',
      handle: () => ({
        title: 'Email Not Verified',
        message: 'Please verify your email address to continue. Check your inbox for the verification link.',
        type: 'error',
        recoveryActions: [
          {
            label: 'Resend Verification Email',
            action: async () => {
              const { supabase } = await import('../lib/supabase');
              const { data: { user } } = await supabase.auth.getUser();
              if (user?.email) {
                await supabase.auth.resend({
                  type: 'signup',
                  email: user.email,
                });
              }
            },
            variant: 'primary',
          },
          {
            label: 'Contact Support',
            action: () => window.location.href = 'mailto:support@dataflowhubai.com',
            variant: 'link',
          },
        ],
      }),
    });

    // File too large
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('file too large') ||
        error?.message?.toLowerCase().includes('payload too large') ||
        error?.code === 'FILE_TOO_LARGE',
      handle: (error) => {
        const sizeMatch = error?.message?.match(/(\d+\.?\d*)\s*(MB|GB|KB)/i);
        const fileSize = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : 'unknown size';

        return {
          title: 'File Too Large',
          message: `Upload failed - your file (${fileSize}) exceeds the plan limit. Free plan: 3 MB, Professional: 100 MB, Team: 1 GB.`,
          type: 'error',
          recoveryActions: [
            {
              label: 'Upgrade to Professional',
              action: () => window.location.href = '/pricing',
              variant: 'primary',
            },
            {
              label: 'Try a Smaller File',
              action: () => {},
              variant: 'secondary',
            },
            {
              label: 'Learn About Compression',
              action: () => window.open('https://docs.dataflowhubai.com/data-compression', '_blank'),
              variant: 'link',
            },
          ],
        };
      },
    });

    // Dataset limit reached
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('dataset limit') ||
        error?.code === 'QUOTA_EXCEEDED',
      handle: () => ({
        title: 'Dataset Limit Reached',
        message: 'You\'ve reached the maximum number of datasets for your plan (Free: 3, Pro: Unlimited).',
        type: 'warning',
        recoveryActions: [
          {
            label: 'Upgrade to Professional',
            action: () => window.location.href = '/pricing',
            variant: 'primary',
          },
          {
            label: 'Delete Old Datasets',
            action: () => window.location.href = '/app/data',
            variant: 'secondary',
          },
          {
            label: 'View Trash Bin',
            action: () => window.location.href = '/app/trash',
            variant: 'link',
          },
        ],
      }),
    });

    // Network error
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('failed to fetch') ||
        error?.code === 'NETWORK_ERROR',
      handle: () => ({
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'error',
        recoveryActions: [
          {
            label: 'Retry',
            action: () => window.location.reload(),
            variant: 'primary',
          },
          {
            label: 'Check Status',
            action: () => window.open('https://status.dataflowhubai.com', '_blank'),
            variant: 'link',
          },
        ],
      }),
    });

    // Authentication error
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('not authenticated') ||
        error?.message?.toLowerCase().includes('session expired') ||
        error?.code === 'UNAUTHENTICATED',
      handle: () => ({
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again to continue.',
        type: 'warning',
        recoveryActions: [
          {
            label: 'Sign In',
            action: () => window.location.href = '/signin',
            variant: 'primary',
          },
        ],
      }),
    });

    // Payment error
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('payment') ||
        error?.message?.toLowerCase().includes('subscription') ||
        error?.code === 'PAYMENT_REQUIRED',
      handle: () => ({
        title: 'Payment Required',
        message: 'This feature requires an active subscription. Upgrade to access premium features.',
        type: 'warning',
        recoveryActions: [
          {
            label: 'View Plans',
            action: () => window.location.href = '/pricing',
            variant: 'primary',
          },
          {
            label: 'Manage Subscription',
            action: () => window.location.href = '/app/settings',
            variant: 'secondary',
          },
        ],
      }),
    });

    // Storage quota exceeded
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('storage') ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.code === 'STORAGE_EXCEEDED',
      handle: () => ({
        title: 'Storage Limit Reached',
        message: 'You\'ve used all available storage. Delete old files or upgrade your plan.',
        type: 'warning',
        recoveryActions: [
          {
            label: 'View Usage',
            action: () => window.location.href = '/app/usage',
            variant: 'primary',
          },
          {
            label: 'Upgrade Plan',
            action: () => window.location.href = '/pricing',
            variant: 'secondary',
          },
          {
            label: 'Clean Up Files',
            action: () => window.location.href = '/app/trash',
            variant: 'link',
          },
        ],
      }),
    });

    // Invalid data format
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('invalid format') ||
        error?.message?.toLowerCase().includes('unsupported file') ||
        error?.code === 'INVALID_FORMAT',
      handle: (error) => ({
        title: 'Unsupported File Format',
        message: error?.message || 'The file format is not supported. Please use CSV, JSON, or Parquet files.',
        type: 'error',
        recoveryActions: [
          {
            label: 'View Supported Formats',
            action: () => window.open('https://docs.dataflowhubai.com/file-formats', '_blank'),
            variant: 'primary',
          },
          {
            label: 'Try Another File',
            action: () => {},
            variant: 'secondary',
          },
        ],
      }),
    });

    // Model training failed
    this.register({
      match: (error) =>
        error?.message?.toLowerCase().includes('training failed') ||
        error?.code === 'TRAINING_ERROR',
      handle: (error) => ({
        title: 'Model Training Failed',
        message: error?.message || 'The model training process encountered an error.',
        type: 'error',
        recoveryActions: [
          {
            label: 'View Logs',
            action: () => window.location.href = '/app/train?showLogs=true',
            variant: 'primary',
          },
          {
            label: 'Try Different Algorithm',
            action: () => {},
            variant: 'secondary',
          },
          {
            label: 'Get Help',
            action: () => window.open('https://docs.dataflowhubai.com/troubleshooting', '_blank'),
            variant: 'link',
          },
        ],
      }),
    });
  }

  register(handler: ErrorHandler) {
    this.handlers.push(handler);
  }

  handle(error: any): EnhancedError {
    for (const handler of this.handlers) {
      if (handler.match(error)) {
        return handler.handle(error);
      }
    }

    // Default error handler
    return {
      title: 'Something Went Wrong',
      message: error?.message || 'An unexpected error occurred. Please try again.',
      type: 'error',
      technicalDetails: error?.stack || JSON.stringify(error, null, 2),
      recoveryActions: [
        {
          label: 'Try Again',
          action: () => window.location.reload(),
          variant: 'primary',
        },
        {
          label: 'Contact Support',
          action: () => window.location.href = 'mailto:support@dataflowhubai.com?subject=Error Report&body=' +
            encodeURIComponent(`Error: ${error?.message}\n\nDetails: ${error?.stack || JSON.stringify(error)}`),
          variant: 'link',
        },
      ],
    };
  }
}

export const errorRecoveryManager = new ErrorRecoveryManager();

// Helper function for common use
export function handleError(error: any): EnhancedError {
  return errorRecoveryManager.handle(error);
}
