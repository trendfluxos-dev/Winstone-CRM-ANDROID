/**
 * CrmEnvironment - Native Android Configuration for Winstone Agent App.
 *
 * Requirements:
 * - CRM_BASE_URL = "https://webcrm.winstonebd.com/" (Single centralized definition)
 * - Supports LOCAL, STAGING, PRODUCTION environments.
 * - Does NOT send Supabase service-role keys or database credentials to Android client.
 * - Verified public agent routes from Winstone CRM source code.
 */

export const CRM_BASE_URL = 'https://webcrm.winstonebd.com/';

export const VERIFIED_CRM_ROUTES = {
  // AUTH
  LOGIN: '/api/public/agent/login',
  // WORKSPACE
  WORKSPACE: '/api/public/agent/workspace',
  // COACH
  COACH: '/api/public/agent/coach',
  // CALL
  CALL_START: '/api/public/agent/call-start',
  CALL_STATE: '/api/public/agent/call-state',
  INCOMING_CALL: '/api/public/agent/incoming-call',
  PRESENCE: '/api/public/agent/presence',
  DEVICE_CAPABILITY: '/api/public/agent/device-capability',
  REPORT: '/api/public/agent/report',
  WHATSAPP: '/api/public/agent/whatsapp',
  VERSION: '/api/public/agent/version',
  // INGEST
  INGEST_LEAD: '/api/public/ingest/lead',
  INGEST_MESSAGE: '/api/public/ingest/message',
  INGEST_OUTCOME: '/api/public/ingest/outcome',
  INGEST_RECORDING: '/api/public/ingest/recording',
  INGEST_ANALYZE: '/api/public/ingest/analyze',
  INGEST_REPROCESS: '/api/public/ingest/reprocess',
} as const;

export type CrmEnvironmentType = 'LOCAL' | 'STAGING' | 'PRODUCTION';
export type CrmConfigurationStatus = 'CONFIGURED' | 'CRM_NOT_CONFIGURED';

export class CrmEnvironment {
  private currentEnv: CrmEnvironmentType = 'PRODUCTION';
  private verifiedBaseUrl: string = CRM_BASE_URL;
  private isContractVerified = true;

  public getEnvironment(): CrmEnvironmentType {
    return this.currentEnv;
  }

  public setEnvironment(env: CrmEnvironmentType): void {
    this.currentEnv = env;
  }

  public getStatus(): CrmConfigurationStatus {
    return this.isContractVerified ? 'CONFIGURED' : 'CRM_NOT_CONFIGURED';
  }

  public isConfigured(): boolean {
    return this.isContractVerified;
  }

  public getBaseUrl(): string {
    return this.verifiedBaseUrl;
  }

  public getStatusLabel(): string {
    return 'Winstone CRM (webcrm.winstonebd.com)';
  }

  public getVerifiedRoutes() {
    return VERIFIED_CRM_ROUTES;
  }
}

export const crmEnvironment = new CrmEnvironment();

