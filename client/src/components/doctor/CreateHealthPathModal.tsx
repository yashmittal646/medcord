import React, { useState } from 'react';
import { X, AlertCircle, Plus, Trash2, HeartPulse } from 'lucide-react';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface CreateHealthPathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
}

interface MedicationEntry {
  medicine: string;
  dosage: string;
  frequency: string;
  durationDays?: string;
}

export const CreateHealthPathModal: React.FC<CreateHealthPathModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
}) => {
  const { t } = useLanguage();
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [medications, setMedications] = useState<MedicationEntry[]>([
    { medicine: '', dosage: '', frequency: '' },
  ]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const addMedication = () =>
    setMedications((prev) => [...prev, { medicine: '', dosage: '', frequency: '' }]);

  const removeMedication = (idx: number) =>
    setMedications((prev) => prev.filter((_, i) => i !== idx));

  const updateMedication = (idx: number, field: keyof MedicationEntry, value: string) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validMeds = medications.filter((m) => m.medicine && m.dosage && m.frequency);
    if (validMeds.length === 0) {
      setError(t('Add at least one complete medication entry.'));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createHealthPath({
        patientId,
        condition,
        description: description || undefined,
        startDate,
        endDate: endDate || undefined,
        medications: validMeds.map((m) => ({
          medicine: m.medicine,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: m.durationDays ? parseInt(m.durationDays) : undefined,
        })),
      });
      onSuccess();
      onClose();
      // Reset form
      setCondition('');
      setDescription('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setMedications([{ medicine: '', dosage: '', frequency: '' }]);
    } catch (err: any) {
      setError(err.message || t('Failed to create health path'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card max-w-2xl w-full p-6 relative border-slate-200/90 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-600" />
            
            {t('Create Health Path / Treatment Protocol')}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Condition & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Primary Condition / Care Episode *')}
            </label>
            <input
              type="text"
              required
              placeholder={t('e.g. Type 2 Diabetes Management, Hypertension Protocol')}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="glass-input w-full text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              
              {t('Treatment Protocol Overview & Clinical Instructions')}
            </label>
            <textarea
              rows={2}
              placeholder={t('Describe the treatment plan, goals, diet guidelines, and checkup intervals...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full text-sm resize-none bg-white"
            />
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                
                {t('Start Date *')}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input w-full text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                
                {t('Expected Completion Date (Optional)')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input w-full text-sm bg-white"
              />
            </div>
          </div>

          {/* Medication Regimen Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                
                {t('Prescribed Regimen / Medications *')}
              </label>
              <button
                type="button"
                onClick={addMedication}
                className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />  {t('Add Medicine')}
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {t('Medication #{number}', { number: idx + 1 })}
                    </span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={t('Medicine name')}
                      value={med.medicine}
                      onChange={(e) => updateMedication(idx, 'medicine', e.target.value)}
                      className="glass-input text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder={t('Dosage (e.g. 500mg)')}
                      value={med.dosage}
                      onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                      className="glass-input text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder={t('Frequency (e.g. Twice daily)')}
                      value={med.frequency}
                      onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                      className="glass-input text-xs bg-white"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder={t('Duration in days (optional)')}
                    value={med.durationDays || ''}
                    onChange={(e) => updateMedication(idx, 'durationDays', e.target.value)}
                    className="glass-input text-xs w-full sm:w-48 bg-white"
                    min="1"
                  />
                </div>
              ))}
            </div>
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
              <HeartPulse className="w-3.5 h-3.5" />
              {isSubmitting ? t('Creating...') : t('Create Treatment Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
