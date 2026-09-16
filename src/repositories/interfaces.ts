import {
  Agent,
  Lead,
  FollowUp,
  SiteVisit,
  PerformanceData,
  LeadTemperature,
  OperationalCategory,
  AuthSession,
  LoginCredentials,
  SyncOperation,
  SyncEngineStatus,
  CallOutcomeRequest,
} from '../types';

/**
 * Agent Repository Abstraction
 * Manages authenticated agent profile and credentials.
 */
export interface IAgentRepository {
  getAgentProfile(): Promise<Agent>;
  updateAgentStatus(status: string): Promise<Agent>;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  restoreSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  getAgentProfile(): Promise<Agent>;
}

/**
 * Base LeadRepository Interface
 * Core contract used across ViewModels and UI.
 */
export interface ILeadRepository {
  getAssignedLeads(): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | null>;
  updateLeadCategory(
    id: string,
    temperature: LeadTemperature,
    category: OperationalCategory
  ): Promise<Lead>;
  updateLeadClassification(
    id: string,
    temperature: LeadTemperature,
    category: OperationalCategory
  ): Promise<Lead>;
  logCallOutcome(request: CallOutcomeRequest): Promise<{ callRecordId: string; updatedLead: Lead }>;
  addNote(leadId: string, note: string): Promise<Lead>;
}

/**
 * Local Lead Repository Interface
 * Defines local storage / Room persistence capabilities for Phase 1 and offline cache.
 */
export interface ILocalLeadRepository extends ILeadRepository {
  insertOrUpdateLead(lead: Lead): Promise<void>;
  clearLocalCache(): Promise<void>;
}

/**
 * Remote Lead Repository Interface
 * Contract to be implemented by future Winstone CRM / Supabase REST backend in Phase 2.
 */
export interface IRemoteLeadRepository extends ILeadRepository {
  syncWithRemote(): Promise<{ updatedCount: number }>;
}

export interface IFollowUpRepository {
  getFollowUps(): Promise<FollowUp[]>;
  createFollowUp(followUp: Omit<FollowUp, 'id'>): Promise<FollowUp>;
  completeFollowUp(id: string): Promise<FollowUp>;
  batchCompleteFollowUps(ids: string[]): Promise<string[]>;
  rescheduleFollowUp(id: string, newDate: string, newTime: string): Promise<FollowUp>;
}

export interface ISiteVisitRepository {
  getSiteVisits(): Promise<SiteVisit[]>;
  createSiteVisit(siteVisit: Omit<SiteVisit, 'id'>): Promise<SiteVisit>;
  updateSiteVisitStatus(id: string, status: SiteVisit['status']): Promise<SiteVisit>;
}

export interface IPerformanceRepository {
  getPerformanceMetrics(): Promise<PerformanceData>;
}

/**
 * Sync Repository Interface
 * Manages local mutation queue (Phase 1 local/in-memory, Phase 2 Room/WorkManager).
 */
export interface ISyncRepository {
  getSyncStatus(): SyncEngineStatus;
  getPendingOperations(): SyncOperation[];
  getQueue(): SyncOperation[];
  enqueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>): Promise<SyncOperation>;
  enqueueOperation(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>): Promise<SyncOperation>;
  processQueue(): Promise<{ syncedCount: number; failedCount: number }>;
  retryFailed(): Promise<void>;
  clearQueue(): Promise<void>;
  setOnline(online: boolean): void;
}
