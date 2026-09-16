import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  CalendarPlus,
  FileText,
  MapPin,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  Tag,
  Share2,
  Calendar,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Lead, CallRecord, LeadActivity, LeadTemperature, OperationalCategory, RemoteWhatsAppDto } from '../types';
import { TemperatureBadge, CategoryBadge, StatusBadge } from './Badges';
import { winstoneRoomDb } from '../data/roomDatabase';
import { crmDataSource } from '../api/crmDataSource';

interface LeadDetailsScreenProps {
  lead: Lead;
  onStartCall: (lead: Lead) => void;
  onOpenAddNote: () => void;
  onOpenSetFollowUp: () => void;
  onOpenScheduleSiteVisit: () => void;
  onBack: () => void;
  onUpdateClassification?: (temp: LeadTemperature, cat: OperationalCategory) => void;
}

export const LeadDetailsScreen: React.FC<LeadDetailsScreenProps> = ({
  lead,
  onStartCall,
  onOpenAddNote,
  onOpenSetFollowUp,
  onOpenScheduleSiteVisit,
  onBack,
  onUpdateClassification,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'notes' | 'calls' | 'timeline' | 'whatsapp'>('overview');
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [selectedTemp, setSelectedTemp] = useState<LeadTemperature>(lead.temperature);
  const [selectedCat, setSelectedCat] = useState<OperationalCategory>(lead.operationalCategory);

  // WhatsApp Messages state
  const [whatsAppList, setWhatsAppList] = useState<RemoteWhatsAppDto[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  useEffect(() => {
    setWhatsAppList(winstoneRoomDb.getWhatsAppMessages(lead.id));
    const unsub = winstoneRoomDb.observeWhatsAppMessages((all) => {
      setWhatsAppList(all.filter((m) => m.lead_id === lead.id));
    });
    return () => unsub();
  }, [lead.id]);

  const handleSendWhatsApp = async () => {
    if (!newMsgText.trim() || isSendingMsg) return;
    setIsSendingMsg(true);
    const newMsg: RemoteWhatsAppDto = {
      id: `wa-${Date.now()}`,
      lead_id: lead.id,
      phone: lead.phone,
      direction: 'outbound',
      message: newMsgText.trim(),
      sent_at: new Date().toISOString(),
      status: 'sent',
    };

    // 1. Save to Room database immediately
    winstoneRoomDb.insertWhatsAppMessages([newMsg]);
    setNewMsgText('');

    // 2. Sync to verified CRM endpoint POST /api/public/agent/whatsapp
    const syncPayload = {
      lead_id: lead.id,
      messages: [
        {
          client_message_id: newMsg.id,
          sender: 'agent' as const,
          message_type: 'text' as const,
          text: newMsg.message || '',
        },
      ],
    };

    try {
      if (crmDataSource.isConfigured() && navigator.onLine) {
        await crmDataSource.syncWhatsApp(syncPayload);
      } else {
        winstoneRoomDb.enqueue({
          operationType: 'WHATSAPP_SYNC',
          entityType: 'lead',
          entityId: lead.id,
          payload: syncPayload,
        });
      }
    } catch (err) {
      console.warn('[WhatsApp] Synced to local Room database, queued remote delivery:', err);
      winstoneRoomDb.enqueue({
        operationType: 'WHATSAPP_SYNC',
        entityType: 'lead',
        entityId: lead.id,
        payload: syncPayload,
      });
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleSaveClassification = () => {
    if (onUpdateClassification) {
      onUpdateClassification(selectedTemp, selectedCat);
    }
    setIsEditingClass(false);
  };

  return (
    <div id="lead-details-screen" className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {/* Customer Header Card */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200/90 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-neutral-900 truncate">
                  {lead.customerName}
                </h2>
                <StatusBadge status={lead.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono mt-1">
                <span className="flex items-center gap-1 text-neutral-700">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  {lead.phone}
                </span>
                {lead.email && (
                  <span className="hidden sm:flex items-center gap-1 text-neutral-500 truncate">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    {lead.email}
                  </span>
                )}
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 border border-emerald-200">
              {lead.customerName.charAt(0)}
            </div>
          </div>

          {/* Project Focus Banner */}
          <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Target Real Estate Project
              </span>
              <span className="text-xs font-bold text-emerald-900 truncate block">
                {lead.project}
              </span>
            </div>
            <span className="text-xs bg-white text-neutral-700 px-2 py-1 rounded border border-neutral-200 font-medium">
              Dhaka
            </span>
          </div>

          {/* Temperature & Category Breakdown */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-neutral-600">Lead Classification</span>
              {onUpdateClassification && (
                <button
                  onClick={() => setIsEditingClass(!isEditingClass)}
                  className="text-[11px] font-semibold text-[#0D6E44] hover:underline cursor-pointer"
                >
                  {isEditingClass ? 'Cancel' : 'Change'}
                </button>
              )}
            </div>

            {isEditingClass ? (
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 font-medium block mb-1">Temperature</label>
                    <select
                      value={selectedTemp}
                      onChange={(e) => setSelectedTemp(e.target.value as LeadTemperature)}
                      className="w-full text-xs p-1.5 bg-white border border-neutral-300 rounded font-semibold text-neutral-800"
                    >
                      <option value="Hot">🔥 Hot</option>
                      <option value="Warm">⚡ Warm</option>
                      <option value="Cold">❄️ Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 font-medium block mb-1">Operational Category</label>
                    <select
                      value={selectedCat}
                      onChange={(e) => setSelectedCat(e.target.value as OperationalCategory)}
                      className="w-full text-xs p-1.5 bg-white border border-neutral-300 rounded font-semibold text-neutral-800"
                    >
                      <option value="A">Cat A (Ready)</option>
                      <option value="B">Cat B (Evaluating)</option>
                      <option value="C">Cat C (Nurture)</option>
                      <option value="D">Cat D (Unqualified)</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSaveClassification}
                  className="w-full bg-[#0D6E44] hover:bg-[#0A5735] text-white py-1.5 rounded text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Update Classification
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-50/80 p-2 rounded-lg border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 block mb-1">Lead Temperature</span>
                  <TemperatureBadge temperature={lead.temperature} />
                </div>
                <div className="bg-neutral-50/80 p-2 rounded-lg border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 block mb-1">Operational Category</span>
                  <CategoryBadge category={lead.operationalCategory} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-white rounded-t-lg px-2 pt-2 gap-1 text-xs font-semibold overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'notes', label: `Notes (${lead.notes.length})` },
              { id: 'calls', label: `Calls (${lead.callHistory.length})` },
              { id: 'timeline', label: 'Timeline' },
              { id: 'whatsapp', label: `WhatsApp (${whatsAppList.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'border-[#0D6E44] text-[#0D6E44]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-tab 1: Overview */}
        {activeSubTab === 'overview' && (
          <div className="space-y-3">
            {/* Metadata Grid */}
            <div className="bg-white rounded-b-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">
                Prospect Attributes
              </h3>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-neutral-400 text-[11px] block">Lead Source</span>
                  <span className="font-semibold text-neutral-800">{lead.source}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Campaign</span>
                  <span className="font-semibold text-neutral-800 truncate block">
                    {lead.campaignName || 'Direct Ingestion'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Assigned Agent</span>
                  <span className="font-semibold text-neutral-800">{lead.assignedAgent}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Ingested Date</span>
                  <span className="font-semibold text-neutral-800">{lead.createdDate}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Last Contact</span>
                  <span className="font-semibold text-neutral-800">{lead.lastContact}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Next Follow-up</span>
                  <span className="font-semibold text-emerald-800">
                    {lead.nextFollowUp || 'Not scheduled'}
                  </span>
                </div>
              </div>

              {/* Attribution Details (Meta / Website) */}
              <div className="pt-3 border-t border-neutral-100">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                  CRM Marketing Attribution (Phase 2 Ready)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/70">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Campaign ID</span>
                    <span className="font-mono text-neutral-700 font-medium">
                      {lead.campaignId || 'cmp-unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Medium / Channel</span>
                    <span className="text-neutral-700 font-medium">{lead.medium || 'organic'}</span>
                  </div>
                  {lead.adSetName && (
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Ad Set</span>
                      <span className="text-neutral-700 font-medium truncate block">
                        {lead.adSetName}
                      </span>
                    </div>
                  )}
                  {lead.adName && (
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Ad Creative</span>
                      <span className="text-neutral-700 font-medium truncate block">{lead.adName}</span>
                    </div>
                  )}
                  {lead.landingPage && (
                    <div className="col-span-2">
                      <span className="text-neutral-400 block text-[10px]">Landing Page</span>
                      <span className="text-neutral-700 font-mono text-[10px] truncate block">
                        {lead.landingPage}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Architecture Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong className="block font-semibold">Phase 1 Architecture Note:</strong>
                Lead details and interaction logs are managed via the local repository. Calling engine executes in explicit simulation mode.
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 2: Notes */}
        {activeSubTab === 'notes' && (
          <div className="bg-white rounded-b-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">
                Agent Logged Notes
              </h3>
              <button
                onClick={onOpenAddNote}
                className="text-xs text-[#0D6E44] font-bold flex items-center gap-1 hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Note
              </button>
            </div>

            {lead.notes.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No notes added yet.</p>
            ) : (
              <div className="space-y-2">
                {lead.notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed"
                  >
                    <p>{note}</p>
                    <span className="text-[10px] text-neutral-400 block mt-1.5 font-mono">
                      Logged by {lead.assignedAgent}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 3: Call History */}
        {activeSubTab === 'calls' && (
          <div className="bg-white rounded-b-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3">
            <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">
              Telephony Call Records
            </h3>

            {lead.callHistory.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 text-xs">
                <PhoneCall className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                No calls logged yet. Tap <strong>Call</strong> below to launch the calling engine.
              </div>
            ) : (
              <div className="space-y-2.5">
                {lead.callHistory.map((call) => (
                  <div
                    key={call.id}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">{call.outcome}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <TemperatureBadge temperature={call.temperatureAssigned} size="sm" />
                      <CategoryBadge category={call.categoryAssigned} size="sm" />
                      <span className="text-[10px] text-neutral-400">{call.timestamp}</span>
                    </div>

                    {call.notes && (
                      <p className="text-[11px] text-neutral-600 bg-white p-2 rounded border border-neutral-100">
                        {call.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 4: Activity Timeline */}
        {activeSubTab === 'timeline' && (
          <div className="bg-white rounded-b-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3">
            <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">
              Audit & Activity Stream
            </h3>

            {lead.activityTimeline.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No timeline events recorded.</p>
            ) : (
              <div className="relative pl-5 space-y-4 border-l-2 border-neutral-200 ml-1 mt-2">
                {lead.activityTimeline.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full bg-[#0D6E44] ring-4 ring-white" />
                    <div className="text-xs font-bold text-neutral-900">{act.title}</div>
                    <div className="text-[11px] text-neutral-600 mt-0.5">{act.description}</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                      {act.timestamp} • {act.agentName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 5: WhatsApp CRM Messages */}
        {activeSubTab === 'whatsapp' && (
          <div className="bg-white rounded-b-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-800">
                  CRM Synchronized WhatsApp Channel
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                POST /api/public/agent/whatsapp
              </span>
            </div>

            {whatsAppList.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-neutral-300" />
                No WhatsApp conversations logged yet for this lead.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {whatsAppList.map((msg) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isOutbound
                            ? 'bg-[#0D6E44] text-white rounded-br-2xs'
                            : 'bg-neutral-100 text-neutral-800 border border-neutral-200/70 rounded-bl-2xs'
                        }`}
                      >
                        <p>{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono mt-0.5 px-1">
                        <span>
                          {new Date(msg.sent_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOutbound && (
                          <span className="text-emerald-700 font-medium capitalize">
                            • {msg.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick WhatsApp Composer */}
            <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type WhatsApp message to client..."
                value={newMsgText}
                onChange={(e) => setNewMsgText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                className="flex-1 text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#0D6E44] text-neutral-900 placeholder:text-neutral-400"
              />
              <button
                id="btn-send-whatsapp"
                onClick={handleSendWhatsApp}
                disabled={!newMsgText.trim() || isSendingMsg}
                className="bg-[#0D6E44] hover:bg-[#0A5735] disabled:opacity-50 text-white p-2 rounded-lg cursor-pointer transition-colors shrink-0"
                title="Send and Sync"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Primary Actions Bar */}
      <div className="bg-white border-t border-neutral-200/90 p-3 shadow-lg flex items-center gap-2 shrink-0 z-20">
        <button
          id="btn-lead-call"
          onClick={() => onStartCall(lead)}
          className="flex-1 bg-[#0D6E44] hover:bg-[#0A5735] active:scale-95 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Client</span>
        </button>

        <button
          id="btn-lead-add-note"
          onClick={onOpenAddNote}
          className="p-2.5 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 rounded-xl transition-colors"
          title="Add Note"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          id="btn-lead-set-followup"
          onClick={onOpenSetFollowUp}
          className="p-2.5 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 rounded-xl transition-colors"
          title="Set Follow-up"
        >
          <Clock className="w-4 h-4" />
        </button>

        <button
          id="btn-lead-schedule-visit"
          onClick={onOpenScheduleSiteVisit}
          className="p-2.5 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 rounded-xl transition-colors"
          title="Schedule Site Visit"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
