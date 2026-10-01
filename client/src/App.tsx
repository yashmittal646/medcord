import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';
import { ScrollToTop } from './components/common/ScrollToTop.js';
import { LandingPage } from './pages/LandingPage.js';
import {
  PatientLogin, PatientRegister, DoctorLogin, DoctorRegister, EmergencyPage, ContactPage, TeamPage, FAQPage,
  PrescriptionPrintPage, AdminMedicinesPage,
  PatientLayout, PatientDashboard, PatientProfilePage, PatientRecordsPage, PatientTimelinePage, PatientHealthPathsPage,
  PatientActivityPage, PatientAskAdvicePage, PatientPrivacyPage, PatientMedicationsPage, PatientHealthTrackerPage,
  PatientPrescriptionsPage, PatientPrescriptionViewPage,
  DoctorLayout, DoctorDashboard, DoctorPatientLookupPage, DoctorPatientChartPage, DoctorHealthPathsPage, DoctorActivityPage,
  DoctorEmergencyPage, DoctorPrescriptionsPage, DoctorPrescriptionViewPage, DoctorPrescriptionEditorPage,
  DoctorPrescriptionNewPage, DoctorLetterheadPage,
  preloadAuth,
} from './routes/pages.js';

/** Shown for the moment a page's code is still downloading */
const PageLoading: React.FC = () => (
  <div className="flex min-h-[60vh] flex-1 items-center justify-center" role="status" aria-live="polite">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1f4e8c]" />
  </div>
);

/* Wrapper that injects the public Navbar and Footer around any page */
const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </>
);

export const App: React.FC = () => {
  // Most visitors start on the landing page and go to sign-in next: fetch those pages in the background
  useEffect(() => {
    preloadAuth();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
              <Suspense fallback={<PageLoading />}>
              <Routes>

                {/* ── Public / Auth routes (all with Navbar & Footer) ── */}
                <Route path="/" element={<PublicShell><LandingPage /></PublicShell>} />
                <Route path="/patient/login" element={<PublicShell><PatientLogin /></PublicShell>} />
                <Route path="/patient/register" element={<PublicShell><PatientRegister /></PublicShell>} />
                <Route path="/doctor/login" element={<PublicShell><DoctorLogin /></PublicShell>} />
                <Route path="/doctor/register" element={<PublicShell><DoctorRegister /></PublicShell>} />
                <Route path="/contact" element={<PublicShell><ContactPage /></PublicShell>} />
                <Route path="/team" element={<PublicShell><TeamPage /></PublicShell>} />
                <Route path="/faq" element={<PublicShell><FAQPage /></PublicShell>} />
                <Route path="/emergency/:patientId" element={<PublicShell><EmergencyPage /></PublicShell>} />
                <Route path="/emergency" element={<PublicShell><EmergencyPage /></PublicShell>} />

                {/* ── Patient Portal (sidebar layout, no top Navbar) ── */}
                <Route
                  path="/patient/*"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <PatientLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="profile" element={<PatientProfilePage />} />
                  <Route path="records" element={<PatientRecordsPage />} />
                  <Route path="timeline" element={<PatientTimelinePage />} />
                  <Route path="health-tracker" element={<PatientHealthTrackerPage />} />
                  <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
                  <Route path="prescriptions/:id" element={<PatientPrescriptionViewPage />} />
                  <Route path="health-paths" element={<PatientHealthPathsPage />} />
                  <Route path="ask-advice" element={<PatientAskAdvicePage />} />
                  <Route path="privacy" element={<PatientPrivacyPage />} />
                  <Route path="activity" element={<PatientActivityPage />} />
                  <Route path="medications" element={<PatientMedicationsPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* ── Doctor Portal (sidebar layout, no top Navbar) ── */}
                <Route
                  path="/doctor/*"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <DoctorLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="lookup" element={<DoctorPatientLookupPage />} />
                  <Route path="emergency" element={<DoctorEmergencyPage />} />
                  <Route path="patient/:patientId" element={<DoctorPatientChartPage />} />
                  <Route path="health-paths" element={<DoctorHealthPathsPage />} />
                  <Route path="activity" element={<DoctorActivityPage />} />
                  <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
                  <Route path="prescriptions/new" element={<DoctorPrescriptionNewPage />} />
                  <Route path="prescriptions/:id" element={<DoctorPrescriptionViewPage />} />
                  <Route path="prescriptions/:id/edit" element={<DoctorPrescriptionEditorPage />} />
                  <Route path="letterhead" element={<DoctorLetterheadPage />} />
                  <Route path="admin/medicines" element={<AdminMedicinesPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Prescription print view (A4, no portal chrome) */}
                <Route
                  path="/print/prescription/:id"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR']}>
                      <PrescriptionPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
              </Suspense>
            </div>
          </Router>
        </LanguageProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
