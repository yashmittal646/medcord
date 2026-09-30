import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { MedicalRecord } from '../src/models/MedicalRecord.js';
import { LabResult } from '../src/models/LabResult.js';
import { matchLabParameter, toCanonicalUnit, getLabParameter } from '../src/config/labCatalog.js';
import { normalizeExtracted, sanitizeExtraction, sanitizeInsights } from '../src/services/healthTracker.service.js';

process.env.DISABLE_AI_CLASSIFICATION = 'true';

/**
 * Health Tracker: parameter matching and unit conversion, trend series, manual readings, AI extraction
 * (with the provider stubbed), failure handling, AI insights validation and patient isolation.
 */
async function run() {
  console.log('================================================================');
  console.log('📈 HEALTH TRACKER SUITE');
  console.log('================================================================\n');

  const ok = (cond: unknown, msg: string) => {
    if (!cond) throw new Error(`Assertion failed: ${msg}`);
  };
  const near = (a: number | null | undefined, b: number, tol = 0.05) => a !== null && a !== undefined && Math.abs(a - b) <= tol;

  // ── [1] Catalog matching & units ───────────────────────────────────────────
  ok(matchLabParameter('HbA1c')?.key === 'HBA1C', 'HbA1c matches');
  ok(matchLabParameter('Glycated Haemoglobin (HbA1c)')?.key === 'HBA1C', 'long HbA1c name matches');
  ok(matchLabParameter('Fasting Blood Sugar (FBS)')?.key === 'GLUCOSE_FASTING', 'FBS matches');
  ok(matchLabParameter('Glucose - Fasting')?.key === 'GLUCOSE_FASTING', 'Glucose - Fasting matches');
  ok(matchLabParameter('S. Creatinine')?.key === 'CREATININE', 'S. Creatinine matches');
  ok(matchLabParameter('25-OH Vitamin D')?.key === 'VITAMIN_D', 'Vitamin D matches');
  ok(matchLabParameter('Serum Vitamin B12 Level')?.key === 'VITAMIN_B12', 'B12 with filler words matches');
  ok(matchLabParameter('SGPT')?.key === 'ALT', 'SGPT matches ALT');
  ok(matchLabParameter('Homocysteine') === undefined, 'unknown test stays custom');
  ok(matchLabParameter('Hb')?.key === 'HEMOGLOBIN', 'exact short alias matches');
  ok(matchLabParameter('HbsAg') === undefined, 'short alias is not matched by containment');

  const p = (k: string) => getLabParameter(k)!;
  ok(near(toCanonicalUnit(p('GLUCOSE_FASTING'), 5.5, 'mmol/L'), 99.09), 'glucose mmol/L -> mg/dL');
  ok(near(toCanonicalUnit(p('HBA1C'), 53, 'mmol/mol'), 7.0), 'HbA1c mmol/mol -> %');
  ok(near(toCanonicalUnit(p('VITAMIN_D'), 75, 'nmol/L'), 30.05), 'vitamin D nmol/L -> ng/mL');
  ok(toCanonicalUnit(p('PLATELETS'), 2.5, 'lakh/cumm') === 250, 'platelets lakh/cumm');
  ok(toCanonicalUnit(p('WBC'), 7500, 'cells/cumm') === 7.5, 'WBC cells/cumm');
  ok(toCanonicalUnit(p('WBC'), 7.5, 'x10^3/uL') === 7.5, 'WBC x10^3/uL spelling');
  ok(toCanonicalUnit(p('HEMOGLOBIN'), 13, 'g/dl') === 13, 'unit case-insensitive');
  ok(toCanonicalUnit(p('HEMOGLOBIN'), 13, 'furlongs') === null, 'unknown unit is not silently accepted');
  ok(toCanonicalUnit(p('TSH'), 2.1, 'µIU/mL') === 2.1 && toCanonicalUnit(p('TSH'), 2.1, 'uIU/ml') === 2.1, 'TSH µIU/mL = mIU/L');

  const cleaned = sanitizeExtraction({
    results: [
      { name: 'HbA1c', value: '7.1', unit: '%', refLow: '4', refHigh: '5.6' },
      { name: 'Glucose Fasting', value: 6.2, unit: 'mmol/L', refLow: 3.9, refHigh: 5.5 },
      { name: 'HBsAg', value: 'Negative' },
      { name: 'Homocysteine', value: 18.2, unit: 'µmol/L', refHigh: 15 },
      { name: '', value: 3 },
      { name: 'HbA1c', value: 7.3, unit: '%' },
      { name: 'Ferritin', value: 40, unit: 'furlongs' },
    ],
  });
  ok(cleaned.length === 5, 'qualitative and nameless results are dropped');
  const rows = normalizeExtracted(cleaned);
  const hba = rows.find((r) => r.key === 'HBA1C');
  ok(hba?.value === 7.1 && hba.refLow === 4 && hba.refHigh === 5.6, 'first HbA1c kept with its printed range');
  ok(rows.filter((r) => r.key === 'HBA1C').length === 1, 'duplicate parameter in one report is kept once');
  const glu = rows.find((r) => r.key === 'GLUCOSE_FASTING');
  ok(near(glu?.value, 111.7, 0.1) && near(glu?.refHigh, 99.09, 0.1), 'value and range converted to mg/dL');
  ok(rows.some((r) => r.key === 'CUSTOM:homocysteine' && r.unit === 'µmol/L'), 'custom test kept in printed unit');
  ok(rows.some((r) => r.key.startsWith('CUSTOM:ferritin') && r.unit === 'furlongs'), 'unconvertible unit becomes its own series');
  ok(sanitizeExtraction('nonsense').length === 0 && sanitizeExtraction(null).length === 0, 'garbage replies yield no values');
  console.log('✅ [1] Test names, units and printed ranges are normalised');

  const ins = sanitizeInsights({
    summary: 'Sugar is improving.',
    highlights: [{ test: 'HbA1c', status: 'BAD', insight: 'Still above range.' }, { test: 5 }],
    eatMore: ['Dal', 3, ''],
    limit: 'sweets',
    lifestyle: ['Walk'],
    followUp: ['Repeat HbA1c in 3 months'],
    urgent: 'null',
  });
  ok(ins?.highlights.length === 1 && ins.highlights[0].status === 'WATCH', 'unknown status coerced, malformed highlights dropped');
  ok(ins?.eatMore.length === 1 && ins.limit.length === 0 && ins.urgent === null, 'lists and urgent are validated');
  ok(sanitizeInsights({ highlights: [] }) === null, 'reply without summary is rejected');
  console.log('✅ [2] AI insight replies are validated before reaching the patient');

  // ── API setup ──────────────────────────────────────────────────────────────
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  const server = http.createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  const baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 5000}/api`;

  // Offline and deterministic: no real AI keys; the Groq endpoint is answered by a stub below
  const savedKeys = { groq: process.env.GROQ_API_KEY, gemini: process.env.GEMINI_API_KEY, vite: process.env.VITE_GEMINI_API_KEY };
  delete process.env.GROQ_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.VITE_GEMINI_API_KEY;
  const realFetch = globalThis.fetch;
  let groqCalls = 0;
  let groqMode: 'ok' | 'down' = 'ok';
  let lastGroqBody: any = null;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (url?.startsWith('https://api.groq.com/')) {
      groqCalls++;
      lastGroqBody = JSON.parse(init.body);
      if (groqMode === 'down') return new Response('unavailable', { status: 503 });
      const isVision = lastGroqBody.model.includes('scout');
      const content = isVision
        ? JSON.stringify({ results: [
            { name: 'HbA1c', value: 7.4, unit: '%', refLow: 4, refHigh: 5.6 },
            { name: 'Vitamin D (25-OH)', value: 45, unit: 'nmol/L', refLow: 75, refHigh: 250 },
            { name: 'Haemoglobin', value: 11.2, unit: 'g/dL' },
          ] })
        : JSON.stringify({
            summary: 'Your sugar control is improving but still above target.',
            highlights: [{ test: 'HbA1c', status: 'CONCERN', insight: 'Above range.' }],
            eatMore: ['Green leafy vegetables for iron'], limit: ['Sweets'], lifestyle: ['Walk 30 minutes'],
            followUp: ['Repeat HbA1c in 3 months'], urgent: null,
          });
      return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return realFetch(input, init);
  }) as typeof fetch;

  const call = (method: string, path: string, token?: string, body?: unknown) =>
    realFetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const json = async (res: Response): Promise<any> => res.json();
  const expectStatus = async (label: string, res: Response, status: number) => {
    if (res.status !== status) throw new Error(`${label}: expected ${status} but got ${res.status} ${await res.text()}`);
    return res;
  };
  const register = async (kind: 'patient' | 'doctor', name: string, email: string, extra: object = {}) => {
    const res = await call('POST', `/auth/${kind}/register`, undefined, {
      name, email, password: 'Password123!', ...(kind === 'doctor' ? { licenseNumber: `LIC-${name}` } : {}), ...extra,
    });
    await expectStatus(`register ${name}`, res, 201);
    const data = (await json(res)).data;
    return { token: data.token as string, publicId: data.user.publicId as string };
  };
  const upload = async (token: string, title: string, recordDate: string) => {
    const form = new FormData();
    form.append('title', title);
    form.append('recordType', 'LAB_REPORT');
    form.append('recordDate', recordDate);
    form.append('file', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), `${title}.png`);
    const res = await realFetch(`${baseUrl}/records/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    await expectStatus(`upload ${title}`, res, 201);
    return (await json(res)).data._id as string;
  };

  try {
    const patient = await register('patient', 'Asha Tracker', 'asha@example.com', { gender: 'FEMALE' });
    const other = await register('patient', 'Ravi Other', 'ravi@example.com');
    const doctor = await register('doctor', 'GP', 'gp@example.com', { specialization: 'General Practice' });

    // ── [3] Access ────────────────────────────────────────────────────────────
    await expectStatus('anonymous blocked', await call('GET', '/health-tracker'), 401);
    await expectStatus('doctor blocked', await call('GET', '/health-tracker', doctor.token), 403);
    const empty = (await json(await call('GET', '/health-tracker', patient.token))).data;
    ok(empty.series.length === 0 && empty.summary.pendingReports === 0, 'empty tracker');
    await expectStatus('insights need data', await call('POST', '/health-tracker/insights', patient.token, { langCode: 'en' }), 400);
    console.log('✅ [3] Patient-only; empty state is clean');

    // ── [4] Manual readings and series ──────────────────────────────────────
    await expectStatus('manual HbA1c #1', await call('POST', '/health-tracker/readings', patient.token, { key: 'HBA1C', value: 8.1, takenAt: '2026-01-10' }), 201);
    await expectStatus('manual HbA1c #2 via mmol/mol', await call('POST', '/health-tracker/readings', patient.token, { key: 'HBA1C', value: 58, unit: 'mmol/mol', takenAt: '2026-04-10' }), 201);
    await expectStatus('custom test by name', await call('POST', '/health-tracker/readings', patient.token, { name: 'Homocysteine', value: 12, unit: 'µmol/L', takenAt: '2026-04-10' }), 201);
    await expectStatus('wrong unit rejected', await call('POST', '/health-tracker/readings', patient.token, { key: 'HBA1C', value: 7, unit: 'kg', takenAt: '2026-04-10' }), 400);
    await expectStatus('future date rejected', await call('POST', '/health-tracker/readings', patient.token, { key: 'HBA1C', value: 7, takenAt: '2099-01-01' }), 400);
    await expectStatus('missing test rejected', await call('POST', '/health-tracker/readings', patient.token, { value: 7, takenAt: '2026-01-01' }), 400);

    let tracker = (await json(await call('GET', '/health-tracker', patient.token))).data;
    const hbaSeries = tracker.series.find((s: any) => s.key === 'HBA1C');
    ok(hbaSeries?.points.length === 2, 'two HbA1c readings');
    ok(near(hbaSeries.latest.value, 7.458, 0.01) && hbaSeries.latest.flag === 'HIGH', 'mmol/mol converted and flagged high');
    ok(hbaSeries.trend === 'DOWN', 'trend compares with the previous reading');
    ok(tracker.series.some((s: any) => s.key === 'CUSTOM:homocysteine' && s.custom && s.group === 'OTHER'), 'custom series listed');
    ok(tracker.series[0].key === 'HBA1C', 'out-of-range parameters come first');
    console.log('✅ [4] Manual readings build converted, flagged trend series');

    // ── [5] AI extraction (stubbed provider) ──────────────────────────────────
    await expectStatus('extract needs AI configured', await call('POST', '/health-tracker/extract', patient.token, {}), 503);
    process.env.GROQ_API_KEY = 'test-key';

    const r1 = await upload(patient.token, 'Diabetes panel', '2026-07-01');
    const r2 = await upload(other.token, 'Other patient report', '2026-07-01');
    tracker = (await json(await call('GET', '/health-tracker', patient.token))).data;
    ok(tracker.summary.pendingReports === 1 && tracker.summary.labReports === 1, 'new report is pending analysis');

    groqMode = 'down';
    await expectStatus('provider down', await call('POST', '/health-tracker/extract', patient.token, {}), 503);
    ok(!(await MedicalRecord.findById(r1).lean())?.labExtraction?.status, 'report stays pending when the provider is down');

    groqMode = 'ok';
    const extracted = (await json(await expectStatus('extract', await call('POST', '/health-tracker/extract', patient.token, {}), 200))).data;
    ok(extracted.processed === 1 && extracted.valuesAdded === 3 && extracted.remaining === 0, 'three values read from the report');
    ok(lastGroqBody.messages[0].content[1].image_url.url.startsWith('data:image/png;base64,'), 'image sent to the vision model');

    tracker = (await json(await call('GET', '/health-tracker', patient.token))).data;
    const hba2 = tracker.series.find((s: any) => s.key === 'HBA1C');
    ok(hba2.points.length === 3 && hba2.latest.recordTitle === 'Diabetes panel' && hba2.latest.source === 'AI_EXTRACTED', 'report value joins the manual series');
    const vitD = tracker.series.find((s: any) => s.key === 'VITAMIN_D');
    ok(near(vitD?.latest.value, 18.03, 0.05) && vitD.latest.flag === 'LOW', 'vitamin D converted and flagged low against the printed range');
    const hb = tracker.series.find((s: any) => s.key === 'HEMOGLOBIN');
    ok(hb?.range.low === 12 && hb.latest.flag === 'LOW', 'sex-specific range used when the report prints none');

    // Re-running a report replaces its values rather than duplicating them
    await expectStatus('re-extract one report', await call('POST', '/health-tracker/extract', patient.token, { recordId: r1 }), 200);
    ok((await LabResult.countDocuments({ record: r1 })) === 3, 're-analysis does not duplicate values');
    await expectStatus('cannot analyse another patient report', await call('POST', '/health-tracker/extract', patient.token, { recordId: r2 }), 404);
    await expectStatus('invalid id', await call('POST', '/health-tracker/extract', patient.token, { recordId: 'nope' }), 400);

    const reports = (await json(await call('GET', '/health-tracker/reports', patient.token))).data;
    ok(reports.length === 1 && reports[0].status === 'DONE' && reports[0].valueCount === 3, 'report list shows analysis status');

    // Unsupported attachment (plain text, no numbers in the description) is marked and skipped
    const base = (await MedicalRecord.findById(r1).lean())!;
    const r3 = String(
      (
        await MedicalRecord.create({
          patient: base.patient,
          patientId: base.patientId,
          uploadedBy: base.uploadedBy,
          uploaderRole: 'PATIENT',
          recordType: 'LAB_REPORT',
          title: 'Scanned note',
          recordDate: new Date('2026-08-01'),
          description: 'Report handed over on paper',
        })
      )._id
    );
    const before = groqCalls;
    await expectStatus('extract unsupported', await call('POST', '/health-tracker/extract', patient.token, {}), 200);
    ok((await MedicalRecord.findById(r3).lean())?.labExtraction?.status === 'UNSUPPORTED' && groqCalls === before, 'unsupported file skipped without an AI call');
    console.log('✅ [5] Extraction is patient-triggered, scoped, idempotent and survives provider outages');

    // ── [6] Insights ───────────────────────────────────────────────────────────
    const insights = (await json(await expectStatus('insights', await call('POST', '/health-tracker/insights', patient.token, { langCode: 'hi' }), 200))).data;
    ok(insights.summary && insights.highlights[0].status === 'CONCERN' && insights.language === 'hi', 'insights returned');
    const sent = JSON.parse(lastGroqBody.messages[1].content);
    ok(sent.labs.some((l: any) => l.test === 'HbA1c') && !JSON.stringify(sent).includes('Asha') && !JSON.stringify(sent).includes(patient.publicId), 'model gets lab data without name or ID');
    ok(lastGroqBody.messages[0].content.includes('Hindi'), 'answer requested in the patient language');
    const callsBefore = groqCalls;
    await call('POST', '/health-tracker/insights', patient.token, { langCode: 'hi' });
    ok(groqCalls === callsBefore, 'unchanged data is served from cache');
    await expectStatus('bad language', await call('POST', '/health-tracker/insights', patient.token, { langCode: 'fr' }), 400);
    console.log('✅ [6] Insights are personalised, anonymised, localised and cached');

    // ── [7] Isolation and cleanup ────────────────────────────────────────────
    const readingId = hba2.points[0].id;
    await expectStatus('other patient cannot delete', await call('DELETE', `/health-tracker/readings/${readingId}`, other.token), 404);
    ok((await json(await call('GET', '/health-tracker', other.token))).data.series.length === 0, 'other patient sees nothing');
    await expectStatus('owner deletes reading', await call('DELETE', `/health-tracker/readings/${readingId}`, patient.token), 200);
    await expectStatus('delete report', await call('DELETE', `/records/${r1}`, patient.token), 200);
    ok((await LabResult.countDocuments({ record: r1 })) === 0, 'deleting a report removes its values');
    tracker = (await json(await call('GET', '/health-tracker', patient.token))).data;
    ok(!tracker.series.some((s: any) => s.key === 'VITAMIN_D') && tracker.series.find((s: any) => s.key === 'HBA1C').points.length === 1, 'series reflect deletions');
    console.log('✅ [7] Patients only ever see and change their own readings');

    console.log('\n================================================================');
    console.log('🎉 HEALTH TRACKER SUITE PASSED');
    console.log('================================================================\n');
  } finally {
    globalThis.fetch = realFetch;
    if (savedKeys.groq) process.env.GROQ_API_KEY = savedKeys.groq; else delete process.env.GROQ_API_KEY;
    if (savedKeys.gemini) process.env.GEMINI_API_KEY = savedKeys.gemini;
    if (savedKeys.vite) process.env.VITE_GEMINI_API_KEY = savedKeys.vite;
    server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

run().catch((err) => {
  console.error('❌ Health Tracker Suite Failed:', err);
  process.exit(1);
});
