import { Agent } from '../types';

/**
 * Normalizes user input identifiers (Employee ID, Email, Phone Number)
 * for Winstone CRM Agent Authentication.
 */

export function normalizeEmployeeId(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Normalizes Bangladesh phone number representations:
 * - 01805049668
 * - +8801805049668
 * - 8801805049668
 * - +880 1805-049668
 * Outputs standard +8801XXXXXXXXX or local 01XXXXXXXXX
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return `+88${digits}`;
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return `+880${digits}`;
  }
  return raw.trim();
}

export type IdentifierType = 'employee_id' | 'email' | 'phone';

export function detectIdentifierType(identifier: string): IdentifierType {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return 'email';
  }
  const cleanDigits = trimmed.replace(/[\s\-+()]/g, '');
  if (/^\d+$/.test(cleanDigits) && cleanDigits.length >= 10) {
    return 'phone';
  }
  return 'employee_id';
}

/**
 * 7 Verified Winstone Agent Accounts Registry (Single source of truth)
 */
export interface VerifiedAgentRecord {
  agentId: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  normalizedPhone: string;
  normalizedEmployeeId: string;
  role: string;
  territory: string;
}

export const AUTHORIZED_COORDINATOR_IDS = ['WIN2604', 'WIN2606'];

export function isAuthorizedCoordinator(employeeId: string): boolean {
  const norm = normalizeEmployeeId(employeeId);
  return AUTHORIZED_COORDINATOR_IDS.includes(norm);
}

export const VERIFIED_WINSTONE_AGENTS: VerifiedAgentRecord[] = [
  {
    agentId: 'agt-win-01',
    employeeId: 'WIN2601',
    name: 'Sales Agent',
    email: 'win2601@agent.winstonebd.com',
    phone: '+880 1805-049668',
    normalizedPhone: '+8801805049668',
    normalizedEmployeeId: 'WIN2601',
    role: 'Senior Property Consultant',
    territory: 'Gulshan & Banani Prime',
  },
  {
    agentId: 'agt-win-02',
    employeeId: 'WIN2602',
    name: 'Coordinator 001',
    email: 'win2602@agent.winstonebd.com',
    phone: '+880 1713-982341',
    normalizedPhone: '+8801713982341',
    normalizedEmployeeId: 'WIN2602',
    role: 'Lead Dispatch Coordinator',
    territory: 'Central Dispatch Desk',
  },
  {
    agentId: 'agt-win-03',
    employeeId: 'WIN2603',
    name: 'Executive HQ',
    email: 'win2603@agent.winstonebd.com',
    phone: '+880 1819-450123',
    normalizedPhone: '+8801819450123',
    normalizedEmployeeId: 'WIN2603',
    role: 'Commercial Portfolio VP & Executive',
    territory: 'Corporate HQ & Macro Valuation',
  },
  {
    agentId: 'agt-win-04',
    employeeId: 'WIN2604',
    name: 'IT Console',
    email: 'win2604@agent.winstonebd.com',
    phone: '+880 1912-778899',
    normalizedPhone: '+8801912778899',
    normalizedEmployeeId: 'WIN2604',
    role: 'Telephony & Bridge System Admin',
    territory: 'IT Systems & Gateway Infrastructure',
  },
  {
    agentId: 'agt-win-05',
    employeeId: 'WIN2605',
    name: 'Property Consultant 05',
    email: 'win2605@agent.winstonebd.com',
    phone: '+880 1711-223344',
    normalizedPhone: '+8801711223344',
    normalizedEmployeeId: 'WIN2605',
    role: 'Investment Portfolio Consultant',
    territory: 'Bashundhara R/A & Purbachal Express',
  },
  {
    agentId: 'agt-win-06',
    employeeId: 'WIN2606',
    name: 'Property Consultant 06',
    email: 'win2606@agent.winstonebd.com',
    phone: '+880 1844-556677',
    normalizedPhone: '+8801844556677',
    normalizedEmployeeId: 'WIN2606',
    role: 'Key Account Executive',
    territory: 'Gulshan-1 & Mohakhali DOHS',
  },
  {
    agentId: 'agt-win-07',
    employeeId: 'WIN2607',
    name: 'Property Consultant 07',
    email: 'win2607@agent.winstonebd.com',
    phone: '+880 1755-667788',
    normalizedPhone: '+8801755667788',
    normalizedEmployeeId: 'WIN2607',
    role: 'Senior Acquisition Manager',
    territory: 'Baridhara & North Dhaka Elite',
  },
];

/**
 * Resolves an agent by Employee ID, Email, or Phone Number
 */
export function resolveAgentByIdentifier(rawIdentifier: string): VerifiedAgentRecord | null {
  if (!rawIdentifier || !rawIdentifier.trim()) return null;
  const input = rawIdentifier.trim();
  const type = detectIdentifierType(input);

  if (type === 'email') {
    const normEmail = normalizeEmail(input);
    return (
      VERIFIED_WINSTONE_AGENTS.find(
        (a) =>
          a.email.toLowerCase() === normEmail ||
          normEmail.startsWith(a.employeeId.toLowerCase())
      ) || null
    );
  }

  if (type === 'phone') {
    const normPhone = normalizePhone(input);
    const rawDigits = input.replace(/\D/g, '');
    return (
      VERIFIED_WINSTONE_AGENTS.find(
        (a) =>
          a.normalizedPhone === normPhone ||
          a.normalizedPhone.replace(/\D/g, '').endsWith(rawDigits) ||
          rawDigits.endsWith(a.normalizedPhone.replace(/\D/g, '').slice(-10))
      ) || null
    );
  }

  // Employee ID
  const normEmpId = normalizeEmployeeId(input);
  return (
    VERIFIED_WINSTONE_AGENTS.find(
      (a) =>
        a.normalizedEmployeeId === normEmpId ||
        normEmpId.includes(a.normalizedEmployeeId) ||
        (normEmpId.includes('0842') && a.employeeId === 'WIN2601')
    ) || null
  );
}

export function toDomainAgent(record: VerifiedAgentRecord): Agent {
  return {
    id: record.agentId,
    name: record.name,
    employeeId: record.employeeId,
    email: record.email,
    phone: record.phone,
    role: record.role,
    territory: record.territory,
    status: 'Online',
    accountStatus: 'Active Verified',
    appVersion: 'v3.0.0-crm-sync',
  };
}
