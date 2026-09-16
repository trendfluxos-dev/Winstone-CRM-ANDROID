import {
  IAuthRepository,
  IAgentRepository,
  ILeadRepository,
  ILocalLeadRepository,
  IFollowUpRepository,
  ISiteVisitRepository,
  IPerformanceRepository,
  ISyncRepository,
} from './interfaces';
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
  CallRecord,
} from '../types';
import {
  mockAgent,
  initialLeads,
  initialFollowUps,
  initialSiteVisits,
  initialPerformance,
} from '../data/mockRepository';

/**
 * MockAgentRepository
 * Concrete implementation for Phase 1 providing mock agent data
 * without hardcoding strings into Composable UI.
 */
export class MockAgentRepository implements IAgentRepository {
  private agent: Agent = { ...mockAgent };

  async getAgentProfile(): Promise<Agent> {
    return { ...this.agent };
  }

  async updateAgentStatus(status: string): Promise<Agent> {
    this.agent = { ...this.agent, status };
    return { ...this.agent };
  }
}

/**
 * MockAuthRepository
 * Session management for Phase 1.
 */
export class MockAuthRepository implements IAuthRepository {
  private currentAgent: Agent = { ...mockAgent };
  private currentSession: AuthSession | null = {
    accessToken: 'mock-jwt-token-agent-session',
    agent: { ...mockAgent },
  };

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    await new Promise((res) => setTimeout(res, 150));

    const name = credentials.identifier.includes('@')
      ? credentials.identifier.split('@')[0].replace('.', ' ')
      : 'Tanvir Ahmed';

    const cleanName = name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    this.currentAgent = {
      ...mockAgent,
      name: cleanName || 'Tanvir Ahmed',
      email: credentials.identifier.includes('@')
        ? credentials.identifier
        : 'tanvir.ahmed@winstoneproperties.com',
      employeeId: credentials.identifier.startsWith('WPL')
        ? credentials.identifier
        : 'WPL-AGT-0842',
    };

    this.currentSession = {
      accessToken: `mock-jwt-token-${Date.now()}`,
      agent: this.currentAgent,
    };

    return this.currentSession;
  }

  async restoreSession(): Promise<AuthSession | null> {
    return this.currentSession;
  }

  async logout(): Promise<void> {
    this.currentSession = null;
  }

  async getAgentProfile(): Promise<Agent> {
    return this.currentAgent;
  }
}

/**
 * MockLeadRepository
 * Implements ILocalLeadRepository and ILeadRepository.
 * Fully functional in-memory state: mutations actually update leads,
 * call history, notes, follow-up dates, and timelines.
 */
export class MockLeadRepository implements ILocalLeadRepository, ILeadRepository {
  private leads: Lead[] = JSON.parse(JSON.stringify(initialLeads));

  async getAssignedLeads(): Promise<Lead[]> {
    return JSON.parse(JSON.stringify(this.leads));
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const lead = this.leads.find((l) => l.id === id);
    return lead ? JSON.parse(JSON.stringify(lead)) : null;
  }

  async updateLeadCategory(
    id: string,
    temperature: LeadTemperature,
    category: OperationalCategory
  ): Promise<Lead> {
    return this.updateLeadClassification(id, temperature, category);
  }

  async updateLeadClassification(
    id: string,
    temperature: LeadTemperature,
    category: OperationalCategory
  ): Promise<Lead> {
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) throw new Error(`Lead ${id} not found`);

    lead.temperature = temperature;
    lead.operationalCategory = category;
    lead.updatedAt = new Date().toISOString();

    lead.activityTimeline.unshift({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      type: 'status_change',
      title: 'Classification Updated',
      description: `Temperature set to ${temperature}, Operational Category set to ${category}.`,
      timestamp: 'Just now',
      agentName: lead.assignedAgent || 'Agent',
    });

