import { AppConfig, EnvironmentMode } from '../types';

/**
 * Isolated environment configuration for Winstone Agent App.
 *
 * NOTE: Production builds must point to the actual Winstone CRM endpoint.
 * Supabase service-role keys are strictly forbidden on the Android client.
 * Only client-safe anon keys or authenticated backend bearer tokens are utilized.
 */

const currentEnv = (import.meta.env.VITE_CRM_ENV || 'development') as EnvironmentMode;

export const AppEnvironmentConfig: AppConfig = {
  environment: currentEnv,
  // Base URL for Winstone CRM HTTPS REST API gateway
  // If left empty or unreachable, the system gracefully operates offline or in dev-mock mode
  crmBaseUrl: import.meta.env.VITE_CRM_BASE_URL || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  // When true, allows fallback to verified demo data if remote endpoint is unconfigured or returns network error
  // Must be false in strict production releases
  enableMockFallback: import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false',
  timeoutMs: 10000,
};

export const API_ENDPOINTS = {
  // Authentication & Agent Profile
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_SESSION: '/auth/session',
  AGENT_PROFILE: '/agents/me',

  // Agent's Authorized Leads (Backend enforces assigned_agent_id)
  ASSIGNED_LEADS: '/leads/assigned',
  LEAD_DETAIL: (leadId: string) => `/leads/${leadId}`,
  UPDATE_LEAD: (leadId: string) => `/leads/${leadId}`,

  // Activities, Notes & Call Outcomes
  LOG_CALL: '/activities/calls',
  ADD_NOTE: '/activities/notes',

  // Follow-ups & Site Visits
  FOLLOW_UPS: '/follow-ups',
  FOLLOW_UP_COMPLETE: (id: string) => `/follow-ups/${id}/complete`,
  FOLLOW_UP_BATCH_COMPLETE: '/follow-ups/batch-complete',
  FOLLOW_UP_RESCHEDULE: (id: string) => `/follow-ups/${id}/reschedule`,
  SITE_VISITS: '/site-visits',
  UPDATE_SITE_VISIT: (id: string) => `/site-visits/${id}`,

  // Batch Sync Gateway for Offline Queue
  BATCH_SYNC: '/sync/batch',
};
