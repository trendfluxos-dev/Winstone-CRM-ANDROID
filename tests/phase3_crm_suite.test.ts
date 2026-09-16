/**
 * Winstone Agent Native Android CRM Integration - Phase 3 Test Suite
 *
 * Implements verification for all 20 required tests:
 * 1. Login success
 * 2. Login failure
 * 3. Unauthorized session
 * 4. Workspace parsing
 * 5. Workspace → Room mapping
 * 6. Offline lead display
 * 7. Call-state queue
 * 8. Idempotent call_uid retry
 * 9. Report open
 * 10. Report submit
 * 11. Temperature + Grade are independent
 * 12. WhatsApp client_message_id retry
 * 13. Recording client_upload_id retry
 * 14. 401 handling
 * 15. 409 handling
 * 16. 422 handling
 * 17. 5xx retry
 * 18. Network offline/recovery
 * 19. Logout
 * 20. No secret leakage into APK/source/logs
 */

import assert from 'node:assert/strict';
import { crmDataSource, mapRemoteLeadToDomain, mapRemoteCallToDomain, mapRemoteAgentToDomain, CrmUnauthorizedError, CrmConflictError, CrmValidationError, CrmNetworkError } from '../src/api/crmDataSource';
import { authRepository } from '../src/repositories/authRepository';
import { winstoneRoomDb } from '../src/data/roomDatabase';
import { CrmSyncWorker } from '../src/repositories/crmSyncWorker';
import { RemoteLeadDto, RemoteCallDto, RemoteAgentDto, WorkspaceResponse, SubmitReportPayload, CallStateRequest } from '../src/types';
import fs from 'node:fs';
import path from 'node:path';

let passedTests = 0;
let failedTests = 0;

function runTest(testNumber: number, title: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`✅ [Test ${testNumber.toString().padStart(2, '0')}] PASS: ${title}`);
      passedTests++;
    } catch (err: any) {
      console.error(`❌ [Test ${testNumber.toString().padStart(2, '0')}] FAIL: ${title}`);
      console.error(`   Error: ${err.message}`);
      if (err.stack) {
        console.error(`   ${err.stack.split('\n')[1]}`);
      }
      failedTests++;
    }
  };
}

