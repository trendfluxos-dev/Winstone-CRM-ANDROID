/**
 * CrmDataSource - Verified Winstone CRM Public Agent API Client.
 *
 * Implements verified Winstone CRM HTTP routes:
 * Base URL: https://webcrm.winstonebd.com/
 *
 * AUTH:
 *   POST /api/public/agent/login
 * WORKSPACE:
 *   GET /api/public/agent/workspace (authenticated with x-device-token)
 * COACH:
 *   GET /api/public/agent/coach
 * CALL:
 *   POST /api/public/agent/call-start
 *   POST /api/public/agent/call-state
 *   POST /api/public/agent/incoming-call
 *   POST /api/public/agent/presence
 *   POST /api/public/agent/device-capability
 *   POST /api/public/agent/report (action = "open" | "submit")
 *   GET /api/public/agent/report
 *   POST /api/public/agent/whatsapp
 *   GET /api/public/agent/version
 * INGEST:
 *   POST /api/public/ingest/lead
 *   POST /api/public/ingest/message
 *   POST /api/public/ingest/outcome
 *   POST /api/public/ingest/recording (multipart/form-data)
 *   POST /api/public/ingest/analyze
 *   POST /api/public/ingest/reprocess
 *
 * Security:
 * - Sends x-device-token for authenticated requests.
 * - NEVER sends Supabase service-role keys, database passwords, or server secrets.
 */

import { CRM_BASE_URL, VERIFIED_CRM_ROUTES } from '../config/crmEnvironment';
import {
  Agent,
  Lead,
  CallRecord,
  CallOutcome,
  LeadTemperature,
  OperationalCategory,
  LeadStatus,
  RemoteAgentDto,
  RemoteLeadDto,
  RemoteCallDto,
  RemoteWhatsAppDto,
  WorkspaceResponse,
  AgentLoginRequest,
  AgentLoginResponse,
  CallStartRequest,
  CallStateRequest,
  IncomingCallRequest,
  PresenceRequest,
  OpenReportRequest,
  SubmitReportRequest,
  WhatsAppSyncRequest,
  NewLeadRequest,
  RemoteCallOutcomeRequest,
  DeviceCapabilityRequest,
  CoachResponse,
} from '../types';

// ==========================================
// Typed Network Error Hierarchy
// ==========================================

export class CrmHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly errorData: any = null,
    message?: string
  ) {
    super(message || errorData?.message || errorData?.error || `CRM HTTP Error ${status}: ${statusText}`);
    this.name = 'CrmHttpError';
  }
}

export class CrmUnauthorizedError extends CrmHttpError {
  constructor(errorData?: any) {
    super(401, 'Unauthorized', errorData, errorData?.message || 'Device session expired or unauthorized. Please sign in again.');
    this.name = 'CrmUnauthorizedError';
  }
}

export class CrmForbiddenError extends CrmHttpError {
  constructor(errorData?: any) {
    super(403, 'Forbidden', errorData, errorData?.message || 'Access to this CRM resource is forbidden.');
    this.name = 'CrmForbiddenError';
  }
}

export class CrmNotFoundError extends CrmHttpError {
  constructor(errorData?: any) {
    super(404, 'Not Found', errorData, errorData?.message || 'The requested CRM resource was not found.');
    this.name = 'CrmNotFoundError';
  }
}

export class CrmConflictError extends CrmHttpError {
  constructor(errorData?: any) {
    super(409, 'Conflict', errorData, errorData?.message || 'Call or pending report conflict exists on CRM server.');
    this.name = 'CrmConflictError';
  }
}

export class CrmValidationError extends CrmHttpError {
  constructor(errorData?: any) {
    super(422, 'Unprocessable Entity', errorData, errorData?.message || 'CRM server validation failed.');
    this.name = 'CrmValidationError';
  }
}

