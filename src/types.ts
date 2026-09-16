/**
 * Core Data Models & Types for Winstone Agent App (Winstone Properties Ltd.)
 * Prepared for Phase 1 Local Repository & Phase 2 CRM / Supabase sync.
 */

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';
export type OperationalCategory = 'A' | 'B' | 'C' | 'D';

export type CallOutcome =
  | 'Interested'
  | 'Call back later'
  | 'Not interested'
  | 'Wrong number'
  | 'No answer';

export type LeadStatus =
  | 'New'
  | 'Interested'
  | 'Follow-up'
  | 'Site Visit'
  | 'Negotiation'
  | 'Closed'
  | 'Lost'
  | 'Active Lead'
  | 'Closed Won';

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'call' | 'note' | 'followup' | 'site_visit' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  agentName: string;
}

export interface CallRecord {
  id: string;
  leadId: string;
  customerName: string;
  phone: string;
  durationSeconds: number;
  outcome: CallOutcome;
  temperatureAssigned: LeadTemperature;
  categoryAssigned: OperationalCategory;
  notes: string;
  nextFollowUpDate?: string;
  timestamp: string;
  status: 'connected' | 'missed' | 'no_answer';
  isSimulated: boolean;
}

/**
 * CallOutcomeRequest - Comprehensive payload to persist call results
 * without data loss.
 */
export interface CallOutcomeRequest {
  leadId: string;
  outcome: CallOutcome;
  temperature: LeadTemperature;
  operationalCategory: OperationalCategory;
  notes: string;
  followUpDate?: string | null;
  followUpTime?: string | null;
  followUpReason?: string | null;
  durationSeconds: number;
}

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  project: string;
  source: string;
  temperature: LeadTemperature;
  operationalCategory: OperationalCategory;
  assignedAgent: string;
  assignedTo?: string;
  assignedAgentId?: string;
  callAttempts?: number;
  createdDate: string;
  lastContact: string;
  nextFollowUp?: string;
  notes: string[];
  callHistory: CallRecord[];
  activityTimeline: LeadActivity[];
  status: LeadStatus;
  updatedAt?: string;
  aiScore?: number;
  isTwoSided?: boolean;

  // CRM Attribution Fields (Meta / Website / Google Ads)
  campaign?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  adSetId?: string | null;
  adSetName?: string | null;
  adId?: string | null;
  adName?: string | null;
  medium?: string | null;
  landingPage?: string | null;
}

export interface FollowUp {
  id: string;
  leadId: string;
  customerName: string;
  phone: string;
  project: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  status: 'pending' | 'completed' | 'overdue' | 'rescheduled' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  createdAt?: string;
  completedAt?: string;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  customerName: string;
  phone: string;
  project: string;
  date: string;
  time: string;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  assignedAgentId?: string;
}

/**
 * Agent Entity - decoupled from hardcoded UI strings
 */
export interface Agent {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  territory: string;
  status: string;
  accountStatus?: 'Active Verified' | 'On Leave' | 'Suspended';
  appVersion?: string;
  avatarUrl?: string;
}

export interface MetricBreakdown {
  leadsAssigned: number;
  callsMade: number;
  connectedCalls: number;
  interestedLeads: number;
  followUpsDone: number;
  siteVisits: number;
  talkTimeMinutes: number;
}

export interface PerformanceData {
  today: MetricBreakdown;
  sevenDays: MetricBreakdown;
  thirtyDays: MetricBreakdown;
}

export type NavTab =
  | 'dashboard'
  | 'leads'
  | 'followups'
  | 'performance'
  | 'profile'
  | 'coordinator'
  | 'executive'
  | 'it_console';
export type NavigationTab = NavTab;
export type TodayMetrics = MetricBreakdown;
export type FollowUpScheduleItem = FollowUp;
export type AgentProfile = Agent;

// ==========================================
// UI State & Architecture Types
// ==========================================

export type UiLoadingState = 'loading' | 'loaded' | 'empty' | 'error' | 'offline' | 'syncing';

