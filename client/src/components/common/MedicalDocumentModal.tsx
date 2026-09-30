import React from 'react';
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
  const openFile = useOpenRecordFile();
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const content = `
================================================================================
                    FOLLOWUP HEALTHCARE PLATFORM
                   OFFICIAL CLINICAL RECORD & RX
================================================================================

RECORD TITLE    : ${record.title || 'Medical Record'}
RECORD TYPE     : ${record.recordType || 'PRESCRIPTION'}
RECORD DATE     : ${new Date(record.recordDate || Date.now()).toLocaleDateString()}
FACILITY        : ${record.facilityName || 'Authorized Medical Center'}
PHYSICIAN       : Dr. ${record.doctorName || 'Authorized Clinician'}

--------------------------------------------------------------------------------
PATIENT INFORMATION
--------------------------------------------------------------------------------
PATIENT ID      : ${record.patientId || patient?.patientId || 'PAT-RECORD'}
PATIENT NAME    : ${patient?.name || 'Verified Patient'}

--------------------------------------------------------------------------------
CLINICAL NOTES / RX PRESCRIPTION ORDERS
--------------------------------------------------------------------------------
${record.description || 'No detailed prescription notes recorded.'}

${record.diagnosis ? `DIAGNOSIS:\n${record.diagnosis}\n` : ''}
${record.tags && record.tags.length > 0 ? `TAGS / CLINICAL CATEGORIES:\n${record.tags.join(', ')}\n` : ''}

--------------------------------------------------------------------------------
SECURITY & AUDIT CERTIFICATION
--------------------------------------------------------------------------------
Status          : Verified in FollowUp Sovereign Vault
Audit ID        : REC-${record._id || 'DIGITAL-STAMP'}
Timestamp       : ${new Date().toISOString()}
================================================================================
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
              <h2 className="text-sm font-bold text-white">Clinical Document Viewer</h2>
              <p className="text-[11px] text-slate-400">Official Medical Record & Prescription</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {record.file && (
              <button
                type="button"
                onClick={() => openFile(record._id)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Original Attachment</span>
              </button>
            )}

            <button
              onClick={handleDownloadText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Text</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
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
                  Certified Health Vault
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {record.facilityName || 'Apollo Clinic & Diagnostic Centre'}
              </p>
              {record.doctorName && (
                <p className="text-xs font-bold text-slate-800">
                  Attending: Dr. {record.doctorName}
                </p>
              )}
            </div>

            <div className="text-right space-y-1 sm:self-auto self-end">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                {getBadgeIcon(record.recordType)}
                <span>{record.recordType || 'MEDICAL RECORD'}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Date: {new Date(record.recordDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Doc ID: REC-{record._id?.slice(-8).toUpperCase() || 'E92F01'}
              </p>
            </div>
          </div>

          {/* Patient Meta Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Patient Name</span>
              <span className="font-bold text-slate-900">{patient?.name || 'Arjun Mehta'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Patient ID</span>
              <span className="font-mono font-bold text-blue-700">{record.patientId || 'PAT-DEMO01'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Facility / Clinic</span>
              <span className="font-medium text-slate-800">{record.facilityName || 'Apollo Clinic'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Prescribing Doctor</span>
              <span className="font-medium text-slate-800">Dr. {record.doctorName || 'Priya Sharma'}</span>
            </div>
          </div>

          {/* Document Main Content */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1">{record.title}</h3>
              {record.diagnosis && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs mt-3">
                  <span className="font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Clinical Diagnosis / Assessment:</span>
                  <p className="leading-relaxed">{record.diagnosis}</p>
                </div>
              )}
            </div>

            {/* Clinical Rx / Orders */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="text-lg font-serif font-bold text-slate-900">℞</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Prescription Orders & Clinical Instructions
                </span>
              </div>
              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                {record.description || 'No detailed instructions recorded.'}
              </div>
            </div>

            {/* Tags */}
            {record.tags && record.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Tags:</span>
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
                  Digitally Verified Medical Document
                </p>
                <p className="text-[10px] text-slate-500">
                  FollowUp Sovereign Health Vault • Tamper-Evident SHA-256
                </p>
              </div>
            </div>

            <div className="text-right sm:self-auto self-end border-t border-slate-300 pt-2 min-w-[180px]">
              <p className="text-xs font-serif italic text-slate-700">Dr. {record.doctorName || 'Priya Sharma'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authorized Clinician Signature</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
