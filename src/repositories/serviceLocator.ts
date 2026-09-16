import { AppEnvironmentConfig } from '../config/appConfig';
import { HttpClient, defaultHttpClient } from '../api/httpClient';
import {
  IAuthRepository,
  IAgentRepository,
  ILeadRepository,
  IFollowUpRepository,
  ISiteVisitRepository,
  IPerformanceRepository,
  ISyncRepository,
} from './interfaces';
import {
  LocalRoomLeadRepository,
  LocalRoomAgentRepository,
  LocalRoomFollowUpRepository,
  LocalRoomSiteVisitRepository,
  LocalRoomPerformanceRepository,
  RoomSyncRepository,
} from './roomRepositories';
import { authRepository } from './authRepository';
import { MockCallingEngine, MockRecordingEngine } from '../engines/callingEngine';
import { ICallingEngine, IRecordingEngine } from '../types';
import { crmEnvironment } from '../config/crmEnvironment';
import { crmDataSource } from '../api/crmDataSource';

/**
 * Dependency Injection Container / Repository Provider for Winstone Agent App.
 *
 * Implements clean dependency inversion: ViewModels and UI depend ONLY on repository
 * and engine interfaces (ILeadRepository, IAgentRepository, ISyncRepository, ICallingEngine, IRecordingEngine).
 *
 * Phase 3 Architecture:
 * View -> ViewModel / UI -> Repository Interfaces -> Local Room Repositories -> Room Database (winstoneRoomDb).
 * Background synchronization is managed via WorkManager (CrmSyncWorker).
 * If CRM is not configured, operations remain safe in Room and UI displays "CRM connection not configured".
 */
export class ServiceLocator {
  private static instance: ServiceLocator;

  public httpClient: HttpClient;
  public authRepo: IAuthRepository;
  public agentRepo: IAgentRepository;
  public leadRepo: ILeadRepository;
  public followUpRepo: IFollowUpRepository;
  public siteVisitRepo: ISiteVisitRepository;
  public performanceRepo: IPerformanceRepository;
  public syncRepo: ISyncRepository;
  public callingEngine: ICallingEngine;
  public recordingEngine: IRecordingEngine;

  private isMockMode: boolean;

  private constructor() {
    this.httpClient = defaultHttpClient;
    this.callingEngine = new MockCallingEngine();
    this.recordingEngine = new MockRecordingEngine();

    // Default offline-first Room authority with WorkManager sync
    this.isMockMode = !crmEnvironment.isConfigured();

    this.authRepo = authRepository;
    this.agentRepo = new LocalRoomAgentRepository();
    this.leadRepo = new LocalRoomLeadRepository();
    this.followUpRepo = new LocalRoomFollowUpRepository();
    this.siteVisitRepo = new LocalRoomSiteVisitRepository();
    this.performanceRepo = new LocalRoomPerformanceRepository();
    this.syncRepo = new RoomSyncRepository();
  }

  public static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  public getIsMockMode(): boolean {
    return this.isMockMode;
  }

  public toggleMockMode(forceMock?: boolean) {
    this.isMockMode = forceMock !== undefined ? forceMock : !this.isMockMode;
    this.authRepo = authRepository;
    this.agentRepo = new LocalRoomAgentRepository();
    this.leadRepo = new LocalRoomLeadRepository();
    this.followUpRepo = new LocalRoomFollowUpRepository();
    this.siteVisitRepo = new LocalRoomSiteVisitRepository();
    this.performanceRepo = new LocalRoomPerformanceRepository();
    this.syncRepo = new RoomSyncRepository();
  }
}

export const services = ServiceLocator.getInstance();

