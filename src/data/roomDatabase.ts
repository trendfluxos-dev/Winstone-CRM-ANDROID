import {
  Agent,
  Lead,
  FollowUp,
  SiteVisit,
  CallRecord,
  LeadActivity,
  QueuedSyncOperation,
  LeadTemperature,
  OperationalCategory,
  PendingReportState,
  RemoteWhatsAppDto,
} from '../types';
import { initialLeads, mockAgent, initialFollowUps, initialSiteVisits } from './mockRepository';

/**
 * Storage keys simulating Android Room Database tables for WinstoneAgentDatabase (v1)
 */
const DB_VERSION_KEY = 'winstone_room_db_version';
const DB_SEEDED_KEY = 'winstone_room_db_seeded_v2';
const TABLE_AGENTS = 'room_table_agents';
const TABLE_LEADS = 'room_table_leads';
const TABLE_CALL_ACTIVITIES = 'room_table_call_activities';
const TABLE_FOLLOW_UPS = 'room_table_follow_ups';
const TABLE_SYNC_QUEUE = 'room_table_sync_queue';
const TABLE_PENDING_REPORT = 'room_table_pending_report';
const TABLE_WHATSAPP_MESSAGES = 'room_table_whatsapp_messages';

const memoryStore = new Map<string, string>();
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // fallback
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      // fallback
    }
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch {
      // fallback
    }
    memoryStore.delete(key);
  },
  clear: (): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {
      // fallback
    }
    memoryStore.clear();
  },
};

type ChangeListener = () => void;

/**
 * WinstoneAgentRoomDatabase
 *
 * Genuine local-first Room Database simulation for Phase 2 & 3.
 * Fully persists all entities, DAOs, mutations, and reactive Flow subscriptions
 * across browser sessions, offline/airplane mode, and page refreshes.
 */
class WinstoneAgentRoomDatabase {
  private static instance: WinstoneAgentRoomDatabase;

  private leadsListeners: Array<(leads: Lead[]) => void> = [];
  private agentListeners: Array<(agent: Agent | null) => void> = [];
  private followUpsListeners: Array<(followUps: FollowUp[]) => void> = [];
  private syncQueueListeners: Array<(queue: QueuedSyncOperation[]) => void> = [];
  private pendingReportListeners: Array<(report: PendingReportState | null) => void> = [];
  private whatsAppListeners: Array<(messages: RemoteWhatsAppDto[]) => void> = [];

  private constructor() {
    this.initializeDatabase();
  }

  public static getInstance(): WinstoneAgentRoomDatabase {
    if (!WinstoneAgentRoomDatabase.instance) {
      WinstoneAgentRoomDatabase.instance = new WinstoneAgentRoomDatabase();
    }
    return WinstoneAgentRoomDatabase.instance;
  }

