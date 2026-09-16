import React, { useState, useEffect } from 'react';
import {
  NavTab,
  Lead,
  FollowUp,
  SiteVisit,
  PerformanceData,
  CallOutcome,
  LeadTemperature,
  OperationalCategory,
  Agent,
  AuthSession,
  LoginCredentials,
  QueuedSyncOperation,
  SyncEngineStatus,
  PendingReportState,
  SubmitReportPayload,
} from './types';
import { services } from './repositories/serviceLocator';
import { authRepository } from './repositories/authRepository';
import { winstoneRoomDb } from './data/roomDatabase';
import { crmDataSource } from './api/crmDataSource';
import { crmSyncWorker } from './repositories/crmSyncWorker';
import { AndroidDeviceFrame } from './components/AndroidDeviceFrame';
import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar } from './components/BottomNavBar';
import { DashboardScreen } from './components/DashboardScreen';
import { LeadsScreen } from './components/LeadsScreen';
import { LeadDetailsScreen } from './components/LeadDetailsScreen';
import { CallScreen } from './components/CallScreen';
import { CallOutcomeDialog } from './components/CallOutcomeDialog';
import { FollowUpsScreen } from './components/FollowUpsScreen';
import { PerformanceScreen } from './components/PerformanceScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LoginScreen } from './components/LoginScreen';
import { CoordinatorDeckScreen } from './components/CoordinatorDeckScreen';
import { ExecutiveHqScreen } from './components/ExecutiveHqScreen';
import { ItConsoleScreen } from './components/ItConsoleScreen';
import {
  AddNoteModal,
  ScheduleFollowUpModal,
  ScheduleSiteVisitModal,
  AddNewLeadModal,
} from './components/ScheduleModals';
import { KotlinCodeViewer } from './components/KotlinCodeViewer';
import { SyncMonitorDrawer } from './components/SyncMonitorDrawer';
import { CheckCircle2, BellRing, Sparkles, AlertTriangle } from 'lucide-react';

