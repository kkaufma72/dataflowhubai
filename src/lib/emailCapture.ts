/**
 * Email Capture & Lead Management Service
 * 
 * Captures leads from:
 * - Exit intent popup
 * - Newsletter signups
 * - FRED demo users
 * - Partial signups
 * 
 * Integrates with Supabase for storage
 */

import { supabase } from './supabase';

export interface CapturedLead {
  email: string;
  source: 'exit_popup' | 'newsletter' | 'fred_demo' | 'partial_signup' | 'waitlist';
  metadata?: {
    fredSeriesViewed?: string[];
    questionsAsked?: number;
    pageUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export interface LeadRecord {
  id: string;
  email: string;
  source: string;
  metadata: Record<string, any>;
  created_at: string;
  converted_at?: string;
  email_sequence_step: number;
}

/**
 * Capture a new lead
 */
export async function captureLead(lead: CapturedLead): Promise<{ success: boolean; error?: string }> {
  try {
    // Get UTM params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
    };

    const metadata = {
      ...lead.metadata,
      ...utmData,
      pageUrl: window.location.pathname,
      capturedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Store in Supabase
    const { error } = await supabase
      .from('leads')
      .upsert({
        email: lead.email.toLowerCase().trim(),
        source: lead.source,
        metadata,
        email_sequence_step: 0,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false, // Update metadata if exists
      });

    if (error) {
      console.error('Failed to capture lead:', error);
      // Fallback to localStorage if Supabase fails
      saveLeadLocally(lead, metadata);
      return { success: true }; // Still count as success for UX
    }

    // Track in analytics
    trackLeadCapture(lead);

    return { success: true };
  } catch (error) {
    console.error('Lead capture error:', error);
    return { success: false, error: 'Failed to save email' };
  }
}

/**
 * Fallback: Save lead to localStorage
 */
function saveLeadLocally(lead: CapturedLead, metadata: Record<string, any>) {
  try {
    const existingLeads = JSON.parse(localStorage.getItem('dfh_captured_leads') || '[]');
    existingLeads.push({
      email: lead.email,
      source: lead.source,
      metadata,
      timestamp: Date.now(),
    });
    localStorage.setItem('dfh_captured_leads', JSON.stringify(existingLeads));
  } catch (e) {
    console.error('localStorage fallback failed:', e);
  }
}

/**
 * Track lead capture in analytics
 */
function trackLeadCapture(lead: CapturedLead) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'lead_capture', {
      source: lead.source,
      email_domain: lead.email.split('@')[1],
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Lead', {
      content_name: lead.source,
    });
  }

  // Custom analytics event
  console.log('[Analytics] Lead captured:', lead.source);
}

/**
 * Mark lead as converted (signed up)
 */
export async function markLeadConverted(email: string): Promise<void> {
  try {
    await supabase
      .from('leads')
      .update({ converted_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim());
  } catch (error) {
    console.error('Failed to mark lead converted:', error);
  }
}

/**
 * Get lead by email
 */
export async function getLeadByEmail(email: string): Promise<LeadRecord | null> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Track FRED demo interaction (for lead enrichment)
 */
export function trackFREDInteraction(seriesId: string, action: 'view' | 'import' | 'question') {
  const key = 'dfh_fred_interactions';
  const existing = JSON.parse(localStorage.getItem(key) || '{"series":[],"questions":0}');
  
  if (action === 'view' || action === 'import') {
    if (!existing.series.includes(seriesId)) {
      existing.series.push(seriesId);
    }
  }
  
  if (action === 'question') {
    existing.questions = (existing.questions || 0) + 1;
  }
  
  localStorage.setItem(key, JSON.stringify(existing));
}

/**
 * Get FRED interactions for lead enrichment
 */
export function getFREDInteractions(): { series: string[]; questions: number } {
  try {
    return JSON.parse(localStorage.getItem('dfh_fred_interactions') || '{"series":[],"questions":0}');
  } catch {
    return { series: [], questions: 0 };
  }
}