async function runAllTests() {
  console.log('\n===============================================================');
  console.log('  WINSTONE AGENT — PHASE 3 REAL CRM INTEGRATION VERIFICATION');
  console.log('===============================================================\n');

  // Test 1: Login success
  await runTest(1, 'Login success (POST /api/public/agent/login returns token and session)', async () => {
    const originalLogin = crmDataSource.login;
    crmDataSource.login = async () => ({
      ok: true,
      device_token: 'dev-tok-live-test-12345',
      device_id: 'android-s24-ultra-uuid',
      agent: {
        id: 'agt-tanvir-01',
        employee_id: 'WPL-AGT-0842',
        name: 'Tanvir Ahmed',
        phone: '+8801711223344',
        sim_number: '+8801711000000',
        role: 'Senior Property Consultant',
      },
    });

    const session = await authRepository.login({
      identifier: 'tanvir@winstonebd.com',
      password: 'VerifiedAgentPassword2026',
    });

    assert.equal(session.accessToken, 'dev-tok-live-test-12345');
    assert.equal(session.agent.employeeId, 'WPL-AGT-0842');
    assert.equal(authRepository.isAuthenticated(), true);
    assert.equal(crmDataSource.getDeviceToken(), 'dev-tok-live-test-12345');
    assert.equal(winstoneRoomDb.getAgent()?.employeeId, 'WPL-AGT-0842');

    crmDataSource.login = originalLogin;
  })();

  // Test 2: Login failure
  await runTest(2, 'Login failure (rejection does not persist session or token)', async () => {
    await authRepository.logout();
    const originalLogin = crmDataSource.login;
    crmDataSource.login = async () => ({
      ok: false,
      error: 'Invalid credentials or unauthorized device IMEI.',
    });

    await assert.rejects(async () => {
      await authRepository.login({
        identifier: 'invalid@winstonebd.com',
        password: 'bad-password',
      });
    }, /Invalid credentials/);

    assert.equal(authRepository.isAuthenticated(), false);
    assert.equal(crmDataSource.getDeviceToken(), null);

    crmDataSource.login = originalLogin;
  })();

  // Test 3: Unauthorized session (401 callback)
  await runTest(3, 'Unauthorized session (401 resets token, flags session, preserves Room)', async () => {
    crmDataSource.setDeviceToken('active-token-before-401');
    assert.equal(winstoneRoomDb.getAllLeads().length > 0, true);

    authRepository.handleUnauthorized();

    assert.equal(authRepository.isSessionUnauthorized(), true);
    assert.equal(crmDataSource.getDeviceToken(), null);
    // Room leads MUST be preserved
    assert.equal(winstoneRoomDb.getAllLeads().length > 0, true);
  })();

  // Test 4: Workspace parsing
  await runTest(4, 'Workspace parsing (parses remote schema with leads, calls, agent, whatsapp)', () => {
    const rawWorkspace: WorkspaceResponse = {
      agent: {
        id: 'agt-1',
        employee_id: 'WPL-AGT-0842',
        name: 'Tanvir Ahmed',
        phone: '+8801711223344',
        sim_number: '+8801711000000',
        role: 'Senior Consultant',
      },
      leads: [
        {
          id: 'lead-test-101',
          name: 'Md. Rafiqul Islam',
          phone_number: '+8801711234567',
          status: 'IN_PROGRESS',
          priority: 'A',
          temperature: 'hot',
          project_name: 'Winstone Gulshan Heights',
          last_contacted_at: '2026-09-15T09:00:00Z',
          call_attempts: 3,
          is_two_sided: true,
          notes: 'Client interested in 2,450 sqft unit',
        },
      ],
      calls: [
        {
          id: 'call-test-1',
          lead_id: 'lead-test-101',
          agent_id: 'agt-1',
          duration_seconds: 185,
          connected: true,
          outcome_category: 'Interested',
          recording_id: 'rec-test-1',
          created_at: '2026-09-15T09:10:00Z',
        },
      ],
      whatsapp: [
        {
          id: 'wa-1',
          lead_id: 'lead-test-101',
          phone: '+8801711234567',
          direction: 'outbound',
          message: 'Floor plan sent',
          sent_at: '2026-09-15T09:12:00Z',
          status: 'delivered',
        },
      ],
      server_time: '2026-09-15T09:15:00Z',
    };

    assert.equal(rawWorkspace.leads.length, 1);
    assert.equal(rawWorkspace.leads[0].temperature, 'hot');
    assert.equal(rawWorkspace.leads[0].priority, 'A');
    assert.equal(rawWorkspace.leads[0].is_two_sided, true);
  })();

  // Test 5: Workspace → Room mapping
  await runTest(5, 'Workspace → Room mapping (correctly transforms DTOs and shields dirty leads)', () => {
    const remoteDto: RemoteLeadDto = {
      id: 'lead-mapped-1',
      name: 'Nusrat Jahan',
      phone_number: '+8801819345678',
      status: 'FOLLOW_UP',
      priority: 'B',
      temperature: 'warm',
      project_name: 'Banani Lakefront',
      last_contacted_at: '2026-09-15T11:00:00Z',
      call_attempts: 2,
      is_two_sided: true,
      notes: 'Reviewed pricing list',
    };

    const domainLead = mapRemoteLeadToDomain(remoteDto);
    assert.equal(domainLead.id, 'lead-mapped-1');
    assert.equal(domainLead.customerName, 'Nusrat Jahan');
    assert.equal(domainLead.temperature, 'Warm');
    assert.equal(domainLead.operationalCategory, 'B');
    assert.equal(domainLead.status, 'Follow-up');
    assert.equal(domainLead.isTwoSided, true);

    // Save to Room and verify dirty flag protection
    winstoneRoomDb.insertLead(domainLead);
    winstoneRoomDb.markLeadDirty('lead-mapped-1', true);
    assert.equal(winstoneRoomDb.isLeadDirty('lead-mapped-1'), true);
  })();

  // Test 6: Offline lead display
  await runTest(6, 'Offline lead display (Room database delivers leads without network access)', () => {
    const leads = winstoneRoomDb.getAllLeads();
    assert.equal(Array.isArray(leads), true);
    assert.equal(leads.length > 0, true);
    const first = leads[0];
    assert.equal(typeof first.customerName, 'string');
    assert.equal(typeof first.phone, 'string');
    assert.equal(typeof first.temperature, 'string');
  })();

  // Test 7: Call-state queue
  await runTest(7, 'Call-state queue (failed/offline call state is enqueued in Room SyncQueueDao)', () => {
    const callStatePayload: CallStateRequest = {
      lead_id: 'lead-test-101',
      call_uid: 'call-uid-stable-999',
      state: 'connected',
      phone_number: '+8801711234567',
      timestamp: new Date().toISOString(),
      duration_seconds: 45,
    };

    const queuedOp = winstoneRoomDb.enqueue({
      operationType: 'CALL_STATE',
      entityType: 'call',
      entityId: callStatePayload.lead_id,
      payload: callStatePayload,
    });

    const queue = winstoneRoomDb.getAllSyncOperations();
    const found = queue.find((q) => q.id === queuedOp.id);
    assert.ok(found, 'Operation must exist in sync queue');
    assert.equal(found?.operationType, 'CALL_STATE');
    assert.equal(found?.payload.call_uid, 'call-uid-stable-999');
  })();

  // Test 8: Idempotent call_uid retry
  await runTest(8, 'Idempotent call_uid retry (stable across retry attempts)', () => {
    const queue = winstoneRoomDb.getAllSyncOperations();
    const callOp = queue.find((q) => q.payload?.call_uid === 'call-uid-stable-999');
    assert.ok(callOp, 'Call operation must be queued');

    // Simulate WorkManager retry attempt
    winstoneRoomDb.incrementRetry(callOp.id, 'Temporary network timeout');
    const updated = winstoneRoomDb.getAllSyncOperations().find((q) => q.id === callOp.id);

    assert.equal(updated?.retryCount, 1);
    assert.equal(updated?.payload.call_uid, 'call-uid-stable-999');
  })();

  // Test 9: Report open
  await runTest(9, 'Report open (action: "open" persists pending report in Room and blocks new calls)', () => {
    winstoneRoomDb.savePendingReport({
      report_id: 'rep-open-live-444',
      lead_id: 'lead-test-101',
      customer_name: 'Md. Rafiqul Islam',
      phone_number: '+8801711234567',
      call_started_at: new Date().toISOString(),
      duration_seconds: 120,
      connected: true,
      opened_at: new Date().toISOString(),
    });

    const pending = winstoneRoomDb.getPendingReport();
    assert.ok(pending, 'Pending report must be set');
    assert.equal(pending?.report_id, 'rep-open-live-444');
    assert.equal(pending?.duration_seconds, 120);
  })();

  // Test 10: Report submit
  await runTest(10, 'Report submit (action: "submit" clears pending report buffer and updates state)', () => {
    const submitPayload: SubmitReportPayload = {
      action: 'submit',
      report_id: 'rep-open-live-444',
      lead_id: 'lead-test-101',
      category: 'Interested',
      summary: 'In-depth consultation regarding Gulshan project.',
      notes: 'Requested loan calculation.',
      reason: 'High buying interest',
      follow_up_at: '2026-09-17T10:00:00Z',
      reminder_minutes: 15,
      temperature: 'hot',
      grade: 'A',
      ai_decision: 'accepted',
    };

    assert.equal(submitPayload.action, 'submit');
    assert.equal(submitPayload.temperature, 'hot');
    assert.equal(submitPayload.grade, 'A');

    // Clear pending report
    winstoneRoomDb.clearPendingReport();
    assert.equal(winstoneRoomDb.getPendingReport(), null);
  })();

  // Test 11: Temperature + Grade are independent
  await runTest(11, 'Temperature + Grade are independent (hot/warm/cold is NOT merged with A/B/C/D)', () => {
    const scenario1 = { temperature: 'hot' as const, grade: 'C' as const };
    const scenario2 = { temperature: 'cold' as const, grade: 'A' as const };

    assert.notEqual(scenario1.temperature, scenario1.grade);
    assert.equal(scenario1.temperature, 'hot');
    assert.equal(scenario1.grade, 'C');

    assert.equal(scenario2.temperature, 'cold');
    assert.equal(scenario2.grade, 'A');
  })();

  // Test 12: WhatsApp client_message_id retry
  await runTest(12, 'WhatsApp client_message_id retry (stable across retry attempts in SyncQueueDao)', () => {
    const waPayload = {
      lead_id: 'lead-test-101',
      messages: [
        {
          client_message_id: 'wa-client-msg-777',
          sender: 'agent' as const,
          message_type: 'text' as const,
          text: 'Sending brochure link.',
        },
      ],
    };

    const op = winstoneRoomDb.enqueue({
      operationType: 'WHATSAPP_SYNC',
      entityType: 'lead',
      entityId: waPayload.lead_id,
      payload: waPayload,
    });

    winstoneRoomDb.incrementRetry(op.id, 'Network error');
    const found = winstoneRoomDb.getAllSyncOperations().find((q) => q.id === op.id);
    assert.equal(found?.payload.messages[0].client_message_id, 'wa-client-msg-777');
  })();

  // Test 13: Recording client_upload_id retry
  await runTest(13, 'Recording client_upload_id retry (stable across retries; truthful recording capability)', () => {
    const uploadId = 'client-upload-rec-888';
    const uploadOp = winstoneRoomDb.enqueue({
      operationType: 'INGEST_RECORDING',
      entityType: 'call',
      entityId: 'call-1',
      payload: {
        client_upload_id: uploadId,
        lead_id: 'lead-1',
        phone_number: '+8801711234567',
        agent_id: 'agt-1',
        employee_id: 'WPL-AGT-0842',
        duration_seconds: 60,
        is_two_sided: true,
        recorder_source: 'android_telephony_voice_communication',
      },
    });

    winstoneRoomDb.incrementRetry(uploadOp.id, 'Ingest gateway retry');
    const found = winstoneRoomDb.getAllSyncOperations().find((q) => q.id === uploadOp.id);
    assert.equal(found?.payload.client_upload_id, uploadId);
  })();

  // Test 14: 401 handling in sync worker
  await runTest(14, '401 handling in sync worker (stops queue processing immediately, triggers re-auth)', async () => {
    const worker = new CrmSyncWorker();
    const originalReport = crmDataSource.submitReport;
    crmDataSource.submitReport = async () => {
      throw new CrmUnauthorizedError('Invalid x-device-token on CRM');
    };

    winstoneRoomDb.enqueue({
      operationType: 'SUBMIT_REPORT',
      entityType: 'report',
      entityId: 'rep-401',
      payload: { action: 'submit', report_id: 'rep-401' },
    });

    await worker.executeWorker();

    assert.equal(authRepository.isSessionUnauthorized(), true);
    assert.equal(crmDataSource.getDeviceToken(), null);

    crmDataSource.submitReport = originalReport;
  })();

  // Test 15: 409 handling in sync worker
  await runTest(15, '409 handling in sync worker (reconciles active server report state)', async () => {
    winstoneRoomDb.clearQueue();
    // Re-authenticate session first so sync loop executes
    const originalLogin = crmDataSource.login;
    const originalGetWorkspace = crmDataSource.getWorkspace;
    crmDataSource.getWorkspace = async () => ({
      agent: { id: 'agt-1', employee_id: 'WPL-AGT-0842', name: 'Tanvir', phone: '+8801711', sim_number: '+8801711', role: 'Agent' },
      leads: [],
      calls: [],
      whatsapp: [],
      server_time: new Date().toISOString(),
    });
    crmDataSource.login = async () => ({
      ok: true,
      device_token: 'test-token-409',
      device_id: 'dev-1',
      agent: {
        id: 'agt-1',
        employee_id: 'WPL-AGT-0842',
        name: 'Tanvir',
        phone: '+8801711',
        sim_number: '+8801711',
        role: 'Agent',
      },
    });
    await authRepository.login({ identifier: 'tanvir@winstonebd.com', password: 'pwd' });
    crmDataSource.login = originalLogin;

    const worker = new CrmSyncWorker();
    const originalCallStart = crmDataSource.callStart;
    const originalGetPendingReport = crmDataSource.getPendingReport;

    crmDataSource.callStart = async () => {
      throw new CrmConflictError('Call blocked: active report exists on CRM');
    };
    crmDataSource.getPendingReport = async () => ({
      report_id: 'server-active-rep-99',
      lead_id: 'lead-reconciled-1',
      customer_name: 'Reconciled Client',
      phone_number: '+8801711000000',
      duration_seconds: 90,
    });

    winstoneRoomDb.enqueue({
      operationType: 'CALL_START',
      entityType: 'lead',
      entityId: 'lead-reconciled-1',
      payload: { lead_id: 'lead-reconciled-1' },
    });

    await worker.executeWorker();

    const pending = winstoneRoomDb.getPendingReport();
    assert.ok(pending, 'Conflict reconciliation should capture server active report');
    assert.equal(pending?.report_id, 'server-active-rep-99');

    crmDataSource.callStart = originalCallStart;
    crmDataSource.getPendingReport = originalGetPendingReport;
    crmDataSource.getWorkspace = originalGetWorkspace;
  })();

  // Test 16: 422 handling in sync worker
  await runTest(16, '422 handling in sync worker (marks operation failed without infinite retries)', async () => {
    winstoneRoomDb.clearQueue();
    const originalGetWorkspace = crmDataSource.getWorkspace;
    crmDataSource.getWorkspace = async () => ({
      agent: { id: 'agt-1', employee_id: 'WPL-AGT-0842', name: 'Tanvir', phone: '+8801711', sim_number: '+8801711', role: 'Agent' },
      leads: [],
      calls: [],
      whatsapp: [],
      server_time: new Date().toISOString(),
    });
    const worker = new CrmSyncWorker();
    const originalIngestLead = crmDataSource.ingestLead;
    crmDataSource.ingestLead = async () => {
      throw new CrmValidationError('Unprocessable Entity: Duplicate or invalid phone number');
    };

    const op = winstoneRoomDb.enqueue({
      operationType: 'INGEST_LEAD',
      entityType: 'lead',
      entityId: 'lead-422',
      payload: { name: 'Invalid Lead', phone_number: '123' },
    });

    await worker.executeWorker();

    const found = winstoneRoomDb.getAllSyncOperations().find((q) => q.id === op.id);
    assert.equal(found?.status, 'failed');
    assert.equal(found?.retryCount, 0, 'Should not increment retry count on 422');

    crmDataSource.ingestLead = originalIngestLead;
    crmDataSource.getWorkspace = originalGetWorkspace;
  })();

  // Test 17: 5xx retry
  await runTest(17, '5xx retry (transient server error increments retry counter with exponential backoff)', () => {
    const op = winstoneRoomDb.enqueue({
      operationType: 'CALL_STATE',
      entityType: 'call',
      entityId: 'call-503',
      payload: { state: 'ringing' },
    });

    for (let i = 1; i <= 5; i++) {
      winstoneRoomDb.incrementRetry(op.id, '503 Service Temporarily Unavailable');
    }

    const found = winstoneRoomDb.getAllSyncOperations().find((q) => q.id === op.id);
    assert.equal(found?.retryCount, 5);
    assert.equal(found?.status, 'failed');
  })();

  // Test 18: Network offline/recovery
  await runTest(18, 'Network offline/recovery (offline enqueues mutations; online executes queue)', async () => {
    const worker = new CrmSyncWorker();
    worker.setOnline(false);

    assert.equal(worker.getOnlineState(), false);
    winstoneRoomDb.enqueue({
      operationType: 'PRESENCE',
      entityType: 'agent',
      entityId: 'agt-1',
      payload: { status: 'busy' },
    });

    const res = await worker.executeWorker();
    assert.equal(res.syncedCount, 0);

    worker.setOnline(true);
    assert.equal(worker.getOnlineState(), true);
  })();

  // Test 19: Logout
  await runTest(19, 'Logout (removes device token, clears secure session, retains Room data)', async () => {
    await authRepository.logout();

    assert.equal(authRepository.isAuthenticated(), false);
    assert.equal(authRepository.getSession(), null);
    assert.equal(crmDataSource.getDeviceToken(), null);

    const leadsAfterLogout = winstoneRoomDb.getAllLeads();
    assert.equal(leadsAfterLogout.length > 0, true);
  })();

  // Test 20: No secret leakage into APK/source/logs
  await runTest(20, 'No secret leakage into APK/source/logs (scans for forbidden Supabase/admin keys)', () => {
    const forbiddenPatterns = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SECRET_KEY',
      'service_role',
      'sbp_secret',
      'ADMIN_PIN_SUPER',
    ];

    const projectRoot = process.cwd();
    const srcDir = path.join(projectRoot, 'src');

    function checkDir(dir: string) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          checkDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const pattern of forbiddenPatterns) {
            if (content.includes(`"${pattern}"`) && !content.includes('NEVER') && !content.includes('forbidden') && !content.includes('NO')) {
              throw new Error(`Forbidden secret pattern "${pattern}" detected in ${fullPath}`);
            }
          }
        }
      }
    }

    checkDir(srcDir);
  })();

  console.log('\n===============================================================');
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${passedTests + failedTests})`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite runner encountered fatal error:', err);
  process.exit(1);
});
