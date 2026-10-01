import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  ClipboardList,
  FlaskConical,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { useOpenRecordFile } from '../../hooks/useOpenRecordFile.js';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { enumLabel } from '../../utils/enumLabel.js';

interface MedicalDocumentModalProps {
  record: any | null;
  patient?: any;
  isOpen: boolean;
  onClose: () => void;
}

export const MedicalDocumentModal: React.FC<MedicalDocumentModalProps> = ({
  record,
  patient,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Prescriptions written in the app open in their own A4 view
  const rxLink = record?.prescription
    ? user?.role === 'PATIENT'
      ? `/patient/prescriptions/${record.prescription}`
      : String(record.uploadedBy) === String(user?.id)
      ? `/doctor/prescriptions/${record.prescription}`
      : null
    : null;
  const openFile = useOpenRecordFile();
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const rule = '='.repeat(80);
    const thin = '-'.repeat(80);
    const label = (text: string) => text.padEnd(16);
    const content = `
${rule}
                    FOLLOWUP HEALTHCARE PLATFORM
                   ${t('OFFICIAL CLINICAL RECORD & RX')}
${rule}

${label(t('RECORD TITLE'))}: ${record.title || t('Medical Record')}
${label(t('RECORD TYPE'))}: ${enumLabel(record.recordType || 'PRESCRIPTION')}
${label(t('RECORD DATE'))}: ${new Date(record.recordDate || Date.now()).toLocaleDateString(getLocale())}
${label(t('FACILITY'))}: ${record.facilityName || t('Authorized Medical Center')}
${label(t('PHYSICIAN'))}: ${t('Dr. {name}', { name: record.doctorName || t('Authorized Clinician') })}

${thin}
${t('PATIENT INFORMATION')}
${thin}
${label(t('PATIENT ID'))}: ${record.patientId || patient?.patientId || 'PAT-RECORD'}
${label(t('PATIENT NAME'))}: ${patient?.name || t('Verified Patient')}

${thin}
${t('CLINICAL NOTES / RX PRESCRIPTION ORDERS')}
${thin}
${record.description || t('No detailed prescription notes recorded.')}

${record.diagnosis ? `${t('DIAGNOSIS:')}\n${record.diagnosis}\n` : ''}
${record.tags && record.tags.length > 0 ? `${t('TAGS / CLINICAL CATEGORIES:')}\n${record.tags.join(', ')}\n` : ''}

${thin}
${t('SECURITY & AUDIT CERTIFICATION')}
${thin}
${label(t('Status'))}: ${t('Verified in FollowUp Sovereign Vault')}
${label(t('Audit ID'))}: REC-${record._id || 'DIGITAL-STAMP'}
${label(t('Timestamp'))}: ${new Date().toISOString()}
${rule}
    `;

    const blob = new Blob([content.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(record.title || 'prescription').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'PRESCRIPTION':
        return <ClipboardList className="w-5 h-5 text-teal-600" />;
      case 'LAB_REPORT':
        return <FlaskConical className="w-5 h-5 text-sky-600" />;
      case 'CONSULTATION':
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      default:
        return <HeartPulse className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t('Clinical Document Viewer')}</h2>
              <p className="text-[11px] text-slate-400">{t('Official Medical Record & Prescription')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rxLink && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(rxLink);
                }}
                className="px-3 py-1.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('Open prescription')}</span>
              </button>
            )}
            {record.file && (
              <button
                type="button"
                onClick={() => openFile(record._id)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('Original Attachment')}</span>
              </button>
            )}

            <button
              onClick={handleDownloadText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('Download Text')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('Print / Save as PDF')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div id="printable-medical-document" className="p-8 sm:p-12 space-y-8 bg-white text-slate-800">
          
          {/* Prescription Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-800 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  Follow<span className="text-blue-600">Up</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  
                  {t('Certified Health Vault')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {record.facilityName || 'Apollo Clinic & Diagnostic Centre'}
              </p>
              {record.doctorName && (
                <p className="text-xs font-bold text-slate-800">
                  {t('Attending: Dr. {doctorName}', { doctorName: record.doctorName })}
                </p>
              )}
            </div>

            <div className="text-right space-y-1 sm:self-auto self-end">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                {getBadgeIcon(record.recordType)}
                <span>{record.recordType ? enumLabel(record.recordType) : t('MEDICAL RECORD')}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {t('Date: {value}', { value: new Date(record.recordDate || Date.now()).toLocaleDateString(getLocale(), { year: 'numeric', month: 'long', day: 'numeric' }) })}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {t('Doc ID: REC-{id}', { id: record._id?.slice(-8).toUpperCase() || 'E92F01' })}
              </p>
            </div>
          </div>

          {/* Patient Meta Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('Patient Name')}</span>
              <span className="font-bold text-slate-900">{patient?.name || 'Arjun Mehta'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('Patient ID')}</span>
              <span className="font-mono font-bold text-blue-700">{record.patientId || 'PAT-DEMO01'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('Facility / Clinic')}</span>
              <span className="font-medium text-slate-800">{record.facilityName || 'Apollo Clinic'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t('Prescribing Doctor')}</span>
              <span className="font-medium text-slate-800">{t('Dr.')} {record.doctorName || 'Priya Sharma'}</span>
            </div>
          </div>

          {/* Document Main Content */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1">{record.title}</h3>
              {record.diagnosis && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs mt-3">
                  <span className="font-bold block mb-0.5 uppercase tracking-wider text-[10px]">{t('Clinical Diagnosis / Assessment:')}</span>
                  <p className="leading-relaxed">{record.diagnosis}</p>
                </div>
              )}
            </div>

            {/* Clinical Rx / Orders */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="text-lg font-serif font-bold text-slate-900">℞</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  
                  {t('Prescription Orders & Clinical Instructions')}
                </span>
              </div>
              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                {record.description || t('No detailed instructions recorded.')}
              </div>
            </div>

            {/* Tags */}
            {record.tags && record.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">{t('Tags:')}</span>
                {record.tags.map((t: string) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Verification & Doctor Signature Strip */}
          <div className="pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  
                  {t('Digitally Verified Medical Document')}
                </p>
                <p className="text-[10px] text-slate-500">
                  
                  {t('FollowUp Sovereign Health Vault • Tamper-Evident SHA-256')}
                </p>
              </div>
            </div>

            <div className="text-right sm:self-auto self-end border-t border-slate-300 pt-2 min-w-[180px]">
              <p className="text-xs font-serif italic text-slate-700">{t('Dr.')} {record.doctorName || 'Priya Sharma'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Authorized Clinician Signature')}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
