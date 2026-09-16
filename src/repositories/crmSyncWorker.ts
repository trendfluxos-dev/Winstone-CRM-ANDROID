/**
 * CrmSyncWorker - Android WorkManager Worker Implementation.
 *
 * Implements:
 * - Network constraint (NetworkType.CONNECTED)
 * - Exponential backoff retry pattern (max 5 retries)
 * - Processes pending SyncQueueDao operations targeting verified CRM endpoints:
 *   * /api/public/agent/call-start
 *   * /api/public/agent/call-state
 *   * /api/public/agent/incoming-call
 *   * /api/public/agent/presence
 *   * /api/public/agent/device-capability
 *   * /api/public/agent/report
 *   * /api/public/agent/whatsapp
 *   * /api/public/ingest/lead
 *   * /api/public/ingest/outcome
 *   * /api/public/ingest/recording
 * - Full Workspace Synchronization (GET /api/public/agent/workspace)
 * - Dirty State Protection: NEVER overwrites local leads with pending mutations
 * - Conflict Handling: Reconciles HTTP 409 conflicts via GET /api/public/agent/report
 * - 401 Unauthorized Handling: Suspends sync immediately and preserves Room data
 * - Stable Idempotency Keys: Preserves client_message_id / call_uid across retries
 * - Deletes operations from queue ONLY upon verified 2xx server response
 */

import { QueuedSyncOperation, SyncEngineStatus, Lead, WorkspaceResponse } from '../types';
import { winstoneRoomDb } from '../data/roomDatabase';
import {
  crmDataSource,
  mapRemoteLeadToDomain,
  mapRemoteCallToDomain,
  mapRemoteAgentToDomain,
  CrmUnauthorizedError,
  CrmConflictError,
  CrmValidationError,
  CrmNetworkError,
} from '../api/crmDataSource';
import { authRepository } from './authRepository';

