import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { DoctorProfile } from '../src/models/DoctorProfile.js';

async function runMasterE2ETests() {
  console.log('================================================================');
  console.log('🏥 ASYNC HEALTH PLATFORM - MASTER E2E VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Setup in-memory MongoDB
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('✅ In-memory database initialized');

  // 2. Setup Test HTTP Server
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5000;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // STEP 1: Patient Registration & Distinct ID Check
    console.log('\n[STEP 1] Register Patient & Distinguishable ID Verification');
    const patRegRes = await fetch(`${baseUrl}/auth/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: 'sarah.connor@cyber.org',
        password: 'Password123!',
        bloodGroup: 'O+',
        gender: 'FEMALE',
        emergencyContact: {
          name: 'John Connor',
          relationship: 'Son',
          phone: '+15550192834',
        },
      }),
    });
    const patRegData: any = await patRegRes.json();
    const patientToken = patRegData.data.token;
    const patientId = patRegData.data.user.publicId;

    if (!patientId.startsWith('PAT-')) {
      throw new Error(`Invalid Patient ID prefix: ${patientId}`);
    }
    console.log(`✅ Patient registered: ${patRegData.data.user.name} | ID: ${patientId} (Prefix: PAT-)`);

    // STEP 2: Doctor Registration & Distinct ID Check
    console.log('\n[STEP 2] Register Doctor & Distinguishable ID Verification');
    const docRegRes = await fetch(`${baseUrl}/auth/doctor/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Leonard McCoy',
        email: 'mccoy@starfleet.med',
        password: 'DocPassword123!',
        specialization: 'CARDIOLOGY',
        licenseNumber: 'MD-NCC-1701',
        hospitalAffiliation: 'Starfleet General',
      }),
    });
    const docRegData: any = await docRegRes.json();
    const doctorToken = docRegData.data.token;
    const doctorId = docRegData.data.user.publicId;

    if (!doctorId.startsWith('DOC-')) {
      throw new Error(`Invalid Doctor ID prefix: ${doctorId}`);
    }
    console.log(`✅ Doctor registered: ${docRegData.data.user.name} | ID: ${doctorId} (Prefix: DOC-)`);

    // STEP 3: Patient Profile Population
    console.log('\n[STEP 3] Patient Populates Structured Medical Profile');
    await fetch(`${baseUrl}/patient/allergies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ substance: 'Latex', severity: 'SEVERE', notes: 'Severe contact dermatitis' }),
    });
    await fetch(`${baseUrl}/patient/allergies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ substance: 'Sulfonamides', severity: 'LIFE_THREATENING', notes: 'Anaphylaxis risk' }),
    });
    await fetch(`${baseUrl}/patient/conditions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ condition: 'Hypertension', status: 'ACTIVE', notes: 'Stage 1 Essential' }),
    });
    console.log('✅ Added 2 critical allergies (Latex, Sulfonamides) and 1 condition (Hypertension)');

    // STEP 4: Patient Uploads Medical Record with File Attachment
    console.log('\n[STEP 4] Patient Uploads Medical Document');
    const formData = new FormData();
    formData.append('title', 'Echocardiogram Diagnostic Scan');
    formData.append('recordType', 'LAB_REPORT');
    formData.append('recordDate', new Date().toISOString());
    formData.append('facilityName', 'Metro Cardiology Clinic');
    formData.append('doctorName', 'Dr. Adams');
    formData.append('tags', JSON.stringify(['Cardio', 'Echo', 'Ultrasound']));
    formData.append('category', 'CARDIAC_TEST');
    formData.append('conditions', JSON.stringify(['ecg', 'arrhythmia']));

    const dummyFile = new Blob(['%PDF-1.4 Mock Echocardiogram Document Content...'], { type: 'application/pdf' });
    formData.append('file', dummyFile, 'echocardiogram_scan.pdf');

    const uploadRes = await fetch(`${baseUrl}/records/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: formData,
    });
    const uploadData: any = await uploadRes.json();
    const recordId = uploadData.data._id;
    console.log(`✅ Record uploaded: ${uploadData.data.title} | Attached file: ${uploadData.data.file.originalName}`);

    // STEP 5: Patient Views Timeline & Summary
    console.log('\n[STEP 5] Patient Views Timeline & Summary Snapshot');
    const timelineRes: any = await (await fetch(`${baseUrl}/timeline`, { headers: { Authorization: `Bearer ${patientToken}` } })).json();
    const summaryRes: any = await (await fetch(`${baseUrl}/timeline/summary`, { headers: { Authorization: `Bearer ${patientToken}` } })).json();
    console.log(`✅ Timeline events count: ${timelineRes.data.length}`);
    console.log(`✅ Summary snapshot total records: ${summaryRes.data.statistics.totalRecords}`);

    // STEP 6: Doctor Access WITHOUT Consent (Controlled Access Verification)
    console.log('\n[STEP 6] Doctor Requests Access (Consent Control Check)');
    const initialLookupRes = await fetch(`${baseUrl}/doctor/patient/${patientId}?reason=Cardiology+Consultation+Review`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const initialLookupData: any = await initialLookupRes.json();
    if (initialLookupData.data.accessGranted !== false) {
      throw new Error('Doctor was incorrectly granted access without patient approval!');
    }
    console.log(`✅ Access correctly restricted: Status = ${initialLookupData.data.status} (Access Request Submitted to Patient)`);

    // Doctor attempting to create Health Path or view timeline before approval must fail
    const blockedPathRes = await fetch(`${baseUrl}/health-paths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        patientId,
        condition: 'Premature Health Path',
        medications: [{ medicine: 'Drug A', dosage: '5mg', frequency: 'Daily' }],
      }),
    });
    if (blockedPathRes.status !== 403) {
      throw new Error(`Doctor without consent was not blocked with 403! Status: ${blockedPathRes.status}`);
    }
    console.log('✅ Doctor prevented from prescribing Health Path prior to patient consent (403 Forbidden)');

    // STEP 7: Patient Views & Approves Access Request
    console.log('\n[STEP 7] Patient Approves Doctor Access Request');
    const patientGrantsRes: any = await (await fetch(`${baseUrl}/access-grants/my-grants`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })).json();
    const pendingGrant = patientGrantsRes.data.pending.find((g: any) => g.doctorId === doctorId);
    if (!pendingGrant) {
      throw new Error('Pending access request not found in patient grants!');
    }
    console.log(`✅ Patient saw pending request from ${pendingGrant.doctorName} (${pendingGrant.doctorId}): "${pendingGrant.reason}"`);

    // Patient Approves
    const approveRes = await fetch(`${baseUrl}/access-grants/${pendingGrant._id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ decision: 'APPROVE' }),
    });
    const approveData: any = await approveRes.json();
    if (approveData.data.status !== 'APPROVED') {
      throw new Error('Failed to approve access grant');
    }
    console.log('✅ Patient approved doctor access grant!');

    // STEP 8: Doctor Now Has Full Access — Looks Up Patient & Views Full Chart
    console.log('\n[STEP 8] Doctor Looks Up Patient With Approved Consent');
    const approvedLookupRes = await fetch(`${baseUrl}/doctor/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const approvedLookupData: any = await approvedLookupRes.json();
    if (approvedLookupData.data.accessGranted !== true || !approvedLookupData.data.summary) {
      throw new Error(`Doctor lookup failed after approval: ${JSON.stringify(approvedLookupData)}`);
    }
    console.log(`✅ Doctor ${doctorId} accessed full patient chart for ${patientId}`);

    // STEP 9: Doctor Creates Health Path with Auto Medication Sync
    console.log('\n[STEP 9] Doctor Creates Health Path & Auto Medication Sync');
    const pathRes = await fetch(`${baseUrl}/health-paths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        patientId,
        condition: 'Hypertension Management Regimen',
        description: 'Initiate ACE-inhibitor therapy',
        medications: [
          {
            medicine: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily in the morning',
            durationDays: 30,
          },
        ],
      }),
    });
    const pathData: any = await pathRes.json();
    const pathId = pathData.data._id;
    console.log(`✅ Health Path created: '${pathData.data.condition}'`);

    // Verify Medication is Active in Patient Profile
    const profileAfterPath: any = await (await fetch(`${baseUrl}/patient/profile`, { headers: { Authorization: `Bearer ${patientToken}` } })).json();
    const lisinopril = profileAfterPath.data.currentMedications.find((m: any) => m.medicine === 'Lisinopril');
    if (!lisinopril || lisinopril.status !== 'ACTIVE') {
      throw new Error('Medication was not automatically synced into patient active medications!');
    }
    console.log(`✅ Auto-synced medication in patient profile: ${lisinopril.medicine} (${lisinopril.status})`);

    // STEP 10: Doctor Adds Consultation
    console.log('\n[STEP 10] Doctor Adds Consultation Note');
    const consultRes = await fetch(`${baseUrl}/doctor/patient/${patientId}/consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        title: 'Initial Cardiology Review',
        diagnosis: 'Stage 1 Hypertension - Commencing Treatment',
        description: 'Prescribed Lisinopril 10mg daily. Scheduled 4-week follow-up.',
        facilityName: 'Starfleet General Clinic',
      }),
    });
    const consultData: any = await consultRes.json();
    console.log(`✅ Consultation recorded: '${consultData.data.title}'`);

    // STEP 11: Patient Marks Health Path Completed
    console.log('\n[STEP 11] Patient Marks Health Path Completed');
    await fetch(`${baseUrl}/health-paths/${pathId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const profileAfterComplete: any = await (await fetch(`${baseUrl}/patient/profile`, { headers: { Authorization: `Bearer ${patientToken}` } })).json();
    const lisinoprilPost = profileAfterComplete.data.currentMedications.find((m: any) => m.medicine === 'Lisinopril');
    if (lisinoprilPost.status !== 'COMPLETED') {
      throw new Error('Synced medication status did not transition to COMPLETED!');
    }
    console.log(`✅ Health Path marked COMPLETED! Synced medication transitioned to: ${lisinoprilPost.status}`);

    // STEP 12: Emergency Access Snapshot & Audit
    console.log('\n[STEP 12] Emergency Access Snapshot & Audit Log');
    const emergencyRes = await fetch(`${baseUrl}/emergency/${patientId}?reason=Acute+Cardiac+ER+Emergency`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const emergencyData: any = await emergencyRes.json();
    if (emergencyRes.status !== 200 || !emergencyData.data.criticalAllergies) {
      throw new Error(`Emergency access failed: ${JSON.stringify(emergencyData)}`);
    }
    console.log(`✅ Emergency critical snapshot received! Blood Group: ${emergencyData.data.patient.bloodGroup}`);

    // STEP 13: Patient Privacy & Activity Feed
    console.log('\n[STEP 13] Patient Views Privacy Audit Feed');
    const activityRes = await fetch(`${baseUrl}/audit/my-activity`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    const activityData: any = await activityRes.json();
    if (activityRes.status !== 200 || activityData.data.length === 0) {
      throw new Error(`Activity feed failed: ${JSON.stringify(activityData)}`);
    }
    console.log(`✅ Patient Activity Feed verified! Found ${activityData.data.length} recorded privacy events.`);

    // STEP 14: Patient Revokes Doctor Access
    console.log('\n[STEP 14] Patient Revokes Doctor Access');
    await fetch(`${baseUrl}/access-grants/${pendingGrant._id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ decision: 'REVOKE' }),
    });

    // Doctor lookup should now be restricted again
    const postRevokeRes = await fetch(`${baseUrl}/doctor/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const postRevokeData: any = await postRevokeRes.json();
    if (postRevokeData.data.accessGranted !== false) {
      throw new Error('Doctor still had access after patient revoked permission!');
    }
    console.log('✅ Doctor access successfully revoked and verified restricted!');

    // STEP 15: Negative access-control checks (no cross-account leakage)
    console.log('\n[STEP 15] Unauthorized Doctors Cannot Read, Download, Delete or Modify Patient Data');
    const doc2Res: any = await (await fetch(`${baseUrl}/auth/doctor/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Stranger',
        email: 'stranger@nowhere.med',
        password: 'Password123!',
        specialization: 'DERMATOLOGY',
        licenseNumber: 'LIC-STRANGER',
      }),
    })).json();
    const doctor2Token = doc2Res.data.token;

    const call = (method: string, path: string, token: string, body?: unknown) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    const expectStatus = async (label: string, res: Response, status: number) => {
      if (res.status !== status) {
        throw new Error(`${label}: expected ${status} but got ${res.status}`);
      }
    };

    // A doctor who was never granted access
    await expectStatus('stranger GET record', await call('GET', `/records/${recordId}`, doctor2Token), 403);
    await expectStatus('stranger download record', await call('GET', `/records/${recordId}/download`, doctor2Token), 403);
    await expectStatus('stranger DELETE record', await call('DELETE', `/records/${recordId}`, doctor2Token), 403);
    await expectStatus('stranger GET health path', await call('GET', `/health-paths/${pathId}`, doctor2Token), 403);
    await expectStatus('stranger list health paths', await call('GET', `/health-paths?patientId=${patientId}`, doctor2Token), 403);
    await expectStatus('stranger PATCH health path', await call('PATCH', `/health-paths/${pathId}/status`, doctor2Token, { status: 'ARCHIVED' }), 403);
    await expectStatus('stranger note on health path', await call('POST', `/health-paths/${pathId}/notes`, doctor2Token, { note: 'x' }), 403);
    await expectStatus('stranger list records', await call('GET', `/records?patientId=${patientId.toLowerCase()}`, doctor2Token), 403);

    // The original doctor after the patient revoked consent
    await expectStatus('revoked GET record', await call('GET', `/records/${recordId}`, doctorToken), 403);
    await expectStatus('revoked DELETE record', await call('DELETE', `/records/${recordId}`, doctorToken), 403);
    await expectStatus('revoked GET health path', await call('GET', `/health-paths/${pathId}`, doctorToken), 403);

    // The patient still has full access to their own data
    await expectStatus('owner GET record', await call('GET', `/records/${recordId}`, patientToken), 200);

    // Audit log query is not open to patients or doctors
    await expectStatus('doctor audit logs', await call('GET', '/audit/logs', doctorToken), 403);
    await expectStatus('patient audit logs', await call('GET', '/audit/logs', patientToken), 403);

    // A doctor pending verification cannot use doctor-only endpoints (incl. emergency access)
    await DoctorProfile.updateOne({ doctorId: doc2Res.data.user.publicId }, { verificationStatus: 'PENDING' });
    await expectStatus('pending doctor emergency', await call('GET', `/emergency/${patientId}`, doctor2Token), 403);
    await expectStatus('pending doctor lookup', await call('GET', `/doctor/patient/${patientId}`, doctor2Token), 403);
    console.log('✅ Cross-account read/download/delete/modify all blocked; audit logs and unverified doctors locked out');

    console.log('\n================================================================');
    console.log('🎉 ALL 15 E2E CAPABILITY TESTS COMPLETED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runMasterE2ETests().catch((err) => {
  console.error('❌ Master E2E Suite Failed:', err);
  process.exit(1);
});