export class CrmRateLimitError extends CrmHttpError {
  constructor(errorData?: any) {
    super(429, 'Too Many Requests', errorData, errorData?.message || 'Rate limit exceeded. WorkManager retry scheduled.');
    this.name = 'CrmRateLimitError';
  }
}

export class CrmServerError extends CrmHttpError {
  constructor(status: number, statusText: string, errorData?: any) {
    super(status, statusText, errorData, errorData?.message || `Winstone CRM server encountered an error (${status}).`);
    this.name = 'CrmServerError';
  }
}

export class CrmNetworkError extends Error {
  constructor(public readonly originalError: any, message: string = 'Network unavailable or request timed out') {
    super(message);
    this.name = 'CrmNetworkError';
  }
}

// ==========================================
// Centralized Retrofit/OkHttp Client Simulation
// ==========================================

export class CrmDataSource {
  private deviceToken: string | null = null;
  private onUnauthorizedCallback?: () => void;

  constructor() {
    this.restoreToken();
  }

  private restoreToken() {
    try {
      this.deviceToken = sessionStorage.getItem('winstone_crm_device_token');
    } catch {
      this.deviceToken = null;
    }
  }

  public setDeviceToken(token: string | null) {
    this.deviceToken = token;
    try {
      if (token) {
        sessionStorage.setItem('winstone_crm_device_token', token);
      } else {
        sessionStorage.removeItem('winstone_crm_device_token');
      }
    } catch {
      // safe fallback
    }
  }

  public isConfigured(): boolean {
    return true;
  }

  public getDeviceToken(): string | null {
    return this.deviceToken;
  }

  public setOnUnauthorized(cb: () => void) {
    this.onUnauthorizedCallback = cb;
  }

  public async fetchAssignedLeads(): Promise<RemoteLeadDto[]> {
    const ws = await this.getWorkspace();
    return ws.leads || [];
  }

