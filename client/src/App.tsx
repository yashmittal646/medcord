import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';
import { ScrollToTop } from './components/common/ScrollToTop.js';
import { LandingPage } from './pages/LandingPage.js';
import { PatientLogin } from './pages/auth/PatientLogin.js';
import { PatientRegister } from './pages/auth/PatientRegister.js';
import { DoctorLogin } from './pages/auth/DoctorLogin.js';
import { DoctorRegister } from './pages/auth/DoctorRegister.js';
import { EmergencyPage } from './pages/EmergencyPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { TeamPage } from './pages/TeamPage.js';
import { FAQPage } from './pages/FAQPage.js';

// Patient Portal
import { PatientLayout } from './components/patient/PatientLayout.js';
import { PatientDashboard } from './pages/patient/PatientDashboard.js';
import { PatientProfilePage } from './pages/patient/PatientProfilePage.js';
import { PatientRecordsPage } from './pages/patient/PatientRecordsPage.js';
import { PatientTimelinePage } from './pages/patient/PatientTimelinePage.js';
import { PatientHealthPathsPage } from './pages/patient/PatientHealthPathsPage.js';
import { PatientActivityPage } from './pages/patient/PatientActivityPage.js';
import { PatientAskAdvicePage } from './pages/patient/PatientAskAdvicePage.js';
import { PatientPrivacyPage } from './pages/patient/PatientPrivacyPage.js';
import { PatientMedicationsPage } from './pages/patient/PatientMedicationsPage.js';
import { PatientHealthTrackerPage } from './pages/patient/PatientHealthTrackerPage.js';
import { PatientPrescriptionsPage, PatientPrescriptionViewPage } from './pages/patient/PatientPrescriptionsPage.js';
import { DoctorPrescriptionsPage, DoctorPrescriptionViewPage } from './pages/doctor/DoctorPrescriptionsPage.js';
import { DoctorPrescriptionEditorPage, DoctorPrescriptionNewPage } from './pages/doctor/DoctorPrescriptionEditorPage.js';
import { DoctorLetterheadPage } from './pages/doctor/DoctorLetterheadPage.js';
import { PrescriptionPrintPage } from './pages/PrescriptionPrintPage.js';
import { AdminMedicinesPage } from './pages/AdminMedicinesPage.js';

// Doctor Portal
import { DoctorLayout }              from './components/doctor/DoctorLayout.js';
import { DoctorDashboard }           from './pages/doctor/DoctorDashboard.js';
import { DoctorPatientLookupPage }   from './pages/doctor/DoctorPatientLookupPage.js';
import { DoctorPatientChartPage }    from './pages/doctor/DoctorPatientChartPage.js';
import { DoctorHealthPathsPage }     from './pages/doctor/DoctorHealthPathsPage.js';
import { DoctorActivityPage }        from './pages/doctor/DoctorActivityPage.js';
import { DoctorEmergencyPage }       from './pages/doctor/DoctorEmergencyPage.js';

/* Wrapper that injects the public Navbar and Footer around any page */
const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
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
            </div>
          </Router>
        </LanguageProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