export interface AgentUiState {
  status: UiLoadingState;
  errorMessage?: string | null;
  leads: Lead[];
  followUps: FollowUp[];
  siteVisits: SiteVisit[];
  performance: PerformanceData | null;
  agent: Agent | null;
  pendingSyncCount: number;
}

// ==========================================
// Calling & Recording Engine Abstractions
// ==========================================

export interface CallEngineState {
  isActive: boolean;
  leadId: string | null;
  phoneNumber: string | null;
  customerName: string | null;
  durationSeconds: number;
  isSimulated: boolean;
  statusNote: string;
}

export interface ICallingEngine {
  startCall(phoneNumber: string, leadId: string, customerName: string): Promise<void>;
  endCall(): Promise<{ durationSeconds: number }>;
  getCallState(): CallEngineState;
  subscribeCallState(listener: (state: CallEngineState) => void): () => void;
}

export interface IRecordingEngine {
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ isSimulated: boolean; notice: string }>;
  getRecordingStatus(): { isRecording: boolean; isSimulated: boolean; statusMessage: string };
}

// ==========================================
// Phase 1 Local & Phase 2 Sync Types
// ==========================================

export type EnvironmentMode = 'development' | 'staging' | 'production';

export interface AppConfig {
  environment: EnvironmentMode;
  crmBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableMockFallback: boolean;
  timeoutMs: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  agent: Agent;
}

export interface LoginCredentials {
  identifier: string; // email or employeeId
  password?: string;
  otp?: string;
}

export type SyncOperationType =
  | 'LOG_CALL_OUTCOME'
  | 'ADD_NOTE'
  | 'CREATE_FOLLOW_UP'
  | 'COMPLETE_FOLLOW_UP'
  | 'RESCHEDULE_FOLLOW_UP'
  | 'CREATE_SITE_VISIT'
  | 'UPDATE_LEAD_CATEGORY'
  | 'BATCH_COMPLETE_FOLLOW_UPS'
  | 'CALL_START'
  | 'CALL_STATE'
  | 'INCOMING_CALL'
  | 'PRESENCE'
  | 'OPEN_REPORT'
  | 'SUBMIT_REPORT'
  | 'WHATSAPP_SYNC'
  | 'INGEST_LEAD'
  | 'INGEST_OUTCOME'
  | 'INGEST_RECORDING'
  | 'DEVICE_CAPABILITY';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

/**
 * SyncOperation Model - Designed for Local Queue & Room Database
 */
export interface SyncOperation {
  id: string;
  operationType: SyncOperationType;
  entityType?: 'lead' | 'followup' | 'site_visit' | 'call' | 'report' | 'whatsapp' | 'agent' | 'device';
  entityId: string;
  payload: any;
  createdAt: string;
  retryCount: number;
  status: SyncStatus;
  lastError?: string;
  httpStatus?: number;
}

export type QueuedSyncOperation = SyncOperation;

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTimestamp: string | null;
  usingMockFallback: boolean;
  statusLabel: string;
}

// ==========================================
// Verified Winstone CRM Phase 3 DTOs & Contracts
// ==========================================

export interface RemoteAgentDto {
  id: string;
  name: string;
  employee_id: string;
  phone: string;
  sim_number?: string;
  role: string;
}

export interface AgentLoginRequest {
  identifier?: string;
  email?: string;
  password?: string;
  device_label?: string;
  device_id?: string;
  app_version?: string;
  platform?: string;
  sim_number?: string;
}

export interface AgentLoginResponse {
  ok: boolean;
  device_token?: string;
  device_id?: string;
  agent?: RemoteAgentDto;
  error?: string;
  message?: string;
}

