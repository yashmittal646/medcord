import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';

interface ConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCondition?: any;
}

export const ConditionModal: React.FC<ConditionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCondition,
}) => {
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [diagnosedDate, setDiagnosedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(existingCondition);

  useEffect(() => {
    if (existingCondition) {
      setCondition(existingCondition.condition || '');
      setStatus(existingCondition.status || 'ACTIVE');
      setDiagnosedDate(
        existingCondition.diagnosedDate
          ? new Date(existingCondition.diagnosedDate).toISOString().split('T')[0]
          : ''
      );
      setNotes(existingCondition.notes || '');
    } else {
      setCondition('');
      setStatus('ACTIVE');
      setDiagnosedDate('');
      setNotes('');
    }
    setError(null);
  }, [existingCondition, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        condition,
        status,
        diagnosedDate: diagnosedDate || undefined,
        notes: notes || undefined,
      };

      if (isEditing) {
        await api.updateCondition(existingCondition._id, payload);
      } else {
        await api.addCondition(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save condition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card max-w-md w-full p-6 relative border-slate-200/90 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            {isEditing ? 'Edit Chronic Condition' : 'Add Chronic Medical Condition'}
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Condition / Disease *</label>
            <input
              type="text"
              required
              placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full glass-input text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="MANAGED">Managed / Stable</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Diagnosed Date</label>
              <input
                type="date"
                value={diagnosedDate}
                onChange={(e) => setDiagnosedDate(e.target.value)}
                className="w-full glass-input text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Clinical Notes</label>
            <textarea
              rows={3}
              placeholder="Any ongoing treatment details or doctor notes..."
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
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Condition' : 'Save Condition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