export default function App() {
  // Navigation & View Modes
  const [viewMode, setViewMode] = useState<'device' | 'expanded'>('device');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Auth & Session State
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Telephony & Outcome Flow
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [pendingReport, setPendingReport] = useState<PendingReportState | null>(
    winstoneRoomDb.getPendingReport()
  );
  const [outcomeDialogData, setOutcomeDialogData] = useState<{
    lead: Lead;
    durationSeconds: number;
    initialNotes: string;
    reportId?: string;
  } | null>(null);

  // Sub-Modals
  const [noteModalLead, setNoteModalLead] = useState<Lead | null>(null);
  const [followUpModalLead, setFollowUpModalLead] = useState<Lead | null>(null);
  const [siteVisitModalLead, setSiteVisitModalLead] = useState<Lead | null>(null);
  const [showAddNewLeadModal, setShowAddNewLeadModal] = useState(false);
  const [showKotlinViewer, setShowKotlinViewer] = useState(false);
  const [showSyncMonitor, setShowSyncMonitor] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core Reactive State loaded via Repositories
  const [agent, setAgent] = useState<Agent | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  // Sync Engine Telemetry
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(services.syncRepo.getSyncStatus());
  const [syncQueue, setSyncQueue] = useState<QueuedSyncOperation[]>(services.syncRepo.getQueue());

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initialize Session and Load Room Repository Data
  useEffect(() => {
    const initApp = async () => {
      try {
        const restored = await services.authRepo.restoreSession();
        if (restored) {
          setSession(restored);
          setAgent(restored.agent);
          await loadRepositoryData();
        }
      } catch (err: any) {
        console.warn('[initApp] Initialization note:', err);
      }
    };

    initApp();

    // 1. Observe Room Database tables (Emulates Kotlin Flow observation)
    const unsubLeads = winstoneRoomDb.observeAllLeads((freshLeads) => {
      setLeads(freshLeads);
      setSelectedLead((prev) => {
        if (!prev) return null;
        return freshLeads.find((l) => l.id === prev.id) || prev;
      });
    });

    const unsubFollowUps = winstoneRoomDb.observeAllFollowUps((freshFollowUps) => {
      setFollowUps(freshFollowUps);
    });

    const unsubAgent = winstoneRoomDb.observeAgent((freshAgent) => {
      if (freshAgent) setAgent(freshAgent);
    });

    const unsubQueue = winstoneRoomDb.observeSyncQueue((freshQueue) => {
      setSyncQueue(freshQueue);
      setSyncStatus(services.syncRepo.getSyncStatus());
    });

    const unsubPendingReport = winstoneRoomDb.observePendingReport((freshPending) => {
      setPendingReport(freshPending);
    });

    return () => {
      unsubLeads();
      unsubFollowUps();
      unsubAgent();
      unsubQueue();
      unsubPendingReport();
    };
  }, []);

  const loadRepositoryData = async () => {
    try {
      const [leadsData, followUpsData, visitsData, perfData] = await Promise.all([
        services.leadRepo.getAssignedLeads(),
        services.followUpRepo.getFollowUps(),
        services.siteVisitRepo.getSiteVisits(),
        services.performanceRepo.getPerformanceMetrics(),
      ]);

      setLeads(leadsData);
      setFollowUps(followUpsData);
      setSiteVisits(visitsData);
      setPerformance(perfData);
    } catch (err: any) {
      console.error('Error loading repository data:', err);
    }
  };

  // Authentication Handlers
  const handleLogin = async (credentials: LoginCredentials) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const newSession = await services.authRepo.login(credentials);
      setSession(newSession);
      setAgent(newSession.agent);
      await loadRepositoryData();
      showToast(`Welcome, ${newSession.agent.name}! Session authenticated.`);
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await services.authRepo.logout();
    setSession(null);
    setAgent(null);
    showToast('Logged out of CRM session.');
  };

  // Telephony Handlers & Overlapping Call Guard
  const handleStartCall = async (lead: Lead) => {
    if (pendingReport) {
      showToast('⚠️ Action Blocked: Complete your pending CRM call report before placing a new call.');
      return;
    }

    if (crmDataSource.isConfigured() && syncStatus.isOnline && authRepository.isAuthenticated()) {
      try {
        await crmDataSource.callStart({ lead_id: lead.id });
      } catch (err: any) {
        if (err?.name === 'CrmConflictError' || err?.status === 409) {
          showToast(`⚠️ CRM Call Blocked: ${err.message || 'Active report or call conflict exists on CRM server.'}`);
          try {
            const report = await crmDataSource.getPendingReport();
            if (report && report.report_id) {
              winstoneRoomDb.savePendingReport(report);
            }
          } catch {
            // safe fallback
          }
          return;
        }
        console.warn('[handleStartCall] Call-start notification notice:', err);
      }
    }

    setActiveCallLead(lead);
  };

  const handleEndCall = async (durationSeconds: number, inCallNote: string) => {
    if (!activeCallLead) return;
    const lead = activeCallLead;
    setActiveCallLead(null);

    let generatedReportId = `rep-${Date.now()}`;
    const startTimeIso = new Date(Date.now() - durationSeconds * 1000).toISOString();

    // 1. Agent opens report via verified CRM endpoint: POST /api/public/agent/report { action: "open", ... }
    try {
      if (crmDataSource.isConfigured() && navigator.onLine) {
        const res = await crmDataSource.openReport({
          action: 'open',
          lead_id: lead.id,
          recording_id: null,
          phone_number: lead.phone,
          call_started_at: startTimeIso,
          duration_seconds: durationSeconds,
          connected: durationSeconds > 0,
        });
        if (res && res.report_id) {
          generatedReportId = res.report_id;
        }
      }
    } catch (err) {
      console.warn('[handleEndCall] Remote open report deferred, saving pending state in Room:', err);
    }

    // 2. Save pending report state locally in Room to prevent overlapping call operations
    const newPendingReport: PendingReportState = {
      report_id: generatedReportId,
      lead_id: lead.id,
      phone_number: lead.phone,
      call_started_at: startTimeIso,
      duration_seconds: durationSeconds,
      connected: durationSeconds > 0,
      status: 'opened',
      cached_at: new Date().toISOString(),
    };
    winstoneRoomDb.savePendingReport(newPendingReport);

    setOutcomeDialogData({
      lead,
      durationSeconds,
      initialNotes: inCallNote,
      reportId: generatedReportId,
    });
  };

  const handleSaveCallOutcome = async (payload: {
    outcome: CallOutcome;
    temperature: LeadTemperature;
    category: OperationalCategory;
    grade: 'A' | 'B' | 'C' | 'D';
    summary: string;
    notes: string;
    reason: string;
    reminderMinutes?: number;
    aiDecision: 'accepted' | 'edited' | 'rejected';
    nextFollowUpDate?: string;
    nextFollowUpTime?: string;
    followUpReason?: string;
  }) => {
    if (!outcomeDialogData) return;
    const { lead, durationSeconds, reportId } = outcomeDialogData;
    const activeReportId = reportId || pendingReport?.report_id || `rep-${Date.now()}`;

    // 1. Call outcome request object adhering to Phase 2 Room contract
    const outcomeReq = {
      leadId: lead.id,
      outcome: payload.outcome,
      durationSeconds,
      temperature: payload.temperature,
      operationalCategory: payload.category,
      notes: payload.notes,
      followUpDate: payload.nextFollowUpDate,
      followUpTime: payload.nextFollowUpTime,
    };

    // Mutate Room repository state directly
    const { updatedLead } = await services.leadRepo.logCallOutcome(outcomeReq);

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === lead.id) {
      setSelectedLead(updatedLead);
    }

    // 2. Submit validated CRM report payload (POST /api/public/agent/report action: "submit")
    // CRITICAL: temperature is lowercase hot/warm/cold, grade is separate A/B/C/D
    const submitPayload: SubmitReportPayload = {
      action: 'submit',
      report_id: activeReportId,
      category: payload.category,
      summary: payload.summary,
      note: payload.notes,
      reason: payload.reason,
      follow_up_at: payload.nextFollowUpDate ? `${payload.nextFollowUpDate}T11:00:00Z` : null,
      reminder_minutes: payload.reminderMinutes || 15,
      temperature: payload.temperature.toLowerCase() as 'hot' | 'warm' | 'cold',
      grade: payload.grade,
      ai_decision: payload.aiDecision,
    };

    if (crmDataSource.isConfigured() && syncStatus.isOnline) {
      try {
        await crmDataSource.submitReport(submitPayload);
      } catch (err: any) {
        console.warn('[handleSaveCallOutcome] Remote submit report queued:', err);
        await services.syncRepo.enqueueOperation({
          operationType: 'SUBMIT_REPORT',
          entityId: activeReportId,
          payload: submitPayload,
        });
      }
    } else {
      await services.syncRepo.enqueueOperation({
        operationType: 'SUBMIT_REPORT',
        entityId: activeReportId,
        payload: submitPayload,
      });
    }

    // 3. Clear pending report state in Room and trigger sync
    winstoneRoomDb.clearPendingReport();
    crmSyncWorker.triggerSync();

    // Update Performance Metrics
    setPerformance((prev) => {
      if (!prev) return null;
      const talkMins = Math.ceil(durationSeconds / 60);
      const isConnected = payload.outcome !== 'No answer' && payload.outcome !== 'Wrong number';
      const isInterested = payload.outcome === 'Interested';

      return {
        ...prev,
        today: {
          ...prev.today,
          callsMade: prev.today.callsMade + 1,
          connectedCalls: prev.today.connectedCalls + (isConnected ? 1 : 0),
          interestedLeads: prev.today.interestedLeads + (isInterested ? 1 : 0),
          talkTimeMinutes: prev.today.talkTimeMinutes + talkMins,
        },
      };
    });

    setOutcomeDialogData(null);
    showToast(`Call report submitted & synchronized for ${lead.customerName}!`);
  };

  // Classification Updates
  const handleUpdateLeadClassification = async (
    temp: LeadTemperature,
    cat: OperationalCategory
  ) => {
    if (!selectedLead) return;
    const updated = await services.leadRepo.updateLeadCategory(selectedLead.id, temp, cat);
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)));
    setSelectedLead(updated);
    showToast(`Classification updated: ${temp} • Cat ${cat}`);
  };

  const handleSelectLead = async (leadOrId: Lead | string) => {
    if (typeof leadOrId === 'string') {
      const fetched = await services.leadRepo.getLeadById(leadOrId);
      if (fetched) {
        setSelectedLead(fetched);
      } else {
        const found = leads.find((l) => l.id === leadOrId) || null;
        setSelectedLead(found);
      }
    } else {
      const fetched = await services.leadRepo.getLeadById(leadOrId.id);
      setSelectedLead(fetched || leadOrId);
    }
  };

  // Follow-up Actions
  const handleBatchCompleteFollowUps = async (ids: string[]) => {
    if (ids.length === 0) return;
    await services.followUpRepo.batchCompleteFollowUps(ids);

    const idsSet = new Set(ids);
    setFollowUps((prev) =>
      prev.map((fu) => (idsSet.has(fu.id) ? { ...fu, status: 'completed' as const } : fu))
    );

    // Queue Batch Complete
    await services.syncRepo.enqueueOperation({
      operationType: 'BATCH_COMPLETE_FOLLOW_UPS',
      entityId: `batch-${Date.now()}`,
      payload: { ids },
    });

    setPerformance((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        today: {
          ...prev.today,
          followUpsDone: prev.today.followUpsDone + ids.length,
        },
        sevenDays: {
          ...prev.sevenDays,
          followUpsDone: prev.sevenDays.followUpsDone + ids.length,
        },
        thirtyDays: {
          ...prev.thirtyDays,
          followUpsDone: prev.thirtyDays.followUpsDone + ids.length,
        },
      };
    });

    showToast(
      ids.length === 1
        ? 'Follow-up completed locally & queued for CRM sync'
        : `Batch completed ${ids.length} follow-ups & queued for sync`
    );
  };

  const handleCompleteFollowUp = (id: string) => {
    handleBatchCompleteFollowUps([id]);
  };

  const handleRescheduleFollowUp = async (id: string, newDate: string, newTime: string) => {
    await services.followUpRepo.rescheduleFollowUp(id, newDate, newTime);
    setFollowUps((prev) =>
      prev.map((fu) =>
        fu.id === id ? { ...fu, date: newDate, time: newTime, status: 'pending' as const } : fu
      )
    );

    await services.syncRepo.enqueueOperation({
      operationType: 'RESCHEDULE_FOLLOW_UP',
      entityId: id,
      payload: { newDate, newTime },
    });

    showToast(`Follow-up rescheduled to ${newDate} at ${newTime}`);
  };

  // Note Modal Save
  const handleSaveNote = async (noteText: string) => {
    if (!noteModalLead) return;
    const targetLead = noteModalLead;
    const updatedLead = await services.leadRepo.addNote(targetLead.id, noteText);

    setLeads((prev) => prev.map((l) => (l.id === targetLead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === targetLead.id) {
      setSelectedLead(updatedLead);
    }

    await services.syncRepo.enqueueOperation({
      operationType: 'ADD_NOTE',
      entityId: targetLead.id,
      payload: { leadId: targetLead.id, note: noteText },
    });

    setNoteModalLead(null);
    showToast('Note saved locally & queued for CRM sync');
  };

  // Schedule Follow-up Modal Save
  const handleSaveScheduleFollowUp = async (date: string, time: string, reason: string) => {
    if (!followUpModalLead) return;
    const targetLead = followUpModalLead;

    const newFollowUp: FollowUp = {
      id: `fu-${Date.now()}`,
      leadId: targetLead.id,
      customerName: targetLead.customerName,
      phone: targetLead.phone,
      project: targetLead.project,
      date,
      time,
      reason,
      status: 'pending',
      priority: targetLead.temperature === 'Hot' ? 'high' : 'medium',
    };

    setFollowUps((prev) => [newFollowUp, ...prev]);

    const updatedLead: Lead = {
      ...targetLead,
      nextFollowUp: `${date} ${time}`,
      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          leadId: targetLead.id,
          type: 'followup',
          title: 'Follow-up Scheduled',
          description: `${reason} (${date} at ${time})`,
          timestamp: 'Just now',
          agentName: agent?.name || 'Agent',
        },
        ...targetLead.activityTimeline,
      ],
    };

    setLeads((prev) => prev.map((l) => (l.id === targetLead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === targetLead.id) {
      setSelectedLead(updatedLead);
    }

    await services.syncRepo.enqueueOperation({
      operationType: 'CREATE_FOLLOW_UP',
      entityId: newFollowUp.id,
      payload: newFollowUp,
    });

    setFollowUpModalLead(null);
    showToast('Follow-up scheduled & queued for sync');
  };

  // Site Visit Modal Save
  const handleSaveSiteVisit = async (date: string, time: string, notes: string) => {
    if (!siteVisitModalLead) return;
    const targetLead = siteVisitModalLead;

    const newVisit: SiteVisit = {
      id: `sv-${Date.now()}`,
      leadId: targetLead.id,
      customerName: targetLead.customerName,
      phone: targetLead.phone,
      project: targetLead.project,
      date,
      time,
      notes,
      status: 'Scheduled',
    };

    setSiteVisits((prev) => [newVisit, ...prev]);

    const updatedLead: Lead = {
      ...targetLead,
      status: 'Site Visit',
      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          leadId: targetLead.id,
          type: 'site_visit',
          title: 'Physical Site Tour Booked',
          description: `${targetLead.project} visit set for ${date} at ${time}.`,
          timestamp: 'Just now',
          agentName: agent?.name || 'Agent',
        },
        ...targetLead.activityTimeline,
      ],
    };

    setLeads((prev) => prev.map((l) => (l.id === targetLead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === targetLead.id) {
      setSelectedLead(updatedLead);
    }

    setPerformance((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        today: { ...prev.today, siteVisits: prev.today.siteVisits + 1 },
      };
    });

    await services.syncRepo.enqueueOperation({
      operationType: 'CREATE_SITE_VISIT',
      entityId: newVisit.id,
      payload: newVisit,
    });

    setSiteVisitModalLead(null);
    showToast(`Site visit queued for ${targetLead.project}!`);
  };

  // Real-time Event Simulation: Ingest a New Meta Lead
  const handleSimulateIncomingLead = () => {
    const newLead: Lead = {
      id: `lead-sim-${Date.now()}`,
      customerName: 'Barrister Shahriar Kabir',
      phone: '+880 1718-924011',
      email: 'shahriar.kabir@dhakachambers.com',
      project: 'Winstone Pinnacle (Gulshan-2)',
      source: 'Meta Facebook Ad',
      campaign: 'Gulshan Luxury Duplex Campaign Q3',
      temperature: 'Hot',
      operationalCategory: 'A',
      assignedAgent: agent?.name || 'Tanvir Ahmed',
      createdDate: '2026-09-15',
      lastContact: 'Never',
      nextFollowUp: 'Today, within 15 mins',
      status: 'New',
      notes: [
        'High-value prospect from Facebook Lead Form. Requested 4,200 sq ft penthouse brochure and payment structure.',
      ],
      callHistory: [],
      activityTimeline: [
        {
          id: `act-sim-${Date.now()}`,
          leadId: `lead-sim-${Date.now()}`,
          type: 'note',
          title: 'Instant Meta Lead Ingested',
          description: 'Verified phone & instant callback alert triggered.',
          timestamp: 'Just now',
          agentName: 'System (Meta Sync)',
        },
      ],
    };

    setLeads((prev) => [newLead, ...prev]);
    setPerformance((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        today: { ...prev.today, leadsAssigned: prev.today.leadsAssigned + 1 },
      };
    });

    showToast('⚡ New Lead Alert: Barrister Shahriar Kabir assigned to you!');
  };

  // Ingest New Lead from Agent App (POST /api/public/ingest/lead)
  const handleSaveNewLead = async (payload: { name: string; phone: string; company: string; notes: string }) => {
    setShowAddNewLeadModal(false);
    const agentId = agent?.id || 'agt-001';
    const newLeadId = `lead-${Date.now()}`;
    const newLead: Lead = {
      id: newLeadId,
      customerName: payload.name,
      phone: payload.phone,
      project: payload.company,
      source: 'Mobile Intake',
      status: 'New',
      temperature: 'Warm',
      operationalCategory: 'B',
      lastContact: 'Just added',
      createdDate: new Date().toISOString().split('T')[0],
      notes: payload.notes ? [payload.notes] : [],
      nextFollowUp: 'Tomorrow, 10:00 AM',
      assignedAgent: agent?.name || 'Agent',
      assignedTo: agent?.name || 'Agent',
      callAttempts: 0,
      isTwoSided: false,
      callHistory: [],
      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          leadId: newLeadId,
          type: 'note',
          title: 'Lead Ingested via Agent App',
          description: payload.notes || 'Direct client intake via Winstone Agent App.',
          timestamp: 'Just now',
          agentName: agent?.name || 'Agent',
        },
      ],
    };

    // 1. Save directly into local Room Database
    winstoneRoomDb.insertLead(newLead);
    setLeads(winstoneRoomDb.getAllLeads());

    // 2. Prepare verified CRM ingestion payload (POST /api/public/ingest/lead)
    const ingestPayload = {
      name: payload.name,
      phone_number: payload.phone,
      company: payload.company,
      notes: payload.notes,
      source: 'agent_app' as const,
      assign: true,
      agent_id: agentId,
    };

    try {
      if (crmDataSource.isConfigured() && syncStatus.isOnline) {
        await crmDataSource.ingestLead(ingestPayload);
        showToast(`Lead "${payload.name}" synced directly to Winstone CRM!`);
      } else {
        winstoneRoomDb.enqueue({
          operationType: 'INGEST_LEAD',
          entityType: 'lead',
          entityId: newLeadId,
          payload: ingestPayload,
        });
        showToast(`Lead "${payload.name}" saved to Room. Ingest sync queued.`);
      }
    } catch (err) {
      console.warn('[handleSaveNewLead] Remote ingest failed, queued in Room:', err);
      winstoneRoomDb.enqueue({
        operationType: 'INGEST_LEAD',
        entityType: 'lead',
        entityId: newLeadId,
        payload: ingestPayload,
      });
      showToast(`Saved to local Room database. Sync queued for network retry.`);
    }

    setSyncQueue(winstoneRoomDb.getAllSyncOperations());
  };

  // Sync Drawer Operations
  const handleTriggerManualSync = async () => {
    const res = await services.syncRepo.processQueue();
    setSyncStatus(services.syncRepo.getSyncStatus());
    setSyncQueue(services.syncRepo.getQueue());
    showToast(`Sync completed: ${res.syncedCount} items synced, ${res.failedCount} failed.`);
  };

  const handleToggleOnline = () => {
    const newOnline = !syncStatus.isOnline;
    services.syncRepo.setOnline(newOnline);
    setSyncStatus(services.syncRepo.getSyncStatus());
    showToast(newOnline ? 'Network status: Online' : 'Network status: Field Offline');
  };

  const handleToggleMockMode = () => {
    services.toggleMockMode();
    setSyncStatus(services.syncRepo.getSyncStatus());
    showToast(`Mode switched to: ${services.getIsMockMode() ? 'Dev Mock' : 'Remote CRM API'}`);
  };

  // Compute badge counts
  const pendingFollowUpsCount = followUps.filter(
    (f) => f.date === '2026-09-15' && f.status === 'pending'
  ).length;
  const newLeadsCount = leads.filter((l) => l.status === 'New').length;

  return (
    <AndroidDeviceFrame
      viewMode={viewMode}
      onChangeViewMode={setViewMode}
      onOpenKotlinViewer={() => setShowKotlinViewer(true)}
      onOpenSyncMonitor={() => setShowSyncMonitor(true)}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-12 inset-x-3 z-50 bg-[#121216] text-white text-xs px-3.5 py-2.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-[#D4AF37]/40 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="font-medium text-[11px] text-[#DFCCA0]">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Screen 0: Unauthenticated Login Screen */}
      {!session || !agent ? (
        <LoginScreen
          onLogin={handleLogin}
          isLoading={isAuthLoading}
          errorMessage={authError}
          isMockMode={services.getIsMockMode()}
        />
      ) : activeCallLead ? (
        /* Screen 1: Active Call Screen Overlay */
        <CallScreen lead={activeCallLead} onEndCall={handleEndCall} />
      ) : (
        /* Regular Application Screen Structure */
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0A0A0C]">
          {/* Header Bar */}
          <HeaderBar
            currentTab={currentTab}
            isDetailView={selectedLead !== null}
            onBackToTabs={() => setSelectedLead(null)}
            subtitle={selectedLead ? selectedLead.project : undefined}
            onOpenSyncMonitor={() => setShowSyncMonitor(true)}
            syncStatus={syncStatus}
            agent={agent}
            onSwitchDeck={(deck) => {
              setSelectedLead(null);
              setCurrentTab(deck);
            }}
          />

          {/* Pending Report Banner in Room Database (Prevents overlapping calls) */}
          {pendingReport && (
            <div
              id="pending-report-banner"
              className="bg-[#1C180E] text-[#DFCCA0] px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xs shrink-0 border-b border-[#D4AF37]/40 animate-in fade-in"
            >
              <div className="flex items-center gap-2 truncate">
                <AlertTriangle className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="truncate text-white">
                  Unsubmitted Call Report in Room (Duration: {pendingReport.duration_seconds}s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const found = leads.find((l) => l.id === pendingReport.lead_id) || leads[0];
                    setOutcomeDialogData({
                      lead: found,
                      durationSeconds: pendingReport.duration_seconds,
                      reportId: pendingReport.report_id,
                      initialNotes: '',
                    });
                  }}
                  className="bg-[#D4AF37] hover:bg-[#C49F27] text-neutral-950 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Resume Report
                </button>
                <button
                  onClick={() => {
                    winstoneRoomDb.clearPendingReport();
                    showToast('Pending report buffer cleared from Room.');
                  }}
                  className="text-[#8E8E98] hover:text-white text-[11px] underline ml-1 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Main Body: Either Lead Details Screen or Tab Screens */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {selectedLead ? (
              <LeadDetailsScreen
                lead={selectedLead}
                onStartCall={handleStartCall}
                onOpenAddNote={() => setNoteModalLead(selectedLead)}
                onOpenSetFollowUp={() => setFollowUpModalLead(selectedLead)}
                onOpenScheduleSiteVisit={() => setSiteVisitModalLead(selectedLead)}
                onBack={() => setSelectedLead(null)}
                onUpdateClassification={handleUpdateLeadClassification}
              />
            ) : (
              <>
                {currentTab === 'dashboard' && performance && (
                  <DashboardScreen
                    agent={agent}
                    leads={leads}
                    followUps={followUps}
                    todayMetrics={performance.today}
                    onSelectLead={handleSelectLead}
                    onStartCall={handleStartCall}
                    onNavigateTab={(tab) => setCurrentTab(tab)}
                  />
                )}

                {currentTab === 'leads' && (
                  <LeadsScreen
                    leads={leads}
                    onSelectLead={handleSelectLead}
                    onStartCall={handleStartCall}
                    onOpenAddNewLead={() => setShowAddNewLeadModal(true)}
                  />
                )}

                {currentTab === 'followups' && (
                  <FollowUpsScreen
                    followUps={followUps}
                    leads={leads}
                    onCompleteFollowUp={handleCompleteFollowUp}
                    onBatchCompleteFollowUps={handleBatchCompleteFollowUps}
                    onRescheduleFollowUp={handleRescheduleFollowUp}
                    onOpenLead={handleSelectLead}
                    onStartCall={handleStartCall}
                  />
                )}

                {currentTab === 'performance' && performance && (
                  <PerformanceScreen performance={performance} />
                )}

                {currentTab === 'profile' && (
                  <ProfileScreen
                    agent={agent}
                    onLogout={handleLogout}
                    onOpenKotlinViewer={() => setShowKotlinViewer(true)}
                    onNavigateTab={(tab) => setCurrentTab(tab as any)}
                  />
                )}

                {currentTab === 'coordinator' && (
                  <CoordinatorDeckScreen
                    leads={leads}
                    onSelectLead={handleSelectLead}
                  />
                )}

                {currentTab === 'executive' && (
                  <ExecutiveHqScreen leads={leads} />
                )}

                {currentTab === 'it_console' && (
                  <ItConsoleScreen />
                )}
              </>
            )}
          </main>

          {/* Bottom Navigation Bar (Hidden during full detail view to focus agent actions) */}
          {!selectedLead && (
            <BottomNavBar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setSelectedLead(null);
                setCurrentTab(tab);
              }}
              pendingFollowUpsCount={pendingFollowUpsCount}
              newLeadsCount={newLeadsCount}
            />
          )}
        </div>
      )}

      {/* Call Outcome Logging Dialog */}
      {outcomeDialogData && (
        <CallOutcomeDialog
          lead={outcomeDialogData.lead}
          durationSeconds={outcomeDialogData.durationSeconds}
          initialNotes={outcomeDialogData.initialNotes}
          reportId={outcomeDialogData.reportId}
          onSave={handleSaveCallOutcome}
          onDiscard={() => {
            setOutcomeDialogData(null);
            showToast('Report preserved in Room buffer. You can resume it anytime.');
          }}
        />
      )}

      {/* Note Modal */}
      {noteModalLead && (
        <AddNoteModal
          lead={noteModalLead}
          onSave={handleSaveNote}
          onClose={() => setNoteModalLead(null)}
        />
      )}

      {/* Schedule Follow-up Modal */}
      {followUpModalLead && (
        <ScheduleFollowUpModal
          lead={followUpModalLead}
          onSave={handleSaveScheduleFollowUp}
          onClose={() => setFollowUpModalLead(null)}
        />
      )}

      {/* Schedule Site Visit Modal */}
      {siteVisitModalLead && (
        <ScheduleSiteVisitModal
          lead={siteVisitModalLead}
          onSave={handleSaveSiteVisit}
          onClose={() => setSiteVisitModalLead(null)}
        />
      )}

      {/* Add & Ingest New Lead Modal */}
      {showAddNewLeadModal && (
        <AddNewLeadModal
          onSave={handleSaveNewLead}
          onClose={() => setShowAddNewLeadModal(false)}
        />
      )}

      {/* Kotlin Code Viewer Modal */}
      {showKotlinViewer && (
        <KotlinCodeViewer onClose={() => setShowKotlinViewer(false)} />
      )}

      {/* Real-Time Sync & Telemetry Monitor */}
      {showSyncMonitor && (
        <SyncMonitorDrawer
          onClose={() => setShowSyncMonitor(false)}
          syncStatus={syncStatus}
          syncQueue={syncQueue}
          onTriggerManualSync={handleTriggerManualSync}
          onToggleOnlineState={handleToggleOnline}
          onToggleMockMode={handleToggleMockMode}
          leadsCount={leads.length}
          totalCalls={performance?.today.callsMade || 0}
          talkTimeMinutes={performance?.today.talkTimeMinutes || 0}
          onSimulateIncomingLead={handleSimulateIncomingLead}
        />
      )}
    </AndroidDeviceFrame>
  );
}