  /**
   * Central OkHttp-style request executor with:
   * - x-device-token header injection
   * - Strict error mapping (401, 403, 404, 409, 422, 429, 5xx)
   * - Vite dev server proxy support & direct HTTPS fallback
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    isAuthExempt = false
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Client-Platform': 'Android-WinstoneAgent',
      'X-App-Version': 'v3.0.0-crm-sync',
      ...(options.headers as Record<string, string>),
    };

    // Inject x-device-token unless this is the login endpoint
    if (!isAuthExempt && this.deviceToken) {
      headers['x-device-token'] = this.deviceToken;
    }

    // Determine target URL:
    // When running in Vite web preview, using relative endpoint (e.g. /api/public/...)
    // leverages Vite's dev proxy to https://webcrm.winstonebd.com to avoid browser CORS blocks.
    // In production/native Android, CRM_BASE_URL is prepended.
    const isBrowserEnv = typeof window !== 'undefined' && window.location?.origin;
    const url = isBrowserEnv && endpoint.startsWith('/api/public')
      ? endpoint
      : `${CRM_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch {
          try {
            errorBody = { message: await response.text() };
          } catch {
            errorBody = null;
          }
        }

        // Specific HTTP status handling as per verified CRM rules:
        if (response.status === 401) {
          if (this.onUnauthorizedCallback) {
            this.onUnauthorizedCallback();
          }
          throw new CrmUnauthorizedError(errorBody);
        }
        if (response.status === 403) {
          throw new CrmForbiddenError(errorBody);
        }
        if (response.status === 404) {
          throw new CrmNotFoundError(errorBody);
        }
        if (response.status === 409) {
          throw new CrmConflictError(errorBody);
        }
        if (response.status === 422) {
          throw new CrmValidationError(errorBody);
        }
        if (response.status === 429) {
          throw new CrmRateLimitError(errorBody);
        }
        if (response.status >= 500) {
          throw new CrmServerError(response.status, response.statusText, errorBody);
        }
        throw new CrmHttpError(response.status, response.statusText, errorBody);
      }

      if (response.status === 204) {
        return {} as T;
      }

      const json = await response.json();
      return json as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err instanceof CrmHttpError) {
        throw err;
      }
      throw new CrmNetworkError(err, err?.message || 'Network connection to CRM server failed');
    }
  }

  // ==========================================
  // Verified CRM Route Methods (Only these 17)
  // ==========================================

  // 1. AUTH: POST /api/public/agent/login
  public async login(req: AgentLoginRequest): Promise<AgentLoginResponse> {
    return this.executeRequest<AgentLoginResponse>(
      VERIFIED_CRM_ROUTES.LOGIN,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      },
      true // exempt from x-device-token
    );
  }

  // 2. WORKSPACE: GET /api/public/agent/workspace
  public async getWorkspace(): Promise<WorkspaceResponse> {
    return this.executeRequest<WorkspaceResponse>(
      VERIFIED_CRM_ROUTES.WORKSPACE,
      { method: 'GET' }
    );
  }

  // 3. COACH: GET /api/public/agent/coach
  public async getCoach(employeeId?: string): Promise<CoachResponse> {
    const query = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : '';
    return this.executeRequest<CoachResponse>(
      `${VERIFIED_CRM_ROUTES.COACH}${query}`,
      { method: 'GET' }
    );
  }

  // 4. CALL START: POST /api/public/agent/call-start
  public async callStart(req: CallStartRequest): Promise<{ ok: boolean; message?: string }> {
    return this.executeRequest<{ ok: boolean; message?: string }>(
      VERIFIED_CRM_ROUTES.CALL_START,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 5. CALL STATE: POST /api/public/agent/call-state
  public async callState(req: CallStateRequest): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.CALL_STATE,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 6. INCOMING CALL: POST /api/public/agent/incoming-call
  public async incomingCall(req: IncomingCallRequest): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.INCOMING_CALL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 7. PRESENCE: POST /api/public/agent/presence
  public async presence(req: PresenceRequest): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.PRESENCE,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 8. DEVICE CAPABILITY: POST /api/public/agent/device-capability
  public async deviceCapability(req: DeviceCapabilityRequest): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.DEVICE_CAPABILITY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 9. REPORT (OPEN/SUBMIT): POST /api/public/agent/report
  public async openReport(req: OpenReportRequest): Promise<{ ok: boolean; report_id?: string }> {
    return this.executeRequest<{ ok: boolean; report_id?: string }>(
      VERIFIED_CRM_ROUTES.REPORT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  public async submitReport(req: SubmitReportRequest): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.REPORT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 10. REPORT GET: GET /api/public/agent/report
  public async getPendingReport(): Promise<any> {
    return this.executeRequest<any>(
      VERIFIED_CRM_ROUTES.REPORT,
      { method: 'GET' }
    );
  }

  // 11. WHATSAPP: POST /api/public/agent/whatsapp
  public async syncWhatsApp(req: WhatsAppSyncRequest): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.WHATSAPP,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 12. VERSION: GET /api/public/agent/version
  public async getVersion(): Promise<{ version: string }> {
    return this.executeRequest<{ version: string }>(
      VERIFIED_CRM_ROUTES.VERSION,
      { method: 'GET' }
    );
  }

  // 13. INGEST LEAD: POST /api/public/ingest/lead
  public async ingestLead(req: NewLeadRequest): Promise<{ ok: boolean; lead_id?: string }> {
    return this.executeRequest<{ ok: boolean; lead_id?: string }>(
      VERIFIED_CRM_ROUTES.INGEST_LEAD,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 14. INGEST MESSAGE: POST /api/public/ingest/message
  public async ingestMessage(payload: any): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.INGEST_MESSAGE,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  }

  // 15. INGEST OUTCOME: POST /api/public/ingest/outcome
  public async ingestOutcome(req: RemoteCallOutcomeRequest): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.INGEST_OUTCOME,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }
    );
  }

  // 16. INGEST RECORDING: POST /api/public/ingest/recording (multipart/form-data)
  public async ingestRecording(formData: FormData): Promise<{ ok: boolean; recording_id?: string }> {
    return this.executeRequest<{ ok: boolean; recording_id?: string }>(
      VERIFIED_CRM_ROUTES.INGEST_RECORDING,
      {
        method: 'POST',
        body: formData, // browser automatically sets multipart/form-data boundary
      }
    );
  }

  // 17. INGEST ANALYZE & REPROCESS
  public async ingestAnalyze(payload: any): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.INGEST_ANALYZE,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  }

  public async ingestReprocess(payload: any): Promise<{ ok: boolean }> {
    return this.executeRequest<{ ok: boolean }>(
      VERIFIED_CRM_ROUTES.INGEST_REPROCESS,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  }
}

// ==========================================
// DTO <-> Domain Model Mappers
// ==========================================

export function mapRemoteLeadToDomain(dto: RemoteLeadDto, fallbackAgentName = 'Agent'): Lead {
  const notesList = dto.notes ? dto.notes.split('\n').filter(Boolean) : [];

  let temperature: LeadTemperature = 'Warm';
  if (dto.temperature) {
    const t = dto.temperature.toLowerCase();
    if (t === 'hot') temperature = 'Hot';
    else if (t === 'cold') temperature = 'Cold';
    else temperature = 'Warm';
  }

  let operationalCategory: OperationalCategory = 'B';
  const rawCat = dto.priority || dto.outcome_category;
  if (rawCat === 'A' || rawCat === 'B' || rawCat === 'C' || rawCat === 'D') {
    operationalCategory = rawCat;
  }

  let status: LeadStatus = 'Active Lead';
  if (dto.status) {
    const s = dto.status.toUpperCase();
    if (s === 'IN_PROGRESS' || s === 'ACTIVE') status = 'Active Lead';
    else if (s === 'FOLLOW_UP') status = 'Follow-up';
    else if (s === 'CLOSED' || s === 'WON') status = 'Closed Won';
    else if (s === 'LOST') status = 'Lost';
    else if (s === 'NEW') status = 'New';
    else status = dto.status as any;
  }

  return {
    id: dto.id,
    customerName: dto.name || 'Unnamed Client',
    phone: dto.phone_number,
    project: dto.project_name || dto.company || 'Winstone Prime',
    source: dto.source || 'CRM Ingest',
    temperature,
    operationalCategory,
    status,
    notes: notesList,
    assignedAgent: fallbackAgentName,
    createdDate: dto.created_at ? dto.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    lastContact: dto.last_contacted_at || 'Recently',
    callHistory: [],
    activityTimeline: [],
    updatedAt: dto.updated_at,
    isTwoSided: dto.is_two_sided ?? false,
  };
}

export function mapRemoteCallToDomain(dto: RemoteCallDto): CallRecord {
  return {
    id: dto.id,
    leadId: dto.lead_id,
    customerName: 'Customer',
    phone: dto.phone_number,
    durationSeconds: dto.duration_seconds,
    outcome: (dto.sentiment === 'positive' ? 'Interested' : 'Follow-up Needed') as CallOutcome,
    temperatureAssigned: 'Warm',
    categoryAssigned: 'B',
    notes: dto.ai_summary || '',
    timestamp: dto.created_at || new Date().toISOString(),
    status: dto.duration_seconds > 0 ? 'connected' : 'no_answer',
    isSimulated: false,
  };
}

export function mapRemoteAgentToDomain(dto: RemoteAgentDto): Agent {
  return {
    id: dto.id,
    employeeId: dto.employee_id,
    name: dto.name,
    phone: dto.phone,
    email: `${dto.employee_id.toLowerCase()}@winstonebd.com`,
    role: dto.role || 'Sales Agent',
    territory: 'Gulshan & Banani Prime',
    status: 'Online',
    accountStatus: 'Active Verified',
  };
}

export const crmDataSource = new CrmDataSource();