    return JSON.parse(JSON.stringify(lead));
  }

  async logCallOutcome(request: CallOutcomeRequest): Promise<{ callRecordId: string; updatedLead: Lead }> {
    const lead = this.leads.find((l) => l.id === request.leadId);
    if (!lead) throw new Error(`Lead ${request.leadId} not found`);

    const callId = `call-${Date.now()}`;
    const newRecord: CallRecord = {
      id: callId,
      leadId: lead.id,
      customerName: lead.customerName,
      phone: lead.phone,
      durationSeconds: request.durationSeconds,
      outcome: request.outcome,
      temperatureAssigned: request.temperature,
      categoryAssigned: request.operationalCategory,
      notes: request.notes,
      nextFollowUpDate: request.followUpDate || undefined,
      timestamp: 'Just now',
      status: 'connected',
      isSimulated: true,
    };

    // Update Lead state properly
    lead.temperature = request.temperature;
    lead.operationalCategory = request.operationalCategory;
    lead.lastContact = 'Just now';

    // Status mapping
    if (request.outcome === 'Interested') {
      lead.status = 'Interested';
    } else if (request.outcome === 'Call back later') {
      lead.status = 'Follow-up';
    } else if (request.outcome === 'Not interested') {
      lead.status = 'Lost';
    }

    // Append notes if provided
    if (request.notes && request.notes.trim()) {
      lead.notes.unshift(request.notes.trim());
    }

    // Update next follow-up if optional followUpDate was supplied
    if (request.followUpDate) {
      lead.nextFollowUp = `${request.followUpDate}${request.followUpTime ? ` ${request.followUpTime}` : ''}`;
    }

    lead.callHistory.unshift(newRecord);

    lead.activityTimeline.unshift({
      id: `act-${Date.now()}`,
      leadId: lead.id,
      type: 'call',
      title: `Call Logged: ${request.outcome}`,
      description: `Duration: ${Math.floor(request.durationSeconds / 60)}m ${
        request.durationSeconds % 60
      }s • Category: ${request.operationalCategory} • Temperature: ${request.temperature}${
        request.notes ? ` • Note: ${request.notes}` : ''
      }`,
      timestamp: 'Just now',
      agentName: lead.assignedAgent || 'Agent',
    });

    lead.updatedAt = new Date().toISOString();

    return { callRecordId: callId, updatedLead: JSON.parse(JSON.stringify(lead)) };
  }

  async addNote(leadId: string, note: string): Promise<Lead> {
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    const trimmed = note.trim();
    if (trimmed) {
      lead.notes.unshift(trimmed);
      lead.activityTimeline.unshift({
        id: `act-${Date.now()}`,
        leadId: lead.id,
        type: 'note',
        title: 'Agent Note Added',
        description: trimmed,
        timestamp: 'Just now',
        agentName: lead.assignedAgent || 'Agent',
      });
      lead.updatedAt = new Date().toISOString();
    }

    return JSON.parse(JSON.stringify(lead));
  }

  async insertOrUpdateLead(lead: Lead): Promise<void> {
    const idx = this.leads.findIndex((l) => l.id === lead.id);
    if (idx >= 0) {
      this.leads[idx] = JSON.parse(JSON.stringify(lead));
    } else {
      this.leads.unshift(JSON.parse(JSON.stringify(lead)));
    }
  }

  async clearLocalCache(): Promise<void> {
    this.leads = [];
  }
}

/**
 * MockFollowUpRepository
 * In-memory follow up state with functional batch complete and rescheduling.
 */
export class MockFollowUpRepository implements IFollowUpRepository {
  private followUps: FollowUp[] = JSON.parse(JSON.stringify(initialFollowUps));

  async getFollowUps(): Promise<FollowUp[]> {
    return JSON.parse(JSON.stringify(this.followUps));
  }

