import React, { useState } from 'react';
import { X, Tags, AlertCircle, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import { TagPicker } from '../common/TagPicker.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface RecordTagsModalProps {
  record: any | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Lets a patient review or change the tags that decide which specialists can open a record */
export const RecordTagsModal: React.FC<RecordTagsModalProps> = ({ record, onClose, onSaved }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const c = record?.classification;
  const [tags, setTags] = useState({
    category: c?.category ?? 'OTHER',
    conditions: (c?.associatedConditions ?? []) as string[],
    sensitive: c?.sensitivityLevel === 'HIGHLY_CONFIDENTIAL',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!record) return null;

  const suggested = c?.source === 'AI' && !c?.patientReviewed;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateRecordClassification(record._id, tags);
      showToast(t('Tags saved. Doctors’ access to this record has been updated.'), 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Could not save tags'));
    } finally {
      setSaving(false);
    }
  };

  const confirm = async () => {
    setSaving(true);
    try {
      await api.confirmRecordClassification(record._id);
      showToast(t('Tags confirmed.'), 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Could not confirm tags'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-card max-w-lg w-full p-6 relative border-slate-200/90 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tags className="w-5 h-5 text-teal-600" />
              
              {t('Who can see this record?')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{record.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {suggested && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            
            {t('These tags were suggested automatically. Check them, then confirm or adjust.')}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <TagPicker {...tags} onChange={setTags} />

        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800">
            
            {t('Cancel')}
          </button>
          {suggested && (
            <button
              onClick={confirm}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 disabled:opacity-50"
            >
              
              {t('Confirm suggested tags')}
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            
            {t('Save tags')}
          </button>
        </div>
      </div>
    </div>
  );
};
