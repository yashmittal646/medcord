import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';

interface AllergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingAllergy?: any;
}

export const AllergyModal: React.FC<AllergyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingAllergy,
}) => {
  const [substance, setSubstance] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(existingAllergy);

  useEffect(() => {
    if (existingAllergy) {
      setSubstance(existingAllergy.substance || '');
      setSeverity(existingAllergy.severity || 'MODERATE');
      setNotes(existingAllergy.notes || '');
    } else {
      setSubstance('');
      setSeverity('MODERATE');
      setNotes('');
    }
    setError(null);
  }, [existingAllergy, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await api.updateAllergy(existingAllergy._id, { substance, severity, notes });
      } else {
        await api.addAllergy({ substance, severity, notes });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save allergy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card max-w-md w-full p-6 relative border-slate-200/90 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            {isEditing ? 'Edit Allergy Record' : 'Record Allergy / Adverse Reaction'}
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Substance / Medication *</label>
            <input
              type="text"
              required
              placeholder="e.g. Penicillin, Peanuts, Latex, Aspirin"
              value={substance}
              onChange={(e) => setSubstance(e.target.value)}
              className="w-full glass-input text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Severity Level *</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full glass-input text-xs bg-white"
            >
              <option value="MILD">Mild (Rash, itching)</option>
              <option value="MODERATE">Moderate (Hives, localized swelling)</option>
              <option value="SEVERE">Severe (Facial swelling, respiratory difficulty)</option>
              <option value="LIFE_THREATENING">Life-Threatening (Anaphylaxis shock risk)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reaction Details / Notes</label>
            <textarea
              rows={3}
              placeholder="Describe symptoms or previous adverse reactions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input text-xs resize-none bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Allergy' : 'Save Allergy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
