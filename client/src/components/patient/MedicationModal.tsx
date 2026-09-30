import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingMedication?: any;
}

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingMedication,
}) => {
  const { t } = useLanguage();
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(existingMedication);

  useEffect(() => {
    if (existingMedication) {
      setMedicine(existingMedication.medicine || '');
      setDosage(existingMedication.dosage || '');
      setFrequency(existingMedication.frequency || '');
      setStartDate(
        existingMedication.startDate
          ? new Date(existingMedication.startDate).toISOString().split('T')[0]
          : ''
      );
      setEndDate(
        existingMedication.endDate
          ? new Date(existingMedication.endDate).toISOString().split('T')[0]
          : ''
      );
      setStatus(existingMedication.status || 'ACTIVE');
    } else {
      setMedicine('');
      setDosage('');
      setFrequency('');
      setStartDate('');
      setEndDate('');
      setStatus('ACTIVE');
    }
    setError(null);
  }, [existingMedication, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        medicine,
        dosage,
        frequency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
      };

      if (isEditing) {
        await api.updateProfileMedication(existingMedication._id, payload);
      } else {
        await api.addProfileMedication(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Failed to save medication'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card max-w-md w-full p-6 relative border-slate-200/90 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            {isEditing ? t('Edit Medication') : t('Add Active Medication')}
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
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Medication Name *')}</label>
            <input
              type="text"
              required
              placeholder={t('e.g. Metformin, Lisinopril, Atorvastatin')}
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              className="w-full glass-input text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Dosage *')}</label>
              <input
                type="text"
                required
                placeholder={t('e.g. 500mg, 1 tablet')}
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Frequency *')}</label>
              <input
                type="text"
                required
                placeholder={t('e.g. Twice daily after meals')}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Start Date')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('End Date')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full glass-input text-xs bg-white"
            >
              <option value="ACTIVE">{t('Active')}</option>
              <option value="PAUSED">{t('Paused')}</option>
              <option value="COMPLETED">{t('Completed')}</option>
            </select>
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
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? t('Saving...') : isEditing ? t('Update Medication') : t('Save Medication')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