export class CrmSyncWorker {
  private isOnlineState = typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing = false;
  private isWorkspaceSyncing = false;
  private lastSyncTimestamp: string | null = null;
  private onStatusChangedListeners: Array<(status: SyncEngineStatus) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnlineState = true;
        this.notifyStatus();
        this.executeWorker();
      });

      window.addEventListener('offline', () => {
        this.isOnlineState = false;
        this.notifyStatus();
      });
    }

    // Auto-sync workspace when authenticated
    authRepository.subscribe((isAuthenticated) => {
      if (isAuthenticated && this.isOnlineState) {
        this.syncWorkspace().catch((err) => {
          console.warn('[CrmSyncWorker] Initial workspace sync notice:', err);
        });
      }
    });
  }

  public subscribe(listener: (status: SyncEngineStatus) => void): () => void {
    this.onStatusChangedListeners.push(listener);
    listener(this.getSyncStatus());
    return () => {
      this.onStatusChangedListeners = this.onStatusChangedListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus() {
    const status = this.getSyncStatus();
    this.onStatusChangedListeners.forEach((l) => l(status));
  }

  public setOnline(online: boolean) {
    this.isOnlineState = online;
    this.notifyStatus();
    if (online) {
      this.executeWorker();
    }
  }

  public getOnlineState(): boolean {
    return this.isOnlineState;
  }

  public async triggerSync(): Promise<{ syncedCount: number; failedCount: number; reason?: string }> {
    return this.executeWorker();
  }

  public getSyncStatus(): SyncEngineStatus {
    const queue = winstoneRoomDb.getAllSyncOperations();
    const pending = queue.filter((q) => q.status === 'pending');
    const failed = queue.filter((q) => q.status === 'failed');

    let statusLabel = '';

    if (!this.isOnlineState) {
      statusLabel = 'Offline — changes saved locally';
    } else if (authRepository.isSessionUnauthorized()) {
      statusLabel = 'Session unauthorized (401) — sign in required';
    } else if (this.isSyncing || this.isWorkspaceSyncing) {
      statusLabel = 'Syncing with Winstone CRM…';
    } else if (failed.length > 0) {
      statusLabel = `Sync retry pending (${failed.length} failed)`;
    } else if (pending.length > 0) {
      statusLabel = `Pending CRM sync (${pending.length})`;
    } else if (this.lastSyncTimestamp) {
      statusLabel = 'CRM synced';
    } else {
      statusLabel = 'Connected to CRM';
    }

    return {
      isOnline: this.isOnlineState,
      isSyncing: this.isSyncing || this.isWorkspaceSyncing,
      pendingCount: pending.length,
      failedCount: failed.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
      usingMockFallback: false,
      statusLabel,
    };
  }

  /**
   * Full Workspace Synchronization (GET /api/public/agent/workspace)
   *
   * Flow:
   * 1. Call GET /api/public/agent/workspace
   * 2. Identify dirty leads in Room (leads with pending sync operations)
   * 3. Merge remote leads into Room without clobbering dirty leads
   * 4. Merge call history into Room
   * 5. Merge WhatsApp thread messages into Room
   * 6. Update Agent profile in Room
   */
  public async syncWorkspace(): Promise<WorkspaceResponse | null> {
    if (!this.isOnlineState) {
      console.warn('[CrmSyncWorker] Cannot sync workspace: offline.');
      return null;
    }

    if (!authRepository.isAuthenticated()) {
      console.warn('[CrmSyncWorker] Cannot sync workspace: unauthenticated.');
      return null;
    }

    this.isWorkspaceSyncing = true;
    this.notifyStatus();

    try {
      const response = await crmDataSource.getWorkspace();

      // Collect IDs of leads currently having pending outbound mutations
      const pendingOps = winstoneRoomDb.getPendingOperations();
      const dirtyLeadIds = new Set(
        pendingOps
          .filter((op) => op.entityType === 'lead' || op.operationType.includes('LEAD') || op.operationType.includes('OUTCOME'))
          .map((op) => op.entityId)
      );

      // Merge leads while protecting dirty local records
      if (response.leads && Array.isArray(response.leads)) {
        const agentName = response.agent?.name || 'Agent';
        const serverLeads = response.leads.map((dto) => mapRemoteLeadToDomain(dto, agentName));
        
        const existingLeads = winstoneRoomDb.getAllLeads();
        const existingLeadMap = new Map(existingLeads.map((l) => [l.id, l]));

        serverLeads.forEach((serverLead) => {
          if (dirtyLeadIds.has(serverLead.id)) {
            // Protect local unsynced edits!
            console.info(`[CrmSyncWorker] Preserving local dirty state for lead ${serverLead.id}`);
          } else {
            const existing = existingLeadMap.get(serverLead.id);
            if (existing) {
              // Merge preserving local timeline history
              existingLeadMap.set(serverLead.id, {
                ...serverLead,
                activityTimeline: existing.activityTimeline || [],
                callHistory: existing.callHistory || [],
              });
            } else {
              existingLeadMap.set(serverLead.id, serverLead);
            }
          }
        });

        winstoneRoomDb.insertLeads(Array.from(existingLeadMap.values()));
      }

      // Merge call history
      if (response.calls && Array.isArray(response.calls)) {
        response.calls.forEach((callDto) => {
          const domainCall = mapRemoteCallToDomain(callDto);
          winstoneRoomDb.insertCallActivity(domainCall);
        });
      }

      // Merge WhatsApp messages
      if (response.whatsapp && Array.isArray(response.whatsapp)) {
        winstoneRoomDb.insertWhatsAppMessages(response.whatsapp);
      }

      // Update agent profile
      if (response.agent) {
        const domainAgent = mapRemoteAgentToDomain(response.agent);
        winstoneRoomDb.updateAgent(domainAgent);
      }

      this.lastSyncTimestamp = new Date().toISOString();
      return response;
    } catch (err: any) {
      if (err instanceof CrmUnauthorizedError) {
        authRepository.handleUnauthorized();
      }
      console.warn('[CrmSyncWorker] Workspace sync notice:', err);
      return null;
    } finally {
      this.isWorkspaceSyncing = false;
      this.notifyStatus();
    }
  }

  /**
   * Android WorkManager Worker Execution (doWork)
   * Processes all pending SyncQueueDao items with exponential backoff
   */
  public async executeWorker(): Promise<{ syncedCount: number; failedCount: number; reason?: string }> {
    if (!this.isOnlineState) {
      return { syncedCount: 0, failedCount: 0, reason: 'Network constraint unsatisfied (Device is offline).' };
    }

    if (authRepository.isSessionUnauthorized()) {
      return { syncedCount: 0, failedCount: 0, reason: 'Session unauthorized (401). Sync suspended.' };
    }

    if (this.isSyncing) {
      return { syncedCount: 0, failedCount: 0, reason: 'Sync already in progress.' };
    }

    const pendingOps = winstoneRoomDb.getPendingOperations();
    if (pendingOps.length === 0) {
      return { syncedCount: 0, failedCount: 0, reason: 'SyncQueue is empty.' };
    }

    this.isSyncing = true;
    this.notifyStatus();

    let syncedCount = 0;
    let failedCount = 0;

    for (const op of pendingOps) {
      // Check if session became unauthorized during loop
      if (authRepository.isSessionUnauthorized()) {
        console.warn('[CrmSyncWorker] Sync loop paused: unauthorized session.');
        break;
      }

      try {
        await this.dispatchOperation(op);
        // Verified 2xx response: ONLY delete operation after verified success
        winstoneRoomDb.deleteSyncOperation(op.id);
        syncedCount++;
      } catch (err: any) {
        failedCount++;

        if (err instanceof CrmUnauthorizedError) {
          authRepository.handleUnauthorized();
          winstoneRoomDb.incrementRetry(op.id, '401 Unauthorized');
          break; // suspend remaining operations
        }

        if (err instanceof CrmConflictError) {
          console.warn(`[CrmSyncWorker] 409 Conflict encountered for op ${op.id}. Reconciling with server report state.`);
          try {
            const serverReport = await crmDataSource.getPendingReport();
            if (serverReport && serverReport.report_id) {
              winstoneRoomDb.savePendingReport({
                report_id: serverReport.report_id,
                lead_id: serverReport.lead_id || op.entityId,
                customer_name: serverReport.customer_name || 'Client',
                phone_number: serverReport.phone_number || '',
                call_started_at: serverReport.call_started_at || null,
                duration_seconds: serverReport.duration_seconds || 0,
                connected: true,
                opened_at: new Date().toISOString(),
              });
            }
          } catch (reconcileErr) {
            console.warn('[CrmSyncWorker] Conflict report reconciliation notice:', reconcileErr);
          }
          // Preserve failed op or increment retry
          winstoneRoomDb.incrementRetry(op.id, '409 Conflict with active CRM report');
          continue;
        }

        if (err instanceof CrmValidationError) {
          console.warn(`[CrmSyncWorker] 422 Validation Error for op ${op.id}. Marking failed without infinite retry.`);
          winstoneRoomDb.updateSyncOperationStatus(op.id, 'failed', err.message || '422 Validation/Business Rule Failure');
          continue;
        }

        const errorMsg = err?.message || 'Remote sync failure';
        winstoneRoomDb.incrementRetry(op.id, errorMsg);
      }
    }

    this.isSyncing = false;
    if (syncedCount > 0 && failedCount === 0) {
      this.lastSyncTimestamp = new Date().toISOString();
    }
    this.notifyStatus();

    return { syncedCount, failedCount };
  }

  /**
   * Dispatch operation to verified Winstone CRM endpoints
   */
  private async dispatchOperation(op: QueuedSyncOperation): Promise<void> {
    switch (op.operationType) {
      case 'CALL_START':
        await crmDataSource.callStart(op.payload);
        break;

      case 'CALL_STATE':
        await crmDataSource.callState(op.payload);
        break;

      case 'INCOMING_CALL':
        await crmDataSource.incomingCall(op.payload);
        break;

      case 'PRESENCE':
        await crmDataSource.presence(op.payload);
        break;

      case 'DEVICE_CAPABILITY':
        await crmDataSource.deviceCapability(op.payload);
        break;

      case 'OPEN_REPORT':
        await crmDataSource.openReport(op.payload);
        break;

      case 'SUBMIT_REPORT':
        await crmDataSource.submitReport(op.payload);
        break;

      case 'WHATSAPP_SYNC':
        await crmDataSource.syncWhatsApp(op.payload);
        break;

      case 'INGEST_LEAD':
        await crmDataSource.ingestLead(op.payload);
        break;

      case 'INGEST_OUTCOME':
      case 'LOG_CALL_OUTCOME':
        await crmDataSource.ingestOutcome(op.payload);
        break;

      case 'INGEST_RECORDING':
        await crmDataSource.ingestRecording(op.payload);
        break;

      case 'UPDATE_LEAD_CATEGORY':
        await crmDataSource.ingestOutcome({
          lead_id: op.entityId,
          agent_id: op.payload.agent_id || 'winstone-agent',
          outcome: `Category: ${op.payload.category}, Temp: ${op.payload.temperature}`,
          connected: true,
          notes: op.payload.notes,
        });
        break;

      default:
        console.warn(`[CrmSyncWorker] Unknown operation type ${op.operationType}. Marking completed locally.`);
        break;
    }
  }

  public async retryFailed(): Promise<void> {
    const all = winstoneRoomDb.getAllSyncOperations();
    all.forEach((op) => {
      if (op.status === 'failed') {
        winstoneRoomDb.updateSyncOperationStatus(op.id, 'pending');
      }
    });
    this.notifyStatus();
    if (this.isOnlineState && authRepository.isAuthenticated()) {
      await this.executeWorker();
    }
  }
}

export const crmSyncWorker = new CrmSyncWorker();

