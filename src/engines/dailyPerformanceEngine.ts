import { VERIFIED_WINSTONE_AGENTS } from '../config/agentRegistry';

export interface AgentDailyActivity {
  agentName: string;
  employeeId: string;
  callsMade: number;
  connected: number;
  interested: number;
  followUpsDue: number;
  reportsSubmitted: number;
  talkTimeMinutes: number;
  syncState: 'online' | 'synced' | 'offline';
  summary?: string;
  rank?: number;
}

/**
 * Returns formatted Dhaka date string (Asia/Dhaka)
 */
export function getDhakaFormattedDate(): { dateStr: string; timeStr: string } {
  try {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(now);

    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(now);

    return { dateStr, timeStr };
  } catch {
    const now = new Date();
    return {
      dateStr: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      timeStr: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

/**
 * Generates an objective, purely factual performance summary.
 * Strictly no subjective words (no "amazing", "poor", "champion", etc.)
 * Contract example: "আজ 42টি কলের মধ্যে 18টি সংযুক্ত হয়েছে এবং 6টি লিড আগ্রহ দেখিয়েছে।"
 */
export function generateFactualPerformanceSummary(activity: {
  callsMade: number;
  connected: number;
  interested: number;
}): string {
  if (activity.callsMade === 0) {
    return 'আজকের পারফরম্যান্স ডেটা এখনও পাওয়া যায়নি';
  }
  return `আজ ${activity.callsMade}টি কলের মধ্যে ${activity.connected}টি সংযুক্ত হয়েছে এবং ${activity.interested}টি লিড আগ্রহ দেখিয়েছে।`;
}

/**
 * Calculates internal ranking score according to Master Production Contract (Section 10):
 * - 25% Calls Made
 * - 25% Connected Calls
 * - 20% Interested Leads
 * - 15% Follow-up completion
 * - 10% Reports Submitted
 * - 5% Talk Time
 * 
 * Note: Score is strictly internal and never shown in the UI.
 */
export function calculateInternalScore(a: AgentDailyActivity): number {
  const callsWeight = a.callsMade * 0.25;
  const connWeight = a.connected * 0.25;
  const interestedWeight = a.interested * 0.20;
  const followUpWeight = Math.max(0, 10 - a.followUpsDue) * 0.15;
  const reportsWeight = a.reportsSubmitted * 0.10;
  const talkTimeWeight = (a.talkTimeMinutes / 10) * 0.05;

  return callsWeight + connWeight + interestedWeight + followUpWeight + reportsWeight + talkTimeWeight;
}

/**
 * Deterministic rank sorting according to Section 10 tie-breakers:
 * 1. Score / Connected Calls
 * 2. Interested Leads
 * 3. Follow-up completion (fewer due = higher)
 * 4. Calls Made
 * 5. Reports Submitted
 * 6. Talk Time
 * 7. Employee ID ascending
 */
export function sortAgentsDeterministically(agents: AgentDailyActivity[]): AgentDailyActivity[] {
  return [...agents].sort((a, b) => {
    const scoreA = calculateInternalScore(a);
    const scoreB = calculateInternalScore(b);
    if (Math.abs(scoreB - scoreA) > 0.001) return scoreB - scoreA;

    if (b.connected !== a.connected) return b.connected - a.connected;
    if (b.interested !== a.interested) return b.interested - a.interested;
    if (a.followUpsDue !== b.followUpsDue) return a.followUpsDue - b.followUpsDue;
    if (b.callsMade !== a.callsMade) return b.callsMade - a.callsMade;
    if (b.reportsSubmitted !== a.reportsSubmitted) return b.reportsSubmitted - a.reportsSubmitted;
    if (b.talkTimeMinutes !== a.talkTimeMinutes) return b.talkTimeMinutes - a.talkTimeMinutes;
    return a.employeeId.localeCompare(b.employeeId);
  });
}

/**
 * Returns the Top 3 Daily Performers (Maximum 3 real verified agents).
 * If today's activity is empty or only 1-2 have activity, shows only valid ones.
 * Never manufactures a 3rd fake performer.
 */
export function getDailyTopPerformers(activities: AgentDailyActivity[]): AgentDailyActivity[] {
  const activeAgents = activities.filter((a) => a.callsMade > 0 || a.connected > 0);
  if (activeAgents.length === 0) {
    return [];
  }

  const sorted = sortAgentsDeterministically(activeAgents);
  const topSlice = sorted.slice(0, 3);

  return topSlice.map((agent, index) => ({
    ...agent,
    rank: index + 1,
    summary: generateFactualPerformanceSummary(agent),
  }));
}

/**
 * Formats talk time in minutes to readable hours and minutes
 */
export function formatTalkTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} মিনিট`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} ঘণ্টা ${mins} মিনিট` : `${hrs} ঘণ্টা`;
}
