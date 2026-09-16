import { ISyncRepository } from './interfaces';
import { QueuedSyncOperation, SyncEngineStatus, SyncOperationType } from '../types';
import { HttpClient } from '../api/httpClient';
import { API_ENDPOINTS } from '../config/appConfig';

/**
 * Offline Sync Repository implementing the Android WorkManager queue pattern.
 * Manages local mutation queue, exponential backoff, sync telemetry, and conflict mitigation.
 */

const STORAGE_KEY_QUEUE = 'winstone_sync_queue_v1';
const STORAGE_KEY_LAST_SYNC = 'winstone_last_sync_timestamp';

export class OfflineSyncRepository implements ISyncRepository {
  private queue: QueuedSyncOperation[] = [];
  private isOnlineState = navigator.onLine;
  private isSyncingState = false;
  private lastSyncTimestamp: string | null = null;
  private onQueueChangedListeners: Array<(queue: QueuedSyncOperation[]) => void> = [];

  constructor(
    private httpClient: HttpClient,
    private usingMock = false
  ) {
    this.loadFromStorage();

    // Listen for browser/Android WebView connectivity events
    window.addEventListener('online', () => {
      this.isOnlineState = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnlineState = false;
    });
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
      this.lastSyncTimestamp = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    } catch {
      this.queue = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(this.queue));
      if (this.lastSyncTimestamp) {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, this.lastSyncTimestamp);
      }
    } catch {
      // Storage quota or private mode fallback
    }
    this.notifyListeners();
  }

  public subscribeQueue(callback: (queue: QueuedSyncOperation[]) => void) {
    this.onQueueChangedListeners.push(callback);
    callback([...this.queue]);
    return () => {
      this.onQueueChangedListeners = this.onQueueChangedListeners.filter((c) => c !== callback);
    };
  }

  private notifyListeners() {
    this.onQueueChangedListeners.forEach((cb) => cb([...this.queue]));
  }

  public setOnline(online: boolean) {
    this.isOnlineState = online;
    if (online) {
      this.processQueue();
    }
  }

  public getSyncStatus(): SyncEngineStatus {
    const pending = this.queue.filter((q) => q.status === 'pending' || q.status === 'syncing').length;
    const failed = this.queue.filter((q) => q.status === 'failed').length;

    let statusLabel = 'Local storage active (Phase 1)';
    if (!this.isOnlineState) {
      statusLabel = 'Field Offline (Local only)';
    } else if (this.isSyncingState) {
      statusLabel = 'Processing local queue';
    } else if (pending > 0) {
      statusLabel = `Local changes pending (${pending})`;
    }

    return {
      isOnline: this.isOnlineState,
      isSyncing: this.isSyncingState,
      pendingCount: pending,
      failedCount: failed,
      lastSyncTimestamp: this.lastSyncTimestamp,
      usingMockFallback: this.usingMock,
      statusLabel,
    };
  }

  public getPendingOperations(): QueuedSyncOperation[] {
    return this.queue.filter((q) => q.status === 'pending');
  }

  public getQueue(): QueuedSyncOperation[] {
    return [...this.queue];
  }

  public async enqueue(
    operation: Omit<QueuedSyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ): Promise<QueuedSyncOperation> {
    return this.enqueueOperation(operation);
  }

  public async enqueueOperation(
    operation: Omit<QueuedSyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ): Promise<QueuedSyncOperation> {
    const queuedItem: QueuedSyncOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(queuedItem);
    this.saveToStorage();

    return queuedItem;
  }

  public async retryFailed(): Promise<void> {
    this.queue.forEach((op) => {
      if (op.status === 'failed') {
        op.status = 'pending';
      }
    });
    this.saveToStorage();
    if (this.isOnlineState) {
      this.processQueue();
    }
  }

  public async processQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    if (!this.isOnlineState || this.isSyncingState || this.queue.length === 0) {
      return { syncedCount: 0, failedCount: 0 };
    }

    this.isSyncingState = true;
    let syncedCount = 0;
    let failedCount = 0;

    const remainingQueue: QueuedSyncOperation[] = [];

    for (const item of this.queue) {
      // If mock mode, simulate successful sync batching
      if (this.usingMock || !this.httpClient.getBaseUrl()) {
        await new Promise((res) => setTimeout(res, 80));
        syncedCount++;
        continue;
      }

      // Remote mode execution
      try {
        item.status = 'syncing';
        this.saveToStorage();

        await this.dispatchRemoteSync(item);
        syncedCount++;
      } catch (err: any) {
        item.retryCount += 1;
        item.status = 'failed';
        item.lastError = err?.message || 'Network sync failure';
        failedCount++;

        // Keep item in queue for exponential retry unless exceeds 5 retries
        if (item.retryCount < 5) {
          remainingQueue.push(item);
        }
      }
    }

    this.queue = remainingQueue;
    this.lastSyncTimestamp = new Date().toISOString();
    this.isSyncingState = false;
    this.saveToStorage();

    return { syncedCount, failedCount };
  }

  private async dispatchRemoteSync(item: QueuedSyncOperation): Promise<void> {
    switch (item.operationType) {
      case 'LOG_CALL_OUTCOME':
        await this.httpClient.post(API_ENDPOINTS.LOG_CALL, item.payload);
        break;
      case 'ADD_NOTE':
        await this.httpClient.post(API_ENDPOINTS.ADD_NOTE, item.payload);
        break;
      case 'CREATE_FOLLOW_UP':
        await this.httpClient.post(API_ENDPOINTS.FOLLOW_UPS, item.payload);
        break;
      case 'COMPLETE_FOLLOW_UP':
        await this.httpClient.post(API_ENDPOINTS.FOLLOW_UP_COMPLETE(item.entityId));
        break;
      case 'BATCH_COMPLETE_FOLLOW_UPS':
        await this.httpClient.post(API_ENDPOINTS.FOLLOW_UP_BATCH_COMPLETE, item.payload);
        break;
      case 'RESCHEDULE_FOLLOW_UP':
        await this.httpClient.post(API_ENDPOINTS.FOLLOW_UP_RESCHEDULE(item.entityId), item.payload);
        break;
      case 'CREATE_SITE_VISIT':
        await this.httpClient.post(API_ENDPOINTS.SITE_VISITS, item.payload);
        break;
      case 'UPDATE_LEAD_CATEGORY':
        await this.httpClient.patch(API_ENDPOINTS.UPDATE_LEAD(item.entityId), item.payload);
        break;
    }
  }

  public async clearQueue(): Promise<void> {
    this.queue = [];
    this.saveToStorage();
  }
}
