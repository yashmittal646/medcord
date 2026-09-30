import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Shield,
  Lock,
  FileText,
  CheckCircle2,
  X,
  Stethoscope,
  Clock,
  Activity,
  Zap,
  ShieldCheck,
  Scale,
  HelpCircle,
  Users,
  Mail,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

type LegalModalType = 'privacy' | 'terms' | 'hipaa' | 'security' | 'consent' | null;

export const Footer: React.FC = () => {
  const { t, tn } = useLanguage();
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="mt-auto bg-white border-t border-slate-200/90 text-slate-700">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            
            {/* Column 1: Brand & Mission (2 cols on lg) */}
            <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt={t('FollowUp')}
                    className="w-full h-full"
                    style={{ objectFit: 'cover', objectPosition: 'center 30%', transform: 'scale(1.4)' }}
                  />
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  Follow<span className="text-blue-600">Up</span>
                </span>
              </Link>
              
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                
                {t('A patient-controlled longitudinal health records & consent-driven clinical access platform. Unifying medical histories with cryptographic privacy and emergency-readiness.')}
              </p>

              {/* Status & Trust Badges */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold w-fit">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>{t('All Systems Operational • 99.99% Uptime')}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />  {t('HIPAA Standard')}
                  </span>
                  <span>•</span>
                  <span>{t('256-Bit TLS Encryption')}</span>
                  <span>•</span>
                  <span>{t('Zero Ad Tracking')}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Portals & Access */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                
                {t('Portals & Access')}
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/patient/login" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-blue-600" />  {t('Patient Sign In')}
                  </Link>
                </li>
                <li>
                  <Link to="/patient/register" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />  {t('Create Patient ID')}
                  </Link>
                </li>
                <li>
                  <Link to="/doctor/login" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />  {t('Doctor Portal')}
                  </Link>
                </li>
                <li>
                  <Link to="/doctor/register" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />  {t('Doctor Register')}
                  </Link>
                </li>
                <li>
                  <Link to="/emergency" className="text-rose-600 hover:text-rose-700 font-bold transition-colors flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />  {t('Emergency HUD')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Features */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                
                {t('Platform Features')}
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <Link to="/patient/timeline" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />  {t('Longitudinal Timeline')}
                  </Link>
                </li>
                <li>
                  <Link to="/patient/records" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />  {t('Records Vault')}
                  </Link>
                </li>
                <li>
                  <Link to="/patient/activity" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />  {t('Real-Time Audit Feed')}
                  </Link>
                </li>
                <li>
                  <button onClick={() => setActiveModal('consent')} className="hover:text-blue-600 transition-colors text-left flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />  {t('Consent Architecture')}
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('security')} className="hover:text-blue-600 transition-colors text-left flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />  {t('Collision-Free IDs')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Company & Support */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                
                {t('Company & Support')}
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <Link
                    to="/team"
                    className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />  {t('Team')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />  {t('Contact Us')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />  {t('Help & FAQs')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Trust & Compliance */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                
                {t('Trust & Compliance')}
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-blue-600 transition-colors text-left flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5 text-slate-400" />  {t('Privacy Policy')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-blue-600 transition-colors text-left flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />  {t('Terms of Service')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('hipaa')}
                    className="hover:text-blue-600 transition-colors text-left flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />  {t('HIPAA Statement')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('security')}
                    className="hover:text-blue-600 transition-colors text-left flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />  {t('Security Safeguards')}
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              
              {t('© 2026 FollowUp Health Platform. All rights reserved.')}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/team" className="hover:text-blue-600 transition-colors">
                
                {t('Team')}
              </Link>
              <span>•</span>
              <Link to="/contact" className="hover:text-blue-600 transition-colors">
                
                {t('Contact Us')}
              </Link>
              <span>•</span>
              <Link to="/faq" className="hover:text-blue-600 transition-colors">
                
                {t('Help & FAQs')}
              </Link>
              <span>•</span>
              <button onClick={() => setActiveModal('privacy')} className="hover:text-blue-600 transition-colors">
                
                {t('Privacy Policy')}
              </button>
              <span>•</span>
              <button onClick={() => setActiveModal('terms')} className="hover:text-blue-600 transition-colors">
                
                {t('Terms')}
              </button>
              <span>•</span>
              <button onClick={() => setActiveModal('hipaa')} className="hover:text-blue-600 transition-colors">
                
                {t('HIPAA')}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════ LEGAL & COMPLIANCE MODAL DIALOGS ══════════ */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  {activeModal === 'privacy' && <Scale className="w-4 h-4" />}
                  {activeModal === 'terms' && <FileText className="w-4 h-4" />}
                  {activeModal === 'hipaa' && <ShieldCheck className="w-4 h-4" />}
                  {activeModal === 'security' && <Lock className="w-4 h-4" />}
                  {activeModal === 'consent' && <Shield className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeModal === 'privacy' && t('FollowUp Privacy Policy')}
                    {activeModal === 'terms' && t('Terms of Service')}
                    {activeModal === 'hipaa' && t('HIPAA Compliance & Security Standard')}
                    {activeModal === 'security' && t('Security Architecture & Data Protection')}
                    {activeModal === 'consent' && t('Consent-Driven Medical Access Framework')}
                  </h3>
                  <p className="text-[11px] text-slate-500">{t('Effective Date: January 2026 • Version 2.4')}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              {activeModal === 'privacy' && (
                <>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{t('Core Guarantee: Your Protected Health Information (PHI) is 100% patient-owned and never monetized.')}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">{t('1. Data Ownership')}</h4>
                  <p>
                    
                    {t('All health records, lab reports, prescriptions, and clinical notes uploaded to FollowUp remain the sole property of the patient. FollowUp operates strictly as an encrypted custodian.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('2. Explicit Doctor Consent')}</h4>
                  <p>
                    
                    {t('No healthcare provider or third party can access a patient\'s medical timeline without explicit, logged authorization. When a doctor requests access, the patient receives instant notification with the clinician\'s stated medical reason. Access can be revoked instantly at any time.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('3. Emergency Medical HUD')}</h4>
                  <p>
                    
                    {t('In life-threatening situations, first responders may access non-diagnostic emergency triage information (Blood Group, Active Allergies, Emergency Contacts) via public PAT-ID lookup. All emergency lookups are recorded in the patient\'s immutable audit log.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('4. Zero Data Selling')}</h4>
                  <p>
                    
                    {t('FollowUp does not sell, rent, or trade patient health data, anonymized or otherwise, to pharmaceutical companies, insurance agencies, or advertisers.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('5. Right to Erasure')}</h4>
                  <p>
                    
                    {t('Patients maintain the right to delete their account and associated longitudinal files at any time, in full compliance with GDPR and applicable health data regulations.')}
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <h4 className="text-sm font-bold text-slate-900">{t('1. Acceptance of Terms')}</h4>
                  <p>
                    
                    {t('By registering an account as a Patient or Doctor on FollowUp, you agree to adhere to these Terms of Service and all applicable federal and international healthcare privacy laws.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('2. Healthcare Professional Responsibility')}</h4>
                  <p>
                    
                    {t('Licensed clinicians accessing FollowUp agree that chart access requests must strictly correspond to genuine clinical necessity. Unauthorized access or falsification of clinical justifications constitutes grounds for immediate credential revocation and regulatory reporting.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('3. Not a Replacement for 911 / Immediate Care')}</h4>
                  <p>
                    
                    {t('FollowUp is a longitudinal record aggregator and clinical coordination tool. In case of an acute life-threatening emergency, users must immediately contact their local emergency services (e.g. 911 / 112).')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('4. Accurate Information')}</h4>
                  <p>
                    
                    {t('Patients are responsible for ensuring that uploaded documents and self-reported demographic information (e.g. allergies, emergency contacts) are accurate to assist clinicians in rendering optimal care.')}
                  </p>
                </>
              )}

              {activeModal === 'hipaa' && (
                <>
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{t('Compliant with HIPAA Security, Privacy, and Breach Notification Rules.')}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">{t('1. Technical Safeguards')}</h4>
                  <p>
                    
                    {t('All Protected Health Information (PHI) is encrypted at rest using AES-256 and in transit using TLS 1.3. Cryptographic access controls prevent database administrators from reading raw patient charts.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('2. Full Audit Log Architecture')}</h4>
                  <p>
                    
                    {t('Every read, write, export, or authorization change is recorded in an immutable audit ledger containing the timestamp, actor identity (DOC-ID/PAT-ID), IP address, and clinical justification.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('3. Business Associate Agreements (BAA)')}</h4>
                  <p>
                    
                    {t('All downstream cloud hosting and processing infrastructure operate under signed Business Associate Agreements ensuring strict institutional accountability.')}
                  </p>
                </>
              )}

              {activeModal === 'security' && (
                <>
                  <h4 className="text-sm font-bold text-slate-900">{t('1. Collision-Free Identifier Architecture')}</h4>
                  <p>
                    
                    {tn('FollowUp utilizes distinct identity namespaces for patients ({patient}) and doctors ({doctor}). This prevents privilege escalation or accidental cross-portal authentication.', { patient: <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">PAT-XXXXXX</code>, doctor: <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">DOC-XXXXXX</code> })}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('2. Role-Based Access Control (RBAC)')}</h4>
                  <p>
                    
                    {t('Endpoints enforce strict token authentication and verify active, non-expired patient consent grants prior to releasing any diagnostic or prescription payload.')}
                  </p>

                  <h4 className="text-sm font-bold text-slate-900">{t('3. Document Integrity Verification')}</h4>
                  <p>
                    
                    {t('Uploaded scans and reports are checksummed to guarantee that medical records cannot be altered post-upload without detection.')}
                  </p>
                </>
              )}

              {activeModal === 'consent' && (
                <>
                  <h4 className="text-sm font-bold text-slate-900">{t('1. The Consent-First Model')}</h4>
                  <p>
                    
                    {t('Traditional Electronic Medical Records (EMRs) trap patient charts in institutional silos. FollowUp shifts complete custody to the patient:')}
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                    <li>{t('Doctors search by public PAT-ID and must state their clinical reason.')}</li>
                    <li>{t('Patients receive real-time push alerts to approve or deny access.')}</li>
                    <li>{t('Access is time-bound and can be revoked with a single click at any time.')}</li>
                    <li>{t('Revocation immediately invalidates doctor chart viewing tokens.')}</li>
                  </ul>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                
                {t('Close Window')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