  /**
   * Database Initialization & Clean Seed Mechanism
   * Executes initial data seeding ONCE on fresh installation.
   * Never duplicates leads (Md. Rafiqul Islam, Nusrat Jahan) on subsequent runs.
   */
  private initializeDatabase(): void {
    try {
      const currentVersion = safeLocalStorage.getItem(DB_VERSION_KEY);
      const isSeeded = safeLocalStorage.getItem(DB_SEEDED_KEY);

      if (!currentVersion || !isSeeded) {
        // First database creation: Seed Phase 1 demo data
        safeLocalStorage.setItem(DB_VERSION_KEY, '1');
        safeLocalStorage.setItem(TABLE_AGENTS, JSON.stringify(mockAgent));
        safeLocalStorage.setItem(TABLE_LEADS, JSON.stringify(initialLeads));
        safeLocalStorage.setItem(TABLE_FOLLOW_UPS, JSON.stringify(initialFollowUps));

        // Initial call activities extracted from initial leads
        const initialActivities: CallRecord[] = [];
        initialLeads.forEach((lead) => {
          if (lead.callHistory && lead.callHistory.length > 0) {
            initialActivities.push(...lead.callHistory);
          }
        });
        safeLocalStorage.setItem(TABLE_CALL_ACTIVITIES, JSON.stringify(initialActivities));
        safeLocalStorage.setItem(TABLE_SYNC_QUEUE, JSON.stringify([]));

        safeLocalStorage.setItem(DB_SEEDED_KEY, 'true');
      }

      // Ensure WhatsApp table is populated if missing
      if (!safeLocalStorage.getItem(TABLE_WHATSAPP_MESSAGES)) {
        const sampleWhatsApp: RemoteWhatsAppDto[] = [
          {
            id: 'wa-msg-101',
            lead_id: 'lead-1',
            phone: '+880 1711-234567',
            direction: 'inbound',
            message: 'Hello, could you please send me the brochure and floor plan for Gulshan North Tower 2,450 sqft unit?',
            sent_at: '2026-09-15T09:15:00Z',
            status: 'read',
          },
          {
            id: 'wa-msg-102',
            lead_id: 'lead-1',
            phone: '+880 1711-234567',
            direction: 'outbound',
            message: 'Greetings Mr. Rafiqul. The official PDF brochure with floor layouts has been dispatched to your email. I will follow up with you after 3 PM.',
            sent_at: '2026-09-15T09:22:00Z',
            status: 'delivered',
          },
          {
            id: 'wa-msg-103',
            lead_id: 'lead-2',
            phone: '+880 1819-345678',
            direction: 'inbound',
            message: 'Is the Banani Lakefront 1,850 sqft 14th floor unit still available for weekend site visit?',
            sent_at: '2026-09-15T11:05:00Z',
            status: 'read',
          },
        ];
        safeLocalStorage.setItem(TABLE_WHATSAPP_MESSAGES, JSON.stringify(sampleWhatsApp));
      }
    } catch (err) {
      console.warn('WinstoneAgentRoomDatabase initialization notice:', err);
    }
  }

  // -------------------------------------------------------------
  // Raw Table Access Helpers
  // -------------------------------------------------------------

