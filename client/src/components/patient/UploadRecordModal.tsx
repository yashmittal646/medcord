import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, AlertCircle, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import { TagPicker } from '../common/TagPicker.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface UploadRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadRecordModal: React.FC<UploadRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [recordType, setRecordType] = useState('PRESCRIPTION');
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [tagNow, setTagNow] = useState(false);
  const [tags, setTags] = useState({ category: 'OTHER', conditions: [] as string[], sensitive: false });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError(t('File size exceeds 10MB limit.'));
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('Please provide a record title.'));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('recordType', recordType);
      formData.append('recordDate', recordDate);
      if (doctorName) formData.append('doctorName', doctorName);
      if (facilityName) formData.append('facilityName', facilityName);
      if (description) formData.append('description', description);
      if (file) formData.append('file', file);
      // Tags decide which specialists can open the record. If skipped, they are suggested automatically.
      if (tagNow) {
        formData.append('category', tags.category);
        if (tags.conditions.length) formData.append('conditions', JSON.stringify(tags.conditions));
        if (tags.sensitive) formData.append('sensitive', 'true');
      }

      await api.uploadRecord(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Failed to upload medical record.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card max-w-lg w-full p-6 relative border-slate-200/90 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-teal-600" />
            
            {t('Upload Medical Record')}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-teal-400 bg-teal-50/70'
                : 'border-slate-300 hover:border-teal-400 bg-slate-50/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {t('{size} MB • Ready to upload', { size: (file.size / (1024 * 1024)).toFixed(2) })}</p>
                </div>
                <span className="text-xs text-teal-700 font-semibold ml-2">{t('Change')}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-teal-600 shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    
                    {t('Click to select or drag & drop document')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    
                    {t('Supports PDF, PNG, JPG, WebP (Max 10MB)')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Record Type *')}</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              >
                <option value="PRESCRIPTION">{t('Prescription (Rx)')}</option>
                <option value="LAB_REPORT">{t('Lab / Diagnostic Report')}</option>
                <option value="CONSULTATION">{t('Doctor Consultation Note')}</option>
                <option value="CHECKUP">{t('Routine Health Checkup')}</option>
                <option value="OTHER">{t('Other Medical Document')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Record Date *')}</label>
              <input
                type="date"
                required
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Record Title *')}</label>
            <input
              type="text"
              required
              placeholder={t('e.g. Chest X-Ray Scan, Amoxicillin Prescription')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Doctor Name')}</label>
              <input
                type="text"
                placeholder={t('e.g. Dr. Robert Chen')}
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Clinic / Hospital')}</label>
              <input
                type="text"
                placeholder={t('e.g. City General Hospital')}
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Description / Notes')}</label>
            <textarea
              rows={2}
              placeholder={t('Any diagnostic notes, dosage instructions, or observations...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input text-xs resize-none bg-white"
            />
          </div>

          {/* Access tags */}
          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={tagNow}
                onChange={(e) => setTagNow(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold">{t('Choose who can see this now')}</span>
                <span className="block text-[11px] text-slate-500">
                  
                  {t('Skip this and we will suggest tags. Until they are set, only you can open the record.')}
                </span>
              </span>
            </label>
            {tagNow && <TagPicker {...tags} onChange={setTags} />}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="px-5 py-2.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white font-bold text-xs rounded-xl hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('Upload to Medical Vault')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