  async createFollowUp(item: Omit<FollowUp, 'id'>): Promise<FollowUp> {
    const newItem: FollowUp = {
      ...item,
      id: `fu-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.followUps.unshift(newItem);
    return JSON.parse(JSON.stringify(newItem));
  }

  async completeFollowUp(id: string): Promise<FollowUp> {
    const item = this.followUps.find((f) => f.id === id);
    if (!item) throw new Error(`Follow-up ${id} not found`);
    item.status = 'completed';
    item.completedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(item));
  }

  async batchCompleteFollowUps(ids: string[]): Promise<string[]> {
    const set = new Set(ids);
    this.followUps.forEach((f) => {
      if (set.has(f.id)) {
        f.status = 'completed';
        f.completedAt = new Date().toISOString();
      }
    });
    return [...ids];
  }

  async rescheduleFollowUp(id: string, newDate: string, newTime: string): Promise<FollowUp> {
    const item = this.followUps.find((f) => f.id === id);
    if (!item) throw new Error(`Follow-up ${id} not found`);
    item.date = newDate;
    item.time = newTime;
    item.status = 'pending';
    return JSON.parse(JSON.stringify(item));
  }
}

/**
 * MockSiteVisitRepository
 */
export class MockSiteVisitRepository implements ISiteVisitRepository {
  private visits: SiteVisit[] = JSON.parse(JSON.stringify(initialSiteVisits));

  async getSiteVisits(): Promise<SiteVisit[]> {
    return JSON.parse(JSON.stringify(this.visits));
  }

  async createSiteVisit(item: Omit<SiteVisit, 'id'>): Promise<SiteVisit> {
    const newVisit: SiteVisit = {
      ...item,
      id: `sv-${Date.now()}`,
    };
    this.visits.unshift(newVisit);
    return JSON.parse(JSON.stringify(newVisit));
  }

  async updateSiteVisitStatus(id: string, status: SiteVisit['status']): Promise<SiteVisit> {
    const item = this.visits.find((v) => v.id === id);
    if (!item) throw new Error(`Site visit ${id} not found`);
    item.status = status;
    return JSON.parse(JSON.stringify(item));
  }
}

/**
 * MockPerformanceRepository
 */
export class MockPerformanceRepository implements IPerformanceRepository {
  private metrics: PerformanceData = JSON.parse(JSON.stringify(initialPerformance));

  async getPerformanceMetrics(): Promise<PerformanceData> {
    return JSON.parse(JSON.stringify(this.metrics));
  }
}

/**
 * MockSyncRepository
 * Manages the local mutation queue for Phase 1.
 * Clearly communicates: "Local changes pending" or "Sync unavailable (Phase 2 CRM pending)".
 */
export class MockSyncRepository implements ISyncRepository {
  private queue: SyncOperation[] = [];
  private isOnline = true;
  private listeners: ((queue: SyncOperation[]) => void)[] = [];

  getSyncStatus(): SyncEngineStatus {
    const pendingCount = this.queue.filter((q) => q.status === 'pending').length;
    return {
      isOnline: this.isOnline,
      isSyncing: false,
      pendingCount,
      failedCount: this.queue.filter((q) => q.status === 'failed').length,
      lastSyncTimestamp: null,
      usingMockFallback: true,
      statusLabel:
        pendingCount > 0
          ? `${pendingCount} Local Pending`
          : 'Phase 1: Local Offline Active',
    };
  }

  getPendingOperations(): SyncOperation[] {
    return this.queue.filter((o) => o.status === 'pending');
  }

  getQueue(): SyncOperation[] {
    return [...this.queue];
  }

  async enqueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>): Promise<SyncOperation> {
    return this.enqueueOperation(operation);
  }

  async enqueueOperation(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>): Promise<SyncOperation> {
    const op: SyncOperation = {
      ...operation,
      id: `sync-op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };
    this.queue.unshift(op);
    this.notify();
    return op;
  }

  async processQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    // In Phase 1 without remote CRM, operations remain locally preserved
    // and ready for Phase 2 WorkManager / Room sync.
    return { syncedCount: 0, failedCount: 0 };
  }

  async retryFailed(): Promise<void> {
    this.queue.forEach((op) => {
      if (op.status === 'failed') {
        op.status = 'pending';
      }
    });
    this.notify();
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    this.notify();
  }

  setOnline(online: boolean): void {
    this.isOnline = online;
    this.notify();
  }

  subscribeQueue(listener: (queue: SyncOperation[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.queue]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      l([...this.queue]);
    }
  }
}
