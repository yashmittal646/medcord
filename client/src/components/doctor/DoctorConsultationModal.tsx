import React, { useState } from 'react';
import { X, AlertCircle, UploadCloud, Stethoscope } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { tx } from '../../i18n/index.js';

interface DoctorConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
}

const RECORD_TYPES = [
  { value: 'CONSULTATION', label: tx('Consultation Notes') },
  { value: 'PRESCRIPTION', label: tx('Prescription') },
  { value: 'LAB_REPORT', label: tx('Lab / Investigation Report') },
  { value: 'CHECKUP', label: tx('Routine Checkup') },
  { value: 'OTHER', label: tx('Other Document') },
];

export const DoctorConsultationModal: React.FC<DoctorConsultationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('CONSULTATION');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('recordType', recordType);
      formData.append('recordDate', recordDate);
      if (diagnosis) formData.append('diagnosis', diagnosis);
      if (description) formData.append('description', description);
      if (file) formData.append('file', file);

      await api.createDoctorConsultation(patientId, formData);
      onSuccess();
      onClose();
      // Reset
      setTitle('');
      setRecordType('CONSULTATION');
      setRecordDate(new Date().toISOString().split('T')[0]);
      setDiagnosis('');
      setDescription('');
      setFile(null);
    } catch (err: any) {
      setError(err.message || t('Failed to create consultation record'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card max-w-lg w-full p-6 relative border-slate-200/90 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            
            {t('Add Clinical Consultation / Upload Record')}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Record Title *')}
            </label>
            <input
              type="text"
              required
              placeholder={t('e.g. Annual Checkup, Follow-up Consultation')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full text-sm bg-white"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                
                {t('Record Type *')}
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="glass-input w-full text-sm bg-white"
              >
                {RECORD_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{t(rt.label)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                
                {t('Date *')}
              </label>
              <input
                type="date"
                required
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="glass-input w-full text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Diagnosis / Clinical Assessment')}
            </label>
            <input
              type="text"
              placeholder={t('e.g. Controlled Type 2 Diabetes, Mild hypertension')}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="glass-input w-full text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Clinical Notes & Orders')}
            </label>
            <textarea
              rows={3}
              placeholder={t('Observations, treatment notes, instructions for the patient...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full text-sm resize-none bg-white"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Attach Clinical Document / Report (Optional)')}
            </label>
            <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 cursor-pointer transition-colors bg-slate-50">
              <UploadCloud className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-600 font-medium">
                {file ? file.name : t('Click to attach PDF, Image, Scan, etc.')}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-rose-600 hover:text-rose-700 mt-1 font-medium"
              >
                
                {t('Remove attached file')}
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white font-bold text-xs rounded-xl hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              {isSubmitting ? t('Saving...') : t('Save Consultation Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
