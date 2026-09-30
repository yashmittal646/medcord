import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Pill } from 'lucide-react';
import { api } from '../../services/api.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingMedication?: any;
}

const ROUTES = [
  { value: 'ORAL', label: 'Oral' },
  { value: 'TOPICAL', label: 'Topical' },
  { value: 'INTRAVENOUS', label: 'Intravenous (IV)' },
  { value: 'INTRAMUSCULAR', label: 'Intramuscular (IM)' },
  { value: 'SUBCUTANEOUS', label: 'Subcutaneous' },
  { value: 'INHALATION', label: 'Inhalation' },
  { value: 'NASAL', label: 'Nasal' },
  { value: 'OPHTHALMIC', label: 'Eye drops' },
  { value: 'RECTAL', label: 'Rectal' },
  { value: 'SUBLINGUAL', label: 'Sublingual' },
  { value: 'TRANSDERMAL', label: 'Transdermal (patch)' },
  { value: 'OTHER', label: 'Other' },
];

const TIMINGS = [
  { value: 'BEFORE_MEAL', label: 'Before meal' },
  { value: 'WITH_MEAL', label: 'With meal' },
  { value: 'AFTER_MEAL', label: 'After meal' },
  { value: 'BEDTIME', label: 'Bedtime' },
  { value: 'MORNING', label: 'Morning' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'AS_NEEDED', label: 'As needed (PRN)' },
  { value: 'ANY_TIME', label: 'Any time' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
];

const FREQ_PRESETS = [
  { label: 'Once daily', frequency: 'Once daily', timesPerDay: 1, times: ['08:00'] },
  { label: 'Twice daily', frequency: 'Twice daily', timesPerDay: 2, times: ['08:00', '20:00'] },
  { label: 'Three times daily', frequency: 'Three times daily', timesPerDay: 3, times: ['08:00', '14:00', '20:00'] },
  { label: 'Four times daily', frequency: 'Four times daily', timesPerDay: 4, times: ['08:00', '12:00', '18:00', '22:00'] },
  { label: 'Every 8 hours', frequency: 'Every 8 hours', timesPerDay: 3, times: ['08:00', '16:00', '00:00'] },
  { label: 'As needed', frequency: 'As needed (PRN)', timesPerDay: 1, times: [] },
];

interface FormState {
  name: string;
  genericName: string;
  dosage: string;
  unit: string;
  frequency: string;
  timesPerDay: string;
  scheduleTimes: string;  // comma-separated "HH:MM"
  route: string;
  timing: string;
  startDate: string;
  endDate: string;
  purpose: string;
  prescribingDoctor: string;
  instructions: string;
  status: string;
}

const BLANK: FormState = {
  name: '', genericName: '', dosage: '', unit: '',
  frequency: '', timesPerDay: '1', scheduleTimes: '',
  route: '', timing: '', startDate: '', endDate: '',
  purpose: '', prescribingDoctor: '', instructions: '', status: 'ACTIVE',
};

export const MedicationFormModal: React.FC<Props> = ({
  isOpen, onClose, onSuccess, existingMedication,
}) => {
  const [form, setForm] = useState<FormState>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(existingMedication);

  // Populate form when editing
  useEffect(() => {
    if (existingMedication) {
      setForm({
        name: existingMedication.name || '',
        genericName: existingMedication.genericName || '',
        dosage: existingMedication.dosage || '',
        unit: existingMedication.unit || '',
        frequency: existingMedication.frequency || '',
        timesPerDay: String(existingMedication.timesPerDay ?? 1),
        scheduleTimes: (existingMedication.scheduleTimes ?? []).join(', '),
        route: existingMedication.route || '',
        timing: existingMedication.timing || '',
        startDate: existingMedication.startDate
          ? new Date(existingMedication.startDate).toISOString().split('T')[0] : '',
        endDate: existingMedication.endDate
          ? new Date(existingMedication.endDate).toISOString().split('T')[0] : '',
        purpose: existingMedication.purpose || '',
        prescribingDoctor: existingMedication.prescribingDoctor || '',
        instructions: existingMedication.instructions || '',
        status: existingMedication.status || 'ACTIVE',
      });
    } else {
      setForm(BLANK);
    }
    setError(null);
    setFieldErrors({});
  }, [existingMedication, isOpen]);

  if (!isOpen) return null;

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFieldErrors((f) => { const next = { ...f }; delete next[k]; return next; });
  };

  const applyPreset = (preset: typeof FREQ_PRESETS[0]) => {
    setForm((f) => ({
      ...f,
      frequency: preset.frequency,
      timesPerDay: String(preset.timesPerDay),
      scheduleTimes: preset.times.join(', '),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const rawTimes = form.scheduleTimes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        genericName: form.genericName.trim() || undefined,
        dosage: form.dosage.trim(),
        unit: form.unit.trim() || undefined,
        frequency: form.frequency.trim(),
        timesPerDay: form.timesPerDay ? parseInt(form.timesPerDay, 10) : undefined,
        scheduleTimes: rawTimes.length ? rawTimes : undefined,
        route: form.route || undefined,
        timing: form.timing || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        purpose: form.purpose.trim() || undefined,
        prescribingDoctor: form.prescribingDoctor.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        status: form.status,
      };

      if (isEditing) {
        await api.updateMedication(existingMedication._id, payload);
      } else {
        await api.createMedication(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.errors) setFieldErrors(err.errors);
      setError(err.message || 'Failed to save medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = (field: keyof FormState) =>
    `glass-input text-xs ${fieldErrors[field] ? 'border-[#be3b2f]/50 !ring-[#be3b2f]/10' : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="glass-card max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#eceff3] shrink-0">
          <h3 className="text-base font-bold text-[#111] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e9eff8] flex items-center justify-center">
              <Pill className="w-4 h-4 text-[#1f4e8c]" />
            </div>
            {isEditing ? 'Edit Medication' : 'Add Medication'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-[#111] rounded-lg hover:bg-[#eceff3] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">
            {error && (
              <div className="p-3 bg-[#fdecea] border border-[#be3b2f]/25 rounded-xl text-[#be3b2f] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Safety banner */}
            {!isEditing && (
              <div className="p-3 bg-[#fdf0e0] border border-[#c86a0a]/20 rounded-xl text-[#c86a0a] text-[11px] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  This is a personal tracking tool only. Always follow your prescribing doctor's instructions.
                  Do not start or stop medications based on this record.
                </span>
              </div>
            )}

            {/* ── Names ── */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Medication Identity</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">
                    Medication Name <span className="text-[#be3b2f]">*</span>
                  </label>
                  <input
                    type="text" required value={form.name} onChange={set('name')}
                    placeholder="e.g. Metformin, Lisinopril"
                    className={inputCls('name')}
                  />
                  {fieldErrors.name && <p className="text-[10px] text-[#be3b2f] mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Generic Name</label>
                  <input
                    type="text" value={form.genericName} onChange={set('genericName')}
                    placeholder="e.g. metformin hydrochloride"
                    className={inputCls('genericName')}
                  />
                </div>
              </div>
            </div>

            {/* ── Dosing ── */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Dosing</h4>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">
                    Dosage <span className="text-[#be3b2f]">*</span>
                  </label>
                  <input
                    type="text" required value={form.dosage} onChange={set('dosage')}
                    placeholder="e.g. 500mg, 1 tablet"
                    className={inputCls('dosage')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Unit</label>
                  <input
                    type="text" value={form.unit} onChange={set('unit')}
                    placeholder="mg, mcg, ml…"
                    className={inputCls('unit')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Route</label>
                  <select value={form.route} onChange={set('route')} className={inputCls('route')}>
                    <option value="">Select route…</option>
                    {ROUTES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Frequency & Schedule ── */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Frequency & Schedule</h4>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {FREQ_PRESETS.map((p) => (
                  <button
                    key={p.label} type="button"
                    onClick={() => applyPreset(p)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                      form.frequency === p.frequency
                        ? 'bg-[#1f4e8c] text-white border-[#1f4e8c]'
                        : 'bg-white text-[#555] border-[#e5e7eb] hover:border-[#1f4e8c]/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">
                    Frequency <span className="text-[#be3b2f]">*</span>
                  </label>
                  <input
                    type="text" required value={form.frequency} onChange={set('frequency')}
                    placeholder="e.g. Twice daily after meals"
                    className={inputCls('frequency')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Timing</label>
                  <select value={form.timing} onChange={set('timing')} className={inputCls('timing')}>
                    <option value="">Select timing…</option>
                    {TIMINGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">
                    Schedule Times <span className="text-[10px] text-slate-500 font-normal ml-1">(comma-separated, e.g. 08:00, 20:00)</span>
                  </label>
                  <input
                    type="text" value={form.scheduleTimes} onChange={set('scheduleTimes')}
                    placeholder="08:00, 20:00"
                    className={inputCls('scheduleTimes')}
                  />
                </div>
              </div>
            </div>

            {/* ── Dates ── */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Duration</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={set('startDate')} className={inputCls('startDate')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={set('endDate')} className={inputCls('endDate')} />
                </div>
              </div>
            </div>

            {/* ── Clinical Info ── */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Clinical Information</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Purpose / Condition</label>
                  <input
                    type="text" value={form.purpose} onChange={set('purpose')}
                    placeholder="e.g. Type 2 Diabetes"
                    className={inputCls('purpose')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Prescribing Doctor</label>
                  <input
                    type="text" value={form.prescribingDoctor} onChange={set('prescribingDoctor')}
                    placeholder="Dr. Smith"
                    className={inputCls('prescribingDoctor')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#555] mb-1.5">Instructions / Notes</label>
                  <textarea
                    rows={2} value={form.instructions} onChange={set('instructions')}
                    placeholder="Any special instructions or notes…"
                    className={inputCls('instructions')}
                  />
                </div>
                {isEditing && (
                  <div>
                    <label className="block text-xs font-semibold text-[#555] mb-1.5">Status</label>
                    <select value={form.status} onChange={set('status')} className={inputCls('status')}>
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[#eceff3] shrink-0 flex items-center justify-end gap-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-[#111] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#1f4e8c]/20"
            >
              {isSubmitting ? 'Saving…' : isEditing ? 'Update Medication' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
