/**
 * Analytics Service
 * 
 * Unified analytics tracking for:
 * - Google Analytics 4
 * - Facebook Pixel
 * - Custom events
 * 
 * Key events to track:
 * - Landing page views
 * - Demo interactions
 * - Signups
 * - Activation milestones
 * - Feature usage
 * - Upgrades
 */

// Event types
export type AnalyticsEvent =
  // Landing page
  | 'page_view'
  | 'landing_page_view'
  | 'fred_demo_started'
  | 'fred_dataset_imported'
  | 'fred_question_asked'
  | 'exit_intent_shown'
  | 'email_captured'
  // Auth
  | 'signup_started'
  | 'signup_completed'
  | 'signin_completed'
  | 'oauth_started'
  // Activation
  | 'first_dataset_uploaded'
  | 'first_ai_question'
  | 'first_insight_generated'
  | 'first_model_trained'
  | 'first_export'
  // Engagement
  | 'feature_used'
  | 'ai_chat_opened'
  | 'model_training_started'
  | 'dashboard_viewed'
  // Conversion
  | 'pricing_viewed'
  | 'upgrade_clicked'
  | 'checkout_started'
  | 'payment_completed'
  | 'subscription_cancelled';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event
 */
export function track(event: AnalyticsEvent, properties?: EventProperties) {
  const eventData = {
    event,
    ...properties,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer,
  };

  // Console log for development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event, properties);
  }

  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, properties);
  }

  // Facebook Pixel - Map to FB events
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const fbEventMap: Record<string, string> = {
      'signup_completed': 'CompleteRegistration',
      'first_model_trained': 'StartTrial',
      'checkout_started': 'InitiateCheckout',
      'payment_completed': 'Purchase',
      'email_captured': 'Lead',
    };

    const fbEvent = fbEventMap[event];
    if (fbEvent) {
      (window as any).fbq('track', fbEvent, properties);
    }
  }

  // Store locally for debugging/analysis
  storeEventLocally(eventData);
}

/**
 * Track page view
 */
export function trackPageView(pageName: string) {
  track('page_view', { page_name: pageName });
}

/**
 * Track conversion value (for ads)
 */
export function trackConversion(value: number, currency: string = 'USD') {
  // Google Ads conversion
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      'send_to': import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID,
      value,
      currency,
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Purchase', { value, currency });
  }
}

/**
 * Identify user (after signup/signin)
 */
export function identify(userId: string, traits?: EventProperties) {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('set', 'user_properties', {
      user_id: userId,
      ...traits,
    });
  }

  // Store for session
  sessionStorage.setItem('dfh_user_id', userId);
}

/**
 * Store events locally for analysis
 */
function storeEventLocally(eventData: Record<string, any>) {
  try {
    const events = JSON.parse(localStorage.getItem('dfh_analytics_events') || '[]');
    events.push(eventData);
    
    // Keep last 100 events only
    if (events.length > 100) {
      events.shift();
    }
    
    localStorage.setItem('dfh_analytics_events', JSON.stringify(events));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Get stored events (for debugging)
 */
export function getStoredEvents(): Record<string, any>[] {
  try {
    return JSON.parse(localStorage.getItem('dfh_analytics_events') || '[]');
  } catch {
    return [];
  }
}

/**
 * UTM parameter extraction
 */
export function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
  };
}

/**
 * Initialize analytics with UTM tracking
 */
export function initAnalytics() {
  // Store UTM params for attribution
  const utmParams = getUTMParams();
  if (Object.values(utmParams).some(v => v)) {
    sessionStorage.setItem('dfh_utm_params', JSON.stringify(utmParams));
  }

  // Track initial page view
  trackPageView(window.location.pathname);
}

// Auto-initialize
if (typeof window !== 'undefined') {
  // Initialize on load
  if (document.readyState === 'complete') {
    initAnalytics();
  } else {
    window.addEventListener('load', initAnalytics);
  }
}

