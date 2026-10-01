import React from 'react';

/**
 * Pages are split into their own files so the first visit downloads only what it shows. Each lazy page
 * also has `preload()`, used to fetch the next likely page ahead of time (the portal while the sign-in
 * form is being filled, the rest of the portal once the dashboard is up), so navigation stays instant.
 */
type Loader<M> = () => Promise<M>;
type Preloadable = { preload: () => Promise<unknown> };

function lazyNamed<M extends Record<string, any>, K extends keyof M>(loader: Loader<M>, name: K) {
  let pending: Promise<M> | null = null;
  const load = () => (pending ??= loader().catch((e) => {
    pending = null; // allow a retry after a network hiccup
    throw e;
  }));
  const Component = React.lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType<any> })));
  return Object.assign(Component, { preload: load }) as typeof Component & Preloadable;
}

// ── Public & auth ──
export const PatientLogin = lazyNamed(() => import('../pages/auth/PatientLogin.js'), 'PatientLogin');
export const PatientRegister = lazyNamed(() => import('../pages/auth/PatientRegister.js'), 'PatientRegister');
export const DoctorLogin = lazyNamed(() => import('../pages/auth/DoctorLogin.js'), 'DoctorLogin');
export const DoctorRegister = lazyNamed(() => import('../pages/auth/DoctorRegister.js'), 'DoctorRegister');
export const EmergencyPage = lazyNamed(() => import('../pages/EmergencyPage.js'), 'EmergencyPage');
export const ContactPage = lazyNamed(() => import('../pages/ContactPage.js'), 'ContactPage');
export const TeamPage = lazyNamed(() => import('../pages/TeamPage.js'), 'TeamPage');
export const FAQPage = lazyNamed(() => import('../pages/FAQPage.js'), 'FAQPage');
export const PrescriptionPrintPage = lazyNamed(() => import('../pages/PrescriptionPrintPage.js'), 'PrescriptionPrintPage');
export const AdminMedicinesPage = lazyNamed(() => import('../pages/AdminMedicinesPage.js'), 'AdminMedicinesPage');

// ── Patient portal ──
export const PatientLayout = lazyNamed(() => import('../components/patient/PatientLayout.js'), 'PatientLayout');
export const PatientDashboard = lazyNamed(() => import('../pages/patient/PatientDashboard.js'), 'PatientDashboard');
export const PatientProfilePage = lazyNamed(() => import('../pages/patient/PatientProfilePage.js'), 'PatientProfilePage');
export const PatientRecordsPage = lazyNamed(() => import('../pages/patient/PatientRecordsPage.js'), 'PatientRecordsPage');
export const PatientTimelinePage = lazyNamed(() => import('../pages/patient/PatientTimelinePage.js'), 'PatientTimelinePage');
export const PatientHealthPathsPage = lazyNamed(() => import('../pages/patient/PatientHealthPathsPage.js'), 'PatientHealthPathsPage');
export const PatientActivityPage = lazyNamed(() => import('../pages/patient/PatientActivityPage.js'), 'PatientActivityPage');
export const PatientAskAdvicePage = lazyNamed(() => import('../pages/patient/PatientAskAdvicePage.js'), 'PatientAskAdvicePage');
export const PatientPrivacyPage = lazyNamed(() => import('../pages/patient/PatientPrivacyPage.js'), 'PatientPrivacyPage');
export const PatientMedicationsPage = lazyNamed(() => import('../pages/patient/PatientMedicationsPage.js'), 'PatientMedicationsPage');
export const PatientHealthTrackerPage = lazyNamed(() => import('../pages/patient/PatientHealthTrackerPage.js'), 'PatientHealthTrackerPage');
export const PatientPrescriptionsPage = lazyNamed(() => import('../pages/patient/PatientPrescriptionsPage.js'), 'PatientPrescriptionsPage');
export const PatientPrescriptionViewPage = lazyNamed(() => import('../pages/patient/PatientPrescriptionsPage.js'), 'PatientPrescriptionViewPage');

// ── Doctor portal ──
export const DoctorLayout = lazyNamed(() => import('../components/doctor/DoctorLayout.js'), 'DoctorLayout');
export const DoctorDashboard = lazyNamed(() => import('../pages/doctor/DoctorDashboard.js'), 'DoctorDashboard');
export const DoctorPatientLookupPage = lazyNamed(() => import('../pages/doctor/DoctorPatientLookupPage.js'), 'DoctorPatientLookupPage');
export const DoctorPatientChartPage = lazyNamed(() => import('../pages/doctor/DoctorPatientChartPage.js'), 'DoctorPatientChartPage');
export const DoctorHealthPathsPage = lazyNamed(() => import('../pages/doctor/DoctorHealthPathsPage.js'), 'DoctorHealthPathsPage');
export const DoctorActivityPage = lazyNamed(() => import('../pages/doctor/DoctorActivityPage.js'), 'DoctorActivityPage');
export const DoctorEmergencyPage = lazyNamed(() => import('../pages/doctor/DoctorEmergencyPage.js'), 'DoctorEmergencyPage');
export const DoctorPrescriptionsPage = lazyNamed(() => import('../pages/doctor/DoctorPrescriptionsPage.js'), 'DoctorPrescriptionsPage');
export const DoctorPrescriptionViewPage = lazyNamed(() => import('../pages/doctor/DoctorPrescriptionsPage.js'), 'DoctorPrescriptionViewPage');
export const DoctorPrescriptionEditorPage = lazyNamed(() => import('../pages/doctor/DoctorPrescriptionEditorPage.js'), 'DoctorPrescriptionEditorPage');
export const DoctorPrescriptionNewPage = lazyNamed(() => import('../pages/doctor/DoctorPrescriptionEditorPage.js'), 'DoctorPrescriptionNewPage');
export const DoctorLetterheadPage = lazyNamed(() => import('../pages/doctor/DoctorLetterheadPage.js'), 'DoctorLetterheadPage');

// ── Preloading ──
const idle = (fn: () => void) =>
  'requestIdleCallback' in window ? (window as any).requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1200);
const run = (pages: Preloadable[]) => Promise.allSettled(pages.map((p) => p.preload()));

/** Sign-in and registration, fetched quietly after the first page has rendered */
export const preloadAuth = () => idle(() => void run([PatientLogin, DoctorLogin, PatientRegister, DoctorRegister]));
/** What a patient sees right after signing in */
export const preloadPatientEntry = () => void run([PatientLayout, PatientDashboard]);
/** What a doctor sees right after signing in */
export const preloadDoctorEntry = () => void run([DoctorLayout, DoctorDashboard]);
/** Every other portal page, once the portal is open */
export const preloadPatientPortal = () =>
  idle(() =>
    void run([
      PatientProfilePage, PatientRecordsPage, PatientTimelinePage, PatientHealthTrackerPage, PatientPrescriptionsPage,
      PatientHealthPathsPage, PatientMedicationsPage, PatientAskAdvicePage, PatientPrivacyPage, PatientActivityPage,
    ])
  );
export const preloadDoctorPortal = () =>
  idle(() =>
    void run([
      DoctorPatientLookupPage, DoctorPatientChartPage, DoctorPrescriptionsPage, DoctorPrescriptionEditorPage,
      DoctorHealthPathsPage, DoctorActivityPage, DoctorEmergencyPage, DoctorLetterheadPage,
    ])
  );