export interface RemoteLeadDto {
  id: string;
  name: string;
  phone_number: string;
  company?: string | null;
  project_name?: string | null;
  notes?: string | null;
  status: string;
  priority?: string | null;
  temperature?: string | null;
  outcome_category?: string | null;
  call_attempts?: number;
  is_two_sided?: boolean;
  last_contacted_at?: string | null;
  source?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RemoteCallDto {
  id: string;
  lead_id: string;
  agent_id: string;
  phone_number?: string;
  duration_seconds: number;
  call_direction?: string;
  sync_status?: string;
  is_two_sided?: boolean;
  connected?: boolean;
  outcome_category?: string | null;
  recording_id?: string | null;
  ai_summary?: string | null;
  sentiment?: string | null;
  deal_stage?: string | null;
  created_at: string;
}

export interface RemoteWhatsAppDto {
  id: string;
  lead_id: string;
  agent_id?: string;
  phone?: string;
  direction?: 'inbound' | 'outbound';
  sender_type?: string;
  message_type?: string;
  message?: string;
  message_content?: string;
  created_at?: string;
  sent_at?: string;
  status?: 'sent' | 'delivered' | 'read' | 'pending';
}

export interface WorkspaceResponse {
  agent: RemoteAgentDto;
  roster?: any[];
  leads: RemoteLeadDto[];
  calls: RemoteCallDto[];
  whatsapp?: RemoteWhatsAppDto[];
  server_time: string;
}

export interface CallStartRequest {
  lead_id: string;
}

export interface CallStateRequest {
  call_uid: string;
  lead_id: string;
  state: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'no_answer' | 'connected';
  duration_seconds?: number;
  agent_phone?: string;
  phone_number?: string;
  timestamp?: string;
  recording_supported?: boolean;
  recording_note?: string;
}

export interface IncomingCallRequest {
  call_uid: string;
  phone_number: string;
  state: 'ringing' | 'answered' | 'completed' | 'no_answer' | 'failed';
  duration_seconds: number;
  recording_supported: boolean;
  recording_note: string;
  direction: 'incoming';
}

export interface PresenceRequest {
  employee_id?: string;
  presence?: 'on_call' | 'idle' | 'offline';
  status?: string;
  call_started_at?: string;
  lead_id?: string;
}

export interface OpenReportRequest {
  action: 'open';
  lead_id: string;
  recording_id: string | null;
  phone_number: string;
  call_started_at: string | null;
  duration_seconds: number;
  connected: boolean;
}

export interface SubmitReportRequest {
  action: 'submit';
  report_id: string;
  lead_id?: string;
  category: string;
  summary: string;
  note?: string;
  notes?: string;
  reason: string;
  follow_up_at: string | null;
  reminder_minutes: number;
  temperature: 'hot' | 'warm' | 'cold';
  grade: 'A' | 'B' | 'C' | 'D';
  ai_decision: 'accepted' | 'edited' | 'rejected';
}

export type SubmitReportPayload = SubmitReportRequest;

export interface PendingReportState {
  report_id: string;
  lead_id: string;
  customer_name?: string;
  phone_number: string;
  call_started_at: string | null;
  duration_seconds: number;
  connected: boolean;
  opened_at?: string;
  cached_at?: string;
  status?: 'opened' | 'draft' | 'pending';
}

export interface WhatsAppMessageItem {
  client_message_id: string;
  sender: 'agent' | 'client';
  message_type: 'text';
  text: string;
}

export interface WhatsAppSyncRequest {
  lead_id: string;
  phone?: string;
  message?: string;
  direction?: 'inbound' | 'outbound';
  timestamp?: string;
  messages?: WhatsAppMessageItem[];
}

export interface NewLeadRequest {
  name: string;
  phone_number: string;
  company?: string;
  notes?: string;
  source: 'agent_app';
  assign: boolean;
  agent_id: string;
}

export interface RemoteCallOutcomeRequest {
  lead_id: string;
  agent_id: string;
  outcome: string;
  notes?: string;
  connected: boolean;
}

export interface DeviceCapabilityRequest {
  app_version: string;
  android_version: string;
  manufacturer: string;
  model: string;
  sim_number: string;
  recording_mode: 'call_audio' | 'microphone_only' | 'blocked';
  recording_note: string;
}

export interface CoachResponse {
  summary: string;
  strengths: string[];
  risks: string[];
  next_steps: string[];
}

