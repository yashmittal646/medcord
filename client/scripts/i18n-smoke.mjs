/**
 * Runtime smoke test for translations. Loads the real app modules through Vite (so import.meta.glob works),
 * renders a probe component once per language and checks that each mechanism produces text in that script:
 *   t() with and without placeholders, tn() with JSX values, enumLabel(), translateServerMessage() (exact and
 *   templated), relative times, notification text and the locale used for dates.
 *
 *   npm run i18n:test
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = {
  hi: /[ऀ-ॿ]/,
  kn: /[ಀ-೿]/,
  ta: /[஀-௿]/,
  te: /[ఀ-౿]/,
};
const LOCALE = { en: 'en-US', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN' };

const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const failures = [];
let checks = 0;
const check = (lang, label, ok, detail = '') => {
  checks++;
  if (!ok) failures.push(`[${lang}] ${label} ${detail}`);
};

try {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v), removeItem: (k) => delete store[k] };

  // React stays a native import: Vite externalizes it for the app modules too, so both share one instance
  const React = (await import('react')).default;
  const { renderToString } = await import('react-dom/server');
  const ctx = await server.ssrLoadModule('/src/context/LanguageContext.tsx');
  const { enumLabel } = await server.ssrLoadModule('/src/utils/enumLabel.ts');
  const { translateServerMessage } = await server.ssrLoadModule('/src/utils/serverMessage.ts');
  const { timeLeftText, timeAgoText } = await server.ssrLoadModule('/src/utils/timeText.ts');
  const { notificationText } = await server.ssrLoadModule('/src/utils/notificationText.ts');
  const h = React.createElement;

  for (const lang of ['en', 'hi', 'kn', 'ta', 'te']) {
    store['FollowUp_language'] = lang;
    store['FollowUp_lang_picker_shown'] = 'true';
    const out = {};

    const Probe = () => {
      const { t, tn } = ctx.useLanguage();
      out.plain = t('Save Allergy');
      out.params = t('Dr. {name}', { name: 'Rao' });
      out.fallback = t('label.does.not.exist', 'fallback text');
      out.unknown = t('Some text nobody translated');
      out.tn = renderToString(h('span', null, tn('Help & {highlight}', { highlight: h('b', null, 'FAQ') })));
      out.enum = enumLabel('LIFE_THREATENING');
      out.enumSpecial = enumLabel('OBGYN');
      out.spec = enumLabel('CARDIOLOGY');
      out.serverExact = translateServerMessage('Invalid email or password.');
      out.serverTemplate = translateServerMessage("No patient found with ID 'PAT-9X'");
      out.serverUnknown = translateServerMessage('A message the server invented');
      out.left = timeLeftText(new Date(Date.now() + 5 * 3600_000 + 30_000).toISOString());
      out.ago = timeAgoText(new Date(Date.now() - 3 * 3600_000).toISOString());
      out.notification = notificationText({
        type: 'ACCESS_REQUEST_RECEIVED', title: 'EN title', body: 'EN body',
        data: { doctorName: 'Dr. Rao', specialization: 'CARDIOLOGY' },
      }).body;
      out.notificationFallback = notificationText({ type: 'SOMETHING_NEW', title: 'EN title', body: 'EN body' }).body;
      out.locale = ctx.getLocale();
      return h('div');
    };
    renderToString(h(ctx.LanguageProvider, null, h(Probe)));

    if (lang === 'en') {
      check(lang, 'English passes through', out.plain === 'Save Allergy' && out.params === 'Dr. Rao');
      check(lang, 'English enum label', out.enum === 'Life Threatening');
      check(lang, 'English locale', out.locale === LOCALE.en);
      continue;
    }

    const script = SCRIPT[lang];
    check(lang, 't() translates', script.test(out.plain), JSON.stringify(out.plain));
    check(lang, 't() fills placeholders', out.params.includes('Rao') && !out.params.includes('{name}') && script.test(out.params), out.params);
    check(lang, 't() honours explicit fallback', out.fallback === 'fallback text', out.fallback);
    check(lang, 't() leaves untranslated text alone', out.unknown === 'Some text nobody translated', out.unknown);
    check(lang, 'tn() keeps JSX values and translates around them', out.tn.includes('<b>FAQ</b>') && script.test(out.tn), out.tn);
    check(lang, 'enumLabel translates', script.test(out.enum) && !/[A-Za-z]{4,}/.test(out.enum.replace(/\(.*\)/, '')), out.enum);
    check(lang, 'enumLabel special acronyms', script.test(out.enumSpecial), out.enumSpecial);
    check(lang, 'specialization label', script.test(out.spec), out.spec);
    check(lang, 'server message (exact)', script.test(out.serverExact), out.serverExact);
    check(lang, 'server message (template) keeps the id', out.serverTemplate.includes("PAT-9X") && script.test(out.serverTemplate), out.serverTemplate);
    check(lang, 'unknown server message passes through', out.serverUnknown === 'A message the server invented', out.serverUnknown);
    check(lang, 'time left', script.test(out.left) && /\d/.test(out.left), out.left);
    check(lang, 'time ago', script.test(out.ago), out.ago);
    check(lang, 'notification text', script.test(out.notification) && out.notification.includes('Dr. Rao'), out.notification);
    check(lang, 'unknown notification type falls back to server text', out.notificationFallback === 'EN body', out.notificationFallback);
    check(lang, 'date locale follows language', out.locale === LOCALE[lang], out.locale);
  }

  // ── Whole pages ─────────────────────────────────────────────────────────
  const { StaticRouter } = await import('react-router-dom/server.js');
  const { AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.tsx');
  const PAGES = {
    Landing: ['/src/pages/LandingPage.tsx', 'LandingPage'],
    FAQ: ['/src/pages/FAQPage.tsx', 'FAQPage'],
    Team: ['/src/pages/TeamPage.tsx', 'TeamPage'],
    Contact: ['/src/pages/ContactPage.tsx', 'ContactPage'],
    Footer: ['/src/components/common/Footer.tsx', 'Footer'],
    Navbar: ['/src/components/common/Navbar.tsx', 'Navbar'],
    PatientLogin: ['/src/pages/auth/PatientLogin.tsx', 'PatientLogin'],
    DoctorRegister: ['/src/pages/auth/DoctorRegister.tsx', 'DoctorRegister'],
    PatientRegister: ['/src/pages/auth/PatientRegister.tsx', 'PatientRegister'],
    DoctorLogin: ['/src/pages/auth/DoctorLogin.tsx', 'DoctorLogin'],
    UnifiedTimeline: ['/src/components/timeline/UnifiedTimeline.tsx', 'UnifiedTimeline', {
      onViewRecord() {}, onOpenFile() {},
      records: [
        { id: '1', recordId: 'r1', hasFile: true, date: '2026-03-15', type: 'lab_report', title: 'CBC', description: 'Routine', metrics: [{ label: 'Hb', value: '14.2', status: 'normal' }, { label: 'WBC', value: '12.8', status: 'warning' }] },
        { id: '2', date: '2026-02-01T10:30:00Z', type: 'consultation', title: 'Follow-up', description: 'Stable', doctorName: 'Dr. Rao', facility: 'Apollo Clinic' },
        { id: '3', date: '2025-11-20', type: 'prescription', title: 'Metformin', description: '500mg' },
        { id: '4', date: '2025-10-01', type: 'medication', title: 'Amlodipine 5mg', description: '', status: 'Active' },
        { id: '5', date: '2025-06-12', type: 'vaccination', title: 'Influenza', description: '' },
        { id: '6', date: '2025-05-02', type: 'imaging', title: 'MRI', description: '' },
        { id: '7', date: '2024-09-09', type: 'diagnosis', title: 'Hypertension', description: '' },
        { id: '8', date: '2024-01-01', type: 'allergy', title: 'Penicillin', description: '', status: 'Severe', critical: true },
      ],
    }],
    // Health Tracker pieces with sample data (AI-written insight text arrives already in the patient's language)
    HealthTrackerCard: ['/src/pages/patient/PatientHealthTrackerPage.tsx', 'ParameterCard', {
      active: true, onSelect() {},
      series: { key: 'VITAMIN_D', name: 'Vitamin D', group: 'VITAMINS', unit: 'ng/mL', range: { low: 30, high: 100 }, custom: false, trend: 'UP',
        latest: { id: 'b', date: '2026-06-01', value: 24, flag: 'LOW', source: 'AI_EXTRACTED', recordTitle: 'CBC' },
        previous: { id: 'a', date: '2026-01-01', value: 18, flag: 'LOW', source: 'MANUAL' },
        points: [{ id: 'a', date: '2026-01-01', value: 18, flag: 'LOW', source: 'MANUAL' }, { id: 'b', date: '2026-06-01', value: 24, flag: 'LOW', source: 'AI_EXTRACTED', recordTitle: 'CBC' }] },
    }],
    HealthTrackerDetail: ['/src/pages/patient/PatientHealthTrackerPage.tsx', 'SeriesDetail', {
      onDelete() {}, onAdd() {},
      series: { key: 'HBA1C', name: 'HbA1c', group: 'DIABETES', unit: '%', range: { low: 4, high: 5.6 }, custom: false, trend: 'DOWN',
        latest: { id: 'b', date: '2026-06-01', value: 6.1, flag: 'HIGH', source: 'AI_EXTRACTED', recordTitle: 'CBC' },
        previous: { id: 'a', date: '2026-01-01', value: 7.2, flag: 'HIGH', source: 'MANUAL' },
        points: [{ id: 'a', date: '2026-01-01', value: 7.2, flag: 'HIGH', source: 'MANUAL' }, { id: 'b', date: '2026-06-01', value: 6.1, flag: 'HIGH', source: 'AI_EXTRACTED', recordTitle: 'CBC' }] },
    }],
    HealthInsights: ['/src/components/healthTracker/InsightsPanel.tsx', 'InsightsPanel', {
      isLoading: false, error: null, canGenerate: true, onGenerate() {},
      insights: { summary: '…', highlights: [{ test: 'HbA1c', status: 'WATCH', insight: '…' }], eatMore: ['…'], limit: ['…'], lifestyle: ['…'], followUp: ['…'], urgent: '…', generatedAt: '2026-06-01T10:00:00Z' },
    }],
    HealthInsightsEmpty: ['/src/components/healthTracker/InsightsPanel.tsx', 'InsightsPanel', { insights: null, isLoading: false, error: null, canGenerate: true, onGenerate() {} }],
    AddReadingModal: ['/src/components/healthTracker/AddReadingModal.tsx', 'AddReadingModal', {
      isOpen: true, onClose() {}, onSaved() {}, initialKey: 'OTHER',
      catalog: [{ key: 'GLUCOSE_FASTING', name: 'Fasting Blood Sugar', group: 'DIABETES', unit: 'mg/dL' }, { key: 'VITAMIN_B12', name: 'Vitamin B12', group: 'VITAMINS', unit: 'pg/mL' }],
    }],
    // Prescription sheet and editor pieces with sample data (medicine names are never translated)
    PrescriptionSheet: ['/src/components/prescription/PrescriptionDocument.tsx', 'PrescriptionDocument', { doc: {
      date: '2026-04-01', patient: { name: 'Priya', age: 34, gender: 'FEMALE', patientId: 'PAT-ABC123' }, complaints: '…', diagnosis: '…', comorbidities: ['Diabetes', 'Hypertension'],
      medicines: [{ key: 'a', medicineId: 'x', name: 'Metformin', strength: '500 mg', dosage: { morning: 1, afternoon: 0, night: 1 }, frequency: 'DAILY', duration: { value: 3, unit: 'MONTHS' }, timing: '…', note: '…' },
        { key: 'b', medicineId: 'y', name: 'Amlodipine', dosage: { morning: 0, afternoon: 0, night: 0 }, frequency: 'SOS', duration: null }],
      labTests: [{ key: 'c', name: 'CBC', note: '…' }], nextVisitDate: '2026-04-29',
      letterhead: { header: { doctorName: 'Dr. Rao', qualification: 'MBBS', registrationNumber: 'MMC-1' }, footer: { clinicName: 'Apollo Clinic', clinicAddress: 'Bengaluru', phone: '98765' } } } }],
    MedicineRows: ['/src/components/prescription/MedicineRows.tsx', 'MedicineRows', { onChange() {}, rows: [
      { key: 'a', medicineId: 'x', name: 'Metformin', strength: '500 mg', dosage: { morning: 1, afternoon: 0, night: 1 }, frequency: 'CUSTOM', duration: { value: 5, unit: 'DAYS' } },
      { key: 'b', medicineId: '', name: '', dosage: { morning: 0, afternoon: 0, night: 0 }, frequency: 'DAILY', duration: { value: 5, unit: 'WEEKS' } }] }],
    LabTestPicker: ['/src/components/prescription/LabTestPicker.tsx', 'LabTestPicker', { onChange() {}, tests: [{ key: 'a', name: 'CBC', note: '' }] }],
    // Dialogs, rendered open
    AllergyModal: ['/src/components/patient/AllergyModal.tsx', 'AllergyModal', { isOpen: true, onClose() {}, onSuccess() {} }],
    ConditionModal: ['/src/components/patient/ConditionModal.tsx', 'ConditionModal', { isOpen: true, onClose() {}, onSuccess() {} }],
    MedicationModal: ['/src/components/patient/MedicationModal.tsx', 'MedicationModal', { isOpen: true, onClose() {}, onSuccess() {} }],
    UploadRecordModal: ['/src/components/patient/UploadRecordModal.tsx', 'UploadRecordModal', { isOpen: true, onClose() {}, onSuccess() {} }],
    DoctorAccessRequestsModal: ['/src/components/patient/DoctorAccessRequestsModal.tsx', 'DoctorAccessRequestsModal', { isOpen: true, onClose() {} }],
    ConsultationModal: ['/src/components/doctor/DoctorConsultationModal.tsx', 'DoctorConsultationModal', { isOpen: true, onClose() {}, onSuccess() {}, patientId: 'PAT-1' }],
    CreateHealthPathModal: ['/src/components/doctor/CreateHealthPathModal.tsx', 'CreateHealthPathModal', { isOpen: true, onClose() {}, onSuccess() {}, patientId: 'PAT-1' }],
    LanguagePicker: ['/src/components/common/LanguagePickerModal.tsx', 'LanguagePickerModal', { isOpen: true }],
    RecordTagsModal: ['/src/components/patient/RecordTagsModal.tsx', 'RecordTagsModal', { record: { _id: '1', title: 'Sample', classification: { category: 'OTHER', associatedConditions: [], sensitivityLevel: 'STANDARD', source: 'AI', patientReviewed: false } }, onClose() {}, onSaved() {} }],
    MedicalDocumentModal: ['/src/components/common/MedicalDocumentModal.tsx', 'MedicalDocumentModal', { isOpen: true, onClose() {}, record: { _id: 'abc12345', title: 'Sample', recordType: 'PRESCRIPTION', recordDate: '2026-01-05', file: { originalName: 'x.pdf' } } }],
  };
  // Words that are legitimately the same in every language (brands, acronyms, sample data)
  const ALLOWED = /^(FollowUp|HIPAA|GDPR|TLS|AES|PAT|DOC|IST|PDF|CBC|WBC|GitHub|Bengaluru|India|Tech|Hub|Innovation|Corridor|Labs|Health|Sarah|Jenkins|Connor|Leonard|McCoy|Metro|General|Hospital|Amoxicillin|Penicillin|David|Marcus|Reed|Emily|Chen|Sharma|Apollo|SNOMED|PHI|BAA|RBAC|EMR|MRI|Innovation|Senior|Lead|Architect|Sovereign|Vault|SHA|US|Mon|Fri|Sat|Sun|Dr|Sign|Unspecified|Hackathon|Follow|Node|Express|React|Tailwind|TypeScript|Distributed|State|Yash|Mittal|yashmittal|gmail|XXXX+|XXXXXX+|mccoy|hospital|example|asynchealth|demo|doctor|mail|Robert|Chen|City|Priya|Arjun|Mehta|Clinic|Diagnostic|Centre|Penicillin|Metformin|Lisinopril|Atorvastatin|Amoxicillin|Chest|Latex|Aspirin|Rx|name|WebP|English|Hindi|Kannada|Tamil|Telugu|Sample|Medical|Profile|Timeline|Care|Plan|CBC|Follow|Stable|Metformin|Amlodipine|Active|Influenza|Routine|Hypertension|Severe|Rao|MBBS)$/i; // (the last five are English terms kept in parentheses by the existing Tamil nav labels)
  for (const lang of ['hi', 'kn', 'ta', 'te']) {
    store['FollowUp_language'] = lang;
    for (const [name, [file, exp, props]] of Object.entries(PAGES)) {
      const mod = await server.ssrLoadModule(file);
      const Page = mod[exp];
      const html = renderToString(
        h(StaticRouter, { location: '/' },
          h(AuthProvider, null, h(ToastProvider, null, h(ctx.LanguageProvider, null, h(Page, props)))))
      );
      // visible text plus the text-bearing attributes (placeholders, titles, labels)
      const attrs = [...html.matchAll(/\s(?:placeholder|title|aria-label|alt)="([^"]*)"/g)].map((m) => m[1]).join(' ');
      const text = (html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ') + ' ' + attrs).replace(/&[a-z#0-9]+;/gi, ' ');
      check(lang, name + ': renders in the language', SCRIPT[lang].test(text));
      const leftover = text.match(/\{\w+\}/g);
      check(lang, name + ': no unfilled placeholders', !leftover, leftover ? leftover.join(',') : '');
      const english = [...new Set((text.match(/[A-Za-z]{4,}/g) || []).filter((w) => !ALLOWED.test(w)))];
      check(lang, name + ': no untranslated English words', english.length === 0, english.slice(0, 12).join(', '));
    }
  }

  // ── Signed-in portals (initial render: page chrome, headings, empty/loading states) ──
  const PORTAL = {
    PATIENT: {
      user: { id: '1', name: 'Test Patient', email: 'p@example.com', role: 'PATIENT', publicId: 'PAT-TEST0001' },
      pages: {
        PatientLayout: ['/src/components/patient/PatientLayout.tsx', 'PatientLayout'],
        PatientDashboard: ['/src/pages/patient/PatientDashboard.tsx', 'PatientDashboard'],
        PatientProfile: ['/src/pages/patient/PatientProfilePage.tsx', 'PatientProfilePage'],
        PatientRecords: ['/src/pages/patient/PatientRecordsPage.tsx', 'PatientRecordsPage'],
        PatientTimeline: ['/src/pages/patient/PatientTimelinePage.tsx', 'PatientTimelinePage'],
        PatientHealthPaths: ['/src/pages/patient/PatientHealthPathsPage.tsx', 'PatientHealthPathsPage'],
        PatientActivity: ['/src/pages/patient/PatientActivityPage.tsx', 'PatientActivityPage'],
        PatientPrivacy: ['/src/pages/patient/PatientPrivacyPage.tsx', 'PatientPrivacyPage'],
        PatientAskAdvice: ['/src/pages/patient/PatientAskAdvicePage.tsx', 'PatientAskAdvicePage'],
        PatientHealthTracker: ['/src/pages/patient/PatientHealthTrackerPage.tsx', 'PatientHealthTrackerPage'],
        PatientPrescriptions: ['/src/pages/patient/PatientPrescriptionsPage.tsx', 'PatientPrescriptionsPage'],
      },
    },
    DOCTOR: {
      user: { id: '2', name: 'Test Doctor', email: 'd@example.com', role: 'DOCTOR', publicId: 'DOC-TEST0001' },
      pages: {
        DoctorLayout: ['/src/components/doctor/DoctorLayout.tsx', 'DoctorLayout'],
        DoctorDashboard: ['/src/pages/doctor/DoctorDashboard.tsx', 'DoctorDashboard'],
        DoctorLookup: ['/src/pages/doctor/DoctorPatientLookupPage.tsx', 'DoctorPatientLookupPage'],
        DoctorEmergency: ['/src/pages/doctor/DoctorEmergencyPage.tsx', 'DoctorEmergencyPage'],
        DoctorHealthPaths: ['/src/pages/doctor/DoctorHealthPathsPage.tsx', 'DoctorHealthPathsPage'],
        DoctorActivity: ['/src/pages/doctor/DoctorActivityPage.tsx', 'DoctorActivityPage'],
        DoctorChart: ['/src/pages/doctor/DoctorPatientChartPage.tsx', 'DoctorPatientChartPage'],
        DoctorPrescriptions: ['/src/pages/doctor/DoctorPrescriptionsPage.tsx', 'DoctorPrescriptionsPage'],
        DoctorPrescriptionNew: ['/src/pages/doctor/DoctorPrescriptionEditorPage.tsx', 'DoctorPrescriptionNewPage'],
        DoctorLetterhead: ['/src/pages/doctor/DoctorLetterheadPage.tsx', 'DoctorLetterheadPage'],
        AdminMedicines: ['/src/pages/AdminMedicinesPage.tsx', 'AdminMedicinesPage'],
      },
    },
  };
  const { NotificationProvider } = await server.ssrLoadModule('/src/context/NotificationContext.tsx');
  for (const lang of ['hi', 'kn', 'ta', 'te']) {
    store['FollowUp_language'] = lang;
    for (const portal of Object.values(PORTAL)) {
      store['async_health_token'] = 'test-token';
      store['async_health_login_time'] = String(Date.now());
      store['async_health_user'] = JSON.stringify(portal.user);
      for (const [name, [file, exp]] of Object.entries(portal.pages)) {
        let html = '';
        try {
          const Page = (await server.ssrLoadModule(file))[exp];
          html = renderToString(
            h(StaticRouter, { location: '/' },
              h(AuthProvider, null, h(ToastProvider, null, h(ctx.LanguageProvider, null, h(NotificationProvider, null, h(Page))))))
          );
        } catch (e) {
          check(lang, name + ': renders without crashing', false, String(e.message).slice(0, 120));
          continue;
        }
        const attrs = [...html.matchAll(/\s(?:placeholder|title|aria-label|alt)="([^"]*)"/g)].map((m) => m[1]).join(' ');
        const text = (html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ') + ' ' + attrs).replace(/&[a-z#0-9]+;/gi, ' ');
        const leftover = text.match(/\{\w+\}/g);
        check(lang, name + ': no unfilled placeholders', !leftover, leftover ? leftover.join(',') : '');
        const english = [...new Set((text.match(/[A-Za-z]{4,}/g) || []).filter((w) => !ALLOWED.test(w) && !/^(Test|Patient|Doctor|Loading)$/i.test(w)))];
        check(lang, name + ': no untranslated English words', english.length === 0, english.slice(0, 12).join(', '));
      }
    }
  }
} finally {
  await server.close();
}

if (failures.length) {
  console.log(`FAILED ${failures.length} of ${checks} checks`);
  failures.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log(`i18n smoke test passed (${checks} checks across 5 languages).`);
