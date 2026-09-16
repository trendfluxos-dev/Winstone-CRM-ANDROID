import { HttpClient } from '../api/httpClient';
import { API_ENDPOINTS } from '../config/appConfig';
import {
  IAuthRepository,
  IAgentRepository,
  IRemoteLeadRepository,
  IFollowUpRepository,
  ISiteVisitRepository,
  IPerformanceRepository,
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
  CallOutcomeRequest,
} from '../types';

/**
 * Remote CRM Repository Interface Implementations (Phase 2 Placeholder Abstractions)
 *
 * NOTE: As per Phase 1 architecture instructions, these implementations are clean
 * interface abstractions ready for Phase 2 when the real Winstone CRM endpoints
 * are officially provided. No fake credentials or simulated responses are used here.
 */

export class RemoteAuthRepository implements IAuthRepository, IAgentRepository {
  constructor(private http: HttpClient) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const res = await this.http.post<{ session: AuthSession }>(API_ENDPOINTS.AUTH_LOGIN, credentials);
    if (res?.session?.accessToken) {
      this.http.setAuthToken(res.session.accessToken);
    }
    return res.session;
  }

  async restoreSession(): Promise<AuthSession | null> {
    try {
      const res = await this.http.get<{ session: AuthSession }>(API_ENDPOINTS.AUTH_SESSION);
      if (res?.session?.accessToken) {
        this.http.setAuthToken(res.session.accessToken);
      }
      return res.session;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.http.post(API_ENDPOINTS.AUTH_LOGOUT);
    } finally {
      this.http.setAuthToken(null);
    }
  }

  async getAgentProfile(): Promise<Agent> {
    const res = await this.http.get<{ agent: Agent }>(API_ENDPOINTS.AGENT_PROFILE);
    return res.agent;
  }

  async updateAgentStatus(status: string): Promise<Agent> {
    const res = await this.http.patch<{ agent: Agent }>(API_ENDPOINTS.AGENT_PROFILE, { status });
    return res.agent;
  }
}

export class RemoteLeadRepository implements IRemoteLeadRepository {
  constructor(private http: HttpClient) {}

  async getAssignedLeads(): Promise<Lead[]> {
    const res = await this.http.get<{ leads: Lead[] }>(API_ENDPOINTS.ASSIGNED_LEADS);
    return res.leads;
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const res = await this.http.get<{ lead: Lead }>(API_ENDPOINTS.LEAD_DETAIL(id));
    return res.lead;
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
    const res = await this.http.patch<{ lead: Lead }>(API_ENDPOINTS.UPDATE_LEAD(id), {
      temperature,
      operationalCategory: category,
    });
    return res.lead;
  }

  async logCallOutcome(request: CallOutcomeRequest): Promise<{ callRecordId: string; updatedLead: Lead }> {
    const res = await this.http.post<{ callRecordId: string; updatedLead: Lead }>(
      API_ENDPOINTS.LOG_CALL,
      request
    );
    return res;
  }

  async addNote(leadId: string, note: string): Promise<Lead> {
    const res = await this.http.post<{ lead: Lead }>(API_ENDPOINTS.ADD_NOTE, {
      leadId,
      note,
    });
    return res.lead;
  }

  async syncWithRemote(): Promise<{ updatedCount: number }> {
    return { updatedCount: 0 };
  }
}

export class RemoteFollowUpRepository implements IFollowUpRepository {
  constructor(private http: HttpClient) {}

  async getFollowUps(): Promise<FollowUp[]> {
    const res = await this.http.get<{ followUps: FollowUp[] }>(API_ENDPOINTS.FOLLOW_UPS);
    return res.followUps;
  }

  async createFollowUp(item: Omit<FollowUp, 'id'>): Promise<FollowUp> {
    const res = await this.http.post<{ followUp: FollowUp }>(API_ENDPOINTS.FOLLOW_UPS, item);
    return res.followUp;
  }

  async completeFollowUp(id: string): Promise<FollowUp> {
    const res = await this.http.post<{ followUp: FollowUp }>(
      API_ENDPOINTS.FOLLOW_UP_COMPLETE(id),
      {}
    );
    return res.followUp;
  }

  async batchCompleteFollowUps(ids: string[]): Promise<string[]> {
    const res = await this.http.post<{ completedIds: string[] }>(
      API_ENDPOINTS.FOLLOW_UP_BATCH_COMPLETE,
      { ids }
    );
    return res.completedIds;
  }

  async rescheduleFollowUp(id: string, newDate: string, newTime: string): Promise<FollowUp> {
    const res = await this.http.patch<{ followUp: FollowUp }>(
      API_ENDPOINTS.FOLLOW_UP_RESCHEDULE(id),
      { date: newDate, time: newTime }
    );
    return res.followUp;
  }
}

export class RemoteSiteVisitRepository implements ISiteVisitRepository {
  constructor(private http: HttpClient) {}

  async getSiteVisits(): Promise<SiteVisit[]> {
    const res = await this.http.get<{ siteVisits: SiteVisit[] }>(API_ENDPOINTS.SITE_VISITS);
    return res.siteVisits;
  }

  async createSiteVisit(item: Omit<SiteVisit, 'id'>): Promise<SiteVisit> {
    const res = await this.http.post<{ siteVisit: SiteVisit }>(API_ENDPOINTS.SITE_VISITS, item);
    return res.siteVisit;
  }

  async updateSiteVisitStatus(id: string, status: SiteVisit['status']): Promise<SiteVisit> {
    const res = await this.http.patch<{ siteVisit: SiteVisit }>(
      API_ENDPOINTS.UPDATE_SITE_VISIT(id),
      { status }
    );
    return res.siteVisit;
  }
}
