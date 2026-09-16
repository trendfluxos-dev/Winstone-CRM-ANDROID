import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  FileText,
  MapPin,
  Clock,
  Mail,
  Phone,
  PlusCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Lead, LeadTemperature, OperationalCategory, RemoteWhatsAppDto } from '../types';
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
      console.warn('[LeadDetails] WhatsApp remote sync queued:', err);
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
    <div id="lead-details-screen" className="flex-1 flex flex-col bg-[#F8F9FA] text-[#0F172A] overflow-hidden">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {/* Main Lead Profile Hero Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  {lead.customerName}
                </h2>
                <StatusBadge status={lead.status} />
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-[#64748B] flex-wrap">
                <span className="flex items-center gap-1 font-mono text-[#8C6B24] font-semibold">
                  <Phone className="w-3.5 h-3.5 text-[#B8934A]" />
                  {lead.phone}
                </span>
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                    {lead.email}
                  </span>
                )}
              </div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] text-[#8C6B24] font-bold flex items-center justify-center shrink-0 border border-[#E8DFCF] shadow-2xs">
              {lead.customerName.charAt(0)}
            </div>
          </div>

          {/* Project Focus Banner */}
          <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E8DFCF] flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-medium">
                Target Real Estate Project
              </span>
              <span className="text-xs font-bold text-[#8C6B24] truncate block">
                {lead.project}
              </span>
            </div>
            <span className="text-xs bg-white text-[#334155] px-2.5 py-1 rounded-lg border border-[#E2E8F0] font-medium shadow-2xs">
              Dhaka
            </span>
          </div>

          {/* Temperature & Category Breakdown */}
          <div className="pt-2 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#8C6B24]">Lead Classification</span>
              {onUpdateClassification && (
                <button
                  onClick={() => setIsEditingClass(!isEditingClass)}
                  className="text-[11px] font-semibold text-[#B8934A] hover:underline cursor-pointer"
                >
                  {isEditingClass ? 'Cancel' : 'Change'}
                </button>
              )}
            </div>

            {isEditingClass ? (
              <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E8DFCF] space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#64748B] font-medium block mb-1">Temperature</label>
                    <select
                      value={selectedTemp}
                      onChange={(e) => setSelectedTemp(e.target.value as LeadTemperature)}
                      className="w-full text-xs p-2 bg-white border border-[#CBD5E1] rounded-lg font-semibold text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
                    >
                      <option value="Hot">🔥 Hot</option>
                      <option value="Warm">⚡ Warm</option>
                      <option value="Cold">❄️ Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#64748B] font-medium block mb-1">Operational Category</label>
                    <select
                      value={selectedCat}
                      onChange={(e) => setSelectedCat(e.target.value as OperationalCategory)}
                      className="w-full text-xs p-2 bg-white border border-[#CBD5E1] rounded-lg font-semibold text-[#0F172A] focus:outline-none focus:border-[#B8934A]"
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
                  className="w-full bg-[#B8934A] hover:bg-[#A68035] text-white py-2 rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                >
                  Update Classification
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E8DFCF]">
                  <span className="text-[10px] text-[#64748B] block mb-1 font-medium">Lead Temperature</span>
                  <TemperatureBadge temperature={lead.temperature} />
                </div>
                <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E8DFCF]">
                  <span className="text-[10px] text-[#64748B] block mb-1 font-medium">Operational Category</span>
                  <CategoryBadge category={lead.operationalCategory} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-[#E5E7EB] bg-white rounded-t-xl px-2 pt-2 gap-1 text-xs font-semibold overflow-x-auto no-scrollbar shadow-2xs">
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
              className={`pb-2.5 px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'border-[#B8934A] text-[#8C6B24] font-bold'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
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
            <div className="bg-white rounded-b-xl p-4 border border-[#E5E7EB] shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-[#8C6B24] text-xs uppercase tracking-wider">
                Prospect Attributes
              </h3>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium">Lead Source</span>
                  <span className="font-semibold text-[#0F172A]">{lead.source}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium">Campaign</span>
                  <span className="font-semibold text-[#0F172A] truncate block">
                    {lead.campaignName || 'Direct Ingestion'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium">Assigned Agent</span>
                  <span className="font-semibold text-[#0F172A]">{lead.assignedAgent}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium">Ingested Date</span>
                  <span className="font-semibold text-[#0F172A]">{lead.createdDate}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium">Last Contact</span>
                  <span className="font-semibold text-[#0F172A]">{lead.lastContact}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium">Next Follow-up</span>
                  <span className="font-semibold text-[#8C6B24]">
                    {lead.nextFollowUp || 'Not scheduled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 2: Notes */}
        {activeSubTab === 'notes' && (
          <div className="bg-white rounded-b-xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <span className="text-xs font-bold text-[#0F172A]">
                Consultation Notes ({lead.notes.length})
              </span>
              <button
                onClick={onOpenAddNote}
                className="text-xs text-[#8C6B24] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#B8934A]" /> Add Note
              </button>
            </div>

            {lead.notes.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748B]">
                No notes logged for this prospect.
              </div>
            ) : (
              <div className="space-y-2">
                {lead.notes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#334155]">
                    {note}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 3: Calls */}
        {activeSubTab === 'calls' && (
          <div className="bg-white rounded-b-xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <span className="text-xs font-bold text-[#0F172A]">
                Telephony History ({lead.callHistory.length})
              </span>
            </div>

            {lead.callHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748B]">
                No call logs available for this prospect.
              </div>
            ) : (
              <div className="space-y-2">
                {lead.callHistory.map((call) => (
                  <div key={call.id} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#8C6B24]">{call.outcome}</span>
                      <span className="text-[10px] text-[#64748B] font-mono">{call.duration}</span>
                    </div>
                    <p className="text-[#475569] text-[11px]">{call.notes}</p>
                    <span className="text-[10px] text-[#94A3B8] block">{call.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 4: Timeline */}
        {activeSubTab === 'timeline' && (
          <div className="bg-white rounded-b-xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
            <span className="text-xs font-bold text-[#0F172A] block border-b border-[#F1F5F9] pb-2">
              Activity History & Milestones
            </span>
            {lead.activityTimeline.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748B]">
                No recorded timeline activities.
              </div>
            ) : (
              <div className="space-y-2">
                {lead.activityTimeline.map((act) => (
                  <div key={act.id} className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs">
                    <div className="font-bold text-[#8C6B24]">{act.title}</div>
                    <div className="text-[11px] text-[#475569] mt-0.5">{act.description}</div>
                    <div className="text-[10px] text-[#94A3B8] mt-1 font-mono">
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
          <div className="bg-white rounded-b-xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs font-bold text-[#0F172A]">
                  CRM Synchronized WhatsApp Channel
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8C6B24] bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#E8DFCF] font-bold">
                WhatsApp Live
              </span>
            </div>

            {whatsAppList.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[#CBD5E1]" />
                No WhatsApp conversations logged yet for this lead.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
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
                            ? 'bg-[#FAF6EE] text-[#0F172A] border border-[#E8DFCF] font-medium rounded-br-2xs shadow-2xs'
                            : 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] rounded-bl-2xs'
                        }`}
                      >
                        <p>{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] font-mono mt-0.5 px-1">
                        <span>
                          {new Date(msg.sent_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOutbound && (
                          <span className="text-[#8C6B24] font-medium capitalize">
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
            <div className="pt-2 border-t border-[#F1F5F9] flex items-center gap-2">
              <input
                type="text"
                placeholder="Type WhatsApp message to client..."
                value={newMsgText}
                onChange={(e) => setNewMsgText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                className="flex-1 text-xs px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#B8934A] text-[#0F172A] placeholder:text-[#94A3B8]"
              />
              <button
                id="btn-send-whatsapp"
                onClick={handleSendWhatsApp}
                disabled={!newMsgText.trim() || isSendingMsg}
                className="bg-[#B8934A] hover:bg-[#A68035] disabled:opacity-50 text-white p-2.5 rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs active:scale-95"
                title="Send and Sync"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Primary Actions Bar */}
      <div className="bg-white border-t border-[#E5E7EB] p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] flex items-center gap-2 shrink-0 z-20">
        <button
          id="btn-lead-call"
          onClick={() => onStartCall(lead)}
          className="flex-1 bg-[#B8934A] hover:bg-[#A68035] active:scale-95 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Client</span>
        </button>

        <button
          id="btn-lead-add-note"
          onClick={onOpenAddNote}
          className="p-2.5 bg-white hover:bg-[#FAF9F6] text-[#334155] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer shadow-2xs"
          title="Add Note"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          id="btn-lead-set-followup"
          onClick={onOpenSetFollowUp}
          className="p-2.5 bg-white hover:bg-[#FAF9F6] text-[#334155] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer shadow-2xs"
          title="Set Follow-up"
        >
          <Clock className="w-4 h-4" />
        </button>

        <button
          id="btn-lead-schedule-visit"
          onClick={onOpenScheduleSiteVisit}
          className="p-2.5 bg-white hover:bg-[#FAF9F6] text-[#334155] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer shadow-2xs"
          title="Schedule Site Visit"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