  private getTable<T>(key: string, defaultValue: T): T {
    try {
      const data = safeLocalStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setTable<T>(key: string, data: T): void {
    try {
      safeLocalStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Room database write error to table ' + key, err);
    }
  }

  // -------------------------------------------------------------
  // 1. AgentDao Operations
  // -------------------------------------------------------------

  public getAgent(): Agent {
    return this.getTable<Agent>(TABLE_AGENTS, mockAgent);
  }

  public updateAgent(updated: Agent): void {
    this.setTable(TABLE_AGENTS, updated);
    this.notifyAgentListeners();
  }

  public observeAgent(callback: (agent: Agent | null) => void): () => void {
    this.agentListeners.push(callback);
    callback(this.getAgent());
    return () => {
      this.agentListeners = this.agentListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyAgentListeners(): void {
    const current = this.getAgent();
    this.agentListeners.forEach((cb) => cb(current));
  }

  // -------------------------------------------------------------
  // 2. LeadDao Operations (Full Room Contract)
  // -------------------------------------------------------------

  public getAllLeads(): Lead[] {
    return this.getTable<Lead[]>(TABLE_LEADS, initialLeads);
  }

  public getLeadById(id: string): Lead | null {
    const leads = this.getAllLeads();
    return leads.find((l) => l.id === id) || null;
  }

  public insertLead(lead: Lead): void {
    const leads = this.getAllLeads();
    const existingIdx = leads.findIndex((l) => l.id === lead.id);
    if (existingIdx >= 0) {
      leads[existingIdx] = lead;
    } else {
      leads.unshift(lead);
    }
    this.setTable(TABLE_LEADS, leads);
    this.notifyLeadsListeners();
  }

  public insertLeads(newLeads: Lead[]): void {
    const leads = this.getAllLeads();
    newLeads.forEach((nl) => {
      const idx = leads.findIndex((l) => l.id === nl.id);
      if (idx >= 0) {
        leads[idx] = nl;
      } else {
        leads.unshift(nl);
      }
    });
    this.setTable(TABLE_LEADS, leads);
    this.notifyLeadsListeners();
  }

  public insertOrUpdateLead(lead: Lead): void {
    const leads = this.getAllLeads();
    const idx = leads.findIndex((l) => l.id === lead.id);
    if (idx >= 0) {
      leads[idx] = { ...lead, updatedAt: new Date().toISOString() };
    } else {
      leads.unshift({ ...lead, updatedAt: new Date().toISOString() });
    }
    this.setTable(TABLE_LEADS, leads);
    this.notifyLeadsListeners();
  }

  public updateLead(updatedLead: Lead): void {
    const leads = this.getAllLeads();
    const idx = leads.findIndex((l) => l.id === updatedLead.id);
    if (idx >= 0) {
      leads[idx] = { ...updatedLead, updatedAt: new Date().toISOString() };
      this.setTable(TABLE_LEADS, leads);
      this.notifyLeadsListeners();
    }
  }

  public updateCategory(id: string, category: OperationalCategory, temperature: LeadTemperature): Lead {
    const leads = this.getAllLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new Error(`Lead ${id} not found in Room Database`);

    lead.temperature = temperature;
    lead.operationalCategory = category;
    lead.updatedAt = new Date().toISOString();

    const activity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: lead.id,
      type: 'status_change',
      title: 'Classification Updated',
      description: `Temperature set to ${temperature}, Operational Category set to ${category}.`,
      timestamp: 'Just now',
      agentName: lead.assignedAgent || 'Agent',
    };
    lead.activityTimeline = [activity, ...(lead.activityTimeline || [])];

    this.setTable(TABLE_LEADS, leads);
    this.notifyLeadsListeners();
    return JSON.parse(JSON.stringify(lead));
  }

  public updateTemperature(id: string, temperature: LeadTemperature): Lead {
    const leads = this.getAllLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new Error(`Lead ${id} not found in Room Database`);

    lead.temperature = temperature;
    lead.updatedAt = new Date().toISOString();
    this.setTable(TABLE_LEADS, leads);
    this.notifyLeadsListeners();
    return JSON.parse(JSON.stringify(lead));
  }

  public updateNotes(id: string, newNoteText: string): Lead {
    const leads = this.getAllLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new Error(`Lead ${id} not found in Room Database`);

    const trimmed = newNoteText.trim();
    if (trimmed) {
      lead.notes = [trimmed, ...(lead.notes || [])];
      lead.updatedAt = new Date().toISOString();

      const activity: LeadActivity = {
        id: `act-${Date.now()}`,
        leadId: lead.id,
        type: 'note',
        title: 'Agent Note Added',
        description: trimmed,
        timestamp: 'Just now',
        agentName: lead.assignedAgent || 'Agent',
      };
      lead.activityTimeline = [activity, ...(lead.activityTimeline || [])];

      this.setTable(TABLE_LEADS, leads);
      this.notifyLeadsListeners();
    }
    return JSON.parse(JSON.stringify(lead));
  }

  public updateFollowUp(id: string, nextFollowUp: string | null): Lead {
    const leads = this.getAllLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new Error(`Lead ${id} not found in Room Database`);

    lead.nextFollowUp = nextFollowUp || undefined;
    lead.updatedAt = new Date().toISOString();
    this.setTable(TABLE_LEADS, leads);
    this.notifyLeadsListeners();
    return JSON.parse(JSON.stringify(lead));
  }

  public deleteLead(id: string): void {
    let leads = this.getAllLeads();
    leads = leads.filter((l) => l.id !== id);
    this.setTable(TABLE_LEADS, leads);
    this.notifyLeadsListeners();
  }

  private dirtyLeadIds = new Set<string>();

  public markLeadDirty(leadId: string, dirty = true): void {
    if (dirty) {
      this.dirtyLeadIds.add(leadId);
    } else {
      this.dirtyLeadIds.delete(leadId);
    }
  }

  public isLeadDirty(leadId: string): boolean {
    return this.dirtyLeadIds.has(leadId);
  }

  public observeAllLeads(callback: (leads: Lead[]) => void): () => void {
    this.leadsListeners.push(callback);
    callback(this.getAllLeads());
    return () => {
      this.leadsListeners = this.leadsListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyLeadsListeners(): void {
    const currentLeads = this.getAllLeads();
    this.leadsListeners.forEach((cb) => cb(currentLeads));
  }

  // -------------------------------------------------------------
  // 3. CallActivityDao Operations
  // -------------------------------------------------------------

  public getCallActivities(leadId?: string): CallRecord[] {
    const all = this.getTable<CallRecord[]>(TABLE_CALL_ACTIVITIES, []);
    return leadId ? all.filter((c) => c.leadId === leadId) : all;
  }

  public insertCallActivity(activity: CallRecord): void {
    const activities = this.getCallActivities();
    activities.unshift(activity);
    this.setTable(TABLE_CALL_ACTIVITIES, activities);
  }

  // -------------------------------------------------------------
  // 4. FollowUpDao Operations
  // -------------------------------------------------------------

  public getAllFollowUps(): FollowUp[] {
    return this.getTable<FollowUp[]>(TABLE_FOLLOW_UPS, initialFollowUps);
  }

  public insertFollowUp(followUp: FollowUp): void {
    const list = this.getAllFollowUps();
    const idx = list.findIndex((f) => f.id === followUp.id);
    if (idx >= 0) {
      list[idx] = followUp;
    } else {
      list.unshift(followUp);
    }
    this.setTable(TABLE_FOLLOW_UPS, list);
    this.notifyFollowUpsListeners();
  }

  public completeFollowUp(id: string): void {
    const list = this.getAllFollowUps();
    const item = list.find((f) => f.id === id);
    if (item) {
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
      this.setTable(TABLE_FOLLOW_UPS, list);
      this.notifyFollowUpsListeners();
    }
  }

  public batchCompleteFollowUps(ids: string[]): void {
    const list = this.getAllFollowUps();
    const idsSet = new Set(ids);
    list.forEach((f) => {
      if (idsSet.has(f.id)) {
        f.status = 'completed';
        f.completedAt = new Date().toISOString();
      }
    });
    this.setTable(TABLE_FOLLOW_UPS, list);
    this.notifyFollowUpsListeners();
  }

  public rescheduleFollowUp(id: string, newDate: string, newTime: string): void {
    const list = this.getAllFollowUps();
    const item = list.find((f) => f.id === id);
    if (item) {
      item.date = newDate;
      item.time = newTime;
      item.status = 'pending';
      this.setTable(TABLE_FOLLOW_UPS, list);
      this.notifyFollowUpsListeners();
    }
  }

  public observeAllFollowUps(callback: (followUps: FollowUp[]) => void): () => void {
    this.followUpsListeners.push(callback);
    callback(this.getAllFollowUps());
    return () => {
      this.followUpsListeners = this.followUpsListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyFollowUpsListeners(): void {
    const current = this.getAllFollowUps();
    this.followUpsListeners.forEach((cb) => cb(current));
  }

  // -------------------------------------------------------------
  // 5. SyncQueueDao Operations
  // -------------------------------------------------------------

  public getPendingOperations(): QueuedSyncOperation[] {
    const queue = this.getTable<QueuedSyncOperation[]>(TABLE_SYNC_QUEUE, []);
    return queue.filter((q) => q.status === 'pending');
  }

  public getAllSyncOperations(): QueuedSyncOperation[] {
    return this.getTable<QueuedSyncOperation[]>(TABLE_SYNC_QUEUE, []);
  }

  public enqueue(
    operation: Omit<QueuedSyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ): QueuedSyncOperation {
    const queue = this.getAllSyncOperations();
    const newOp: QueuedSyncOperation = {
      ...operation,
      id: `sync-op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };
    queue.push(newOp);
    this.setTable(TABLE_SYNC_QUEUE, queue);
    this.notifySyncQueueListeners();
    return newOp;
  }

  public deleteSyncOperation(id: string): void {
    let queue = this.getAllSyncOperations();
    queue = queue.filter((q) => q.id !== id);
    this.setTable(TABLE_SYNC_QUEUE, queue);
    this.notifySyncQueueListeners();
  }

  public updateSyncOperationStatus(
    id: string,
    status: 'pending' | 'syncing' | 'synced' | 'failed',
    lastError?: string
  ): void {
    const queue = this.getAllSyncOperations();
    const op = queue.find((q) => q.id === id);
    if (op) {
      op.status = status;
      if (lastError !== undefined) {
        op.lastError = lastError;
      }
      this.setTable(TABLE_SYNC_QUEUE, queue);
      this.notifySyncQueueListeners();
    }
  }

  public incrementRetry(id: string, error: string): void {
    const queue = this.getAllSyncOperations();
    const op = queue.find((q) => q.id === id);
    if (op) {
      op.retryCount += 1;
      op.lastError = error;
      if (op.retryCount >= 5) {
        op.status = 'failed';
      }
      this.setTable(TABLE_SYNC_QUEUE, queue);
      this.notifySyncQueueListeners();
    }
  }

  public markFailed(id: string): void {
    const queue = this.getAllSyncOperations();
    const op = queue.find((q) => q.id === id);
    if (op) {
      op.status = 'failed';
      this.setTable(TABLE_SYNC_QUEUE, queue);
      this.notifySyncQueueListeners();
    }
  }

  public clearQueue(): void {
    this.setTable(TABLE_SYNC_QUEUE, []);
    this.notifySyncQueueListeners();
  }

  public observeSyncQueue(callback: (queue: QueuedSyncOperation[]) => void): () => void {
    this.syncQueueListeners.push(callback);
    callback(this.getAllSyncOperations());
    return () => {
      this.syncQueueListeners = this.syncQueueListeners.filter((cb) => cb !== callback);
    };
  }

  private notifySyncQueueListeners(): void {
    const current = this.getAllSyncOperations();
    this.syncQueueListeners.forEach((cb) => cb(current));
  }

  // -------------------------------------------------------------
  // 6. PendingReportDao Operations (Phase 3 Call Termination State)
  // -------------------------------------------------------------

  public getPendingReport(): PendingReportState | null {
    return this.getTable<PendingReportState | null>(TABLE_PENDING_REPORT, null);
  }

  public savePendingReport(report: PendingReportState): void {
    this.setTable(TABLE_PENDING_REPORT, report);
    this.notifyPendingReportListeners();
  }

  public clearPendingReport(): void {
    this.setTable(TABLE_PENDING_REPORT, null);
    this.notifyPendingReportListeners();
  }

  public observePendingReport(callback: (report: PendingReportState | null) => void): () => void {
    this.pendingReportListeners.push(callback);
    callback(this.getPendingReport());
    return () => {
      this.pendingReportListeners = this.pendingReportListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyPendingReportListeners(): void {
    const current = this.getPendingReport();
    this.pendingReportListeners.forEach((cb) => cb(current));
  }

  // -------------------------------------------------------------
  // 7. WhatsAppMessagesDao Operations
  // -------------------------------------------------------------

  public getWhatsAppMessages(leadId?: string): RemoteWhatsAppDto[] {
    const all = this.getTable<RemoteWhatsAppDto[]>(TABLE_WHATSAPP_MESSAGES, []);
    return leadId ? all.filter((m) => m.lead_id === leadId) : all;
  }

  public insertWhatsAppMessages(messages: RemoteWhatsAppDto[]): void {
    const all = this.getWhatsAppMessages();
    const existingIds = new Set(all.map((m) => m.id));
    messages.forEach((msg) => {
      if (!existingIds.has(msg.id)) {
        all.push(msg);
      }
    });
    this.setTable(TABLE_WHATSAPP_MESSAGES, all);
    this.notifyWhatsAppListeners();
  }

  public observeWhatsAppMessages(callback: (messages: RemoteWhatsAppDto[]) => void): () => void {
    this.whatsAppListeners.push(callback);
    callback(this.getWhatsAppMessages());
    return () => {
      this.whatsAppListeners = this.whatsAppListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyWhatsAppListeners(): void {
    const current = this.getWhatsAppMessages();
    this.whatsAppListeners.forEach((cb) => cb(current));
  }
}

export const winstoneRoomDb = WinstoneAgentRoomDatabase.getInstance();

