import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useLanguage, getLocale } from '../../context/LanguageContext.js';
import { AllergyModal } from '../../components/patient/AllergyModal.js';
import { ConditionModal } from '../../components/patient/ConditionModal.js';
import { MedicationModal } from '../../components/patient/MedicationModal.js';
import { enumLabel } from '../../utils/enumLabel.js';
import {
  AlertTriangle,
  Pill,
  Activity,
  Plus,
  Trash2,
  Edit3,
  User,
  Phone,
  Save,
} from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Profile edit state
  const [editData, setEditData] = useState({
    bloodGroup: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  // Modal states
  const [isAllergyOpen, setIsAllergyOpen] = useState(false);
  const [isConditionOpen, setIsConditionOpen] = useState(false);
  const [isMedicationOpen, setIsMedicationOpen] = useState(false);
  const [editAllergy, setEditAllergy] = useState<any>(null);
  const [editCondition, setEditCondition] = useState<any>(null);
  const [editMedication, setEditMedication] = useState<any>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPatientProfile();
      const p = res.data;
      setProfile(p);
      setEditData({
        bloodGroup: p.bloodGroup || '',
        gender: p.gender || '',
        emergencyContactName: p.emergencyContact?.name || '',
        emergencyContactPhone: p.emergencyContact?.phone || '',
        emergencyContactRelation: p.emergencyContact?.relation || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await api.updatePatientProfile({
        bloodGroup: editData.bloodGroup,
        gender: editData.gender,
        emergencyContact: {
          name: editData.emergencyContactName,
          phone: editData.emergencyContactPhone,
          relation: editData.emergencyContactRelation,
        },
      });
      setSaveMsg(t('Profile updated successfully!'));
      await fetchProfile();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllergy = async (id: string) => {
    if (!confirm(t('Delete this allergy record?'))) return;
    await api.deleteAllergy(id);
    await fetchProfile();
  };

  const handleDeleteCondition = async (id: string) => {
    if (!confirm(t('Delete this condition record?'))) return;
    await api.deleteCondition(id);
    await fetchProfile();
  };

  const handleDeleteMedication = async (id: string) => {
    if (!confirm(t('Delete this medication record?'))) return;
    await api.deleteProfileMedication(id);
    await fetchProfile();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="glass-card p-6 border-slate-200/90">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          {t('profile.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Basic Info Editor */}
      <div className="glass-card p-6 border-slate-200/90 space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-teal-600" />
          {t('profile.basicInfo')}
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('profile.bloodGroup')}
            </label>
            <select
              value={editData.bloodGroup}
              onChange={(e) => setEditData({ ...editData, bloodGroup: e.target.value })}
              className="glass-input w-full text-sm bg-white"
            >
              <option value="">{t('Unknown')}</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('profile.gender')}
            </label>
            <select
              value={editData.gender}
              onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
              className="glass-input w-full text-sm bg-white"
            >
              <option value="">{t('Prefer not to say')}</option>
              <option value="MALE">{t('profile.male')}</option>
              <option value="FEMALE">{t('profile.female')}</option>
              <option value="OTHER">{t('profile.other')}</option>
            </select>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-rose-600 flex items-center gap-2 mb-4">
            <Phone className="w-3.5 h-3.5" /> {t('profile.emergencyContact')}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('profile.name')}</label>
              <input
                type="text"
                placeholder={t('Full name')}
                value={editData.emergencyContactName}
                onChange={(e) => setEditData({ ...editData, emergencyContactName: e.target.value })}
                className="glass-input w-full text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('profile.phone')}</label>
              <input
                type="tel"
                placeholder={t('+91 XXXXXXXXXX')}
                value={editData.emergencyContactPhone}
                onChange={(e) => setEditData({ ...editData, emergencyContactPhone: e.target.value })}
                className="glass-input w-full text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('profile.relation')}</label>
              <input
                type="text"
                placeholder={t('e.g. Spouse, Parent')}
                value={editData.emergencyContactRelation}
                onChange={(e) => setEditData({ ...editData, emergencyContactRelation: e.target.value })}
                className="glass-input w-full text-sm bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#1f4e8c] hover:bg-[#183f72] text-white font-bold text-xs rounded-xl hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? t('Saving...') : t('profile.save')}
          </button>
          {saveMsg && <span className="text-xs text-emerald-600 font-semibold">{saveMsg}</span>}
        </div>
      </div>

      {/* Allergies Section */}
      <div className="glass-card p-6 border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            {t('profile.allergiesTitle')} ({profile?.allergies?.length || 0})
          </h2>
          <button
            onClick={() => { setEditAllergy(null); setIsAllergyOpen(true); }}
            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> {t('profile.addBtn')}
          </button>
        </div>

        {profile?.allergies?.length > 0 ? (
          <div className="space-y-2.5">
            {profile.allergies.map((a: any) => (
              <div key={a._id} className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{a.substance}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      a.severity === 'LIFE_THREATENING'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : a.severity === 'SEVERE'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>{enumLabel(a.severity)}</span>
                  </div>
                  {a.notes && <p className="text-xs text-slate-600 mt-1">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditAllergy(a); setIsAllergyOpen(true); }} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteAllergy(a._id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">{t('profile.noAllergies')}</p>
        )}
      </div>

      {/* Chronic Conditions Section */}
      <div className="glass-card p-6 border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            {t('profile.conditionsTitle')} ({profile?.chronicConditions?.length || 0})
          </h2>
          <button
            onClick={() => { setEditCondition(null); setIsConditionOpen(true); }}
            className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> {t('profile.addConditionBtn')}
          </button>
        </div>

        {profile?.chronicConditions?.length > 0 ? (
          <div className="space-y-2.5">
            {profile.chronicConditions.map((c: any) => (
              <div key={c._id} className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{c.condition}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">{enumLabel(c.status)}</span>
                  </div>
                  {c.diagnosedDate && <p className="text-xs text-slate-500 mt-0.5">{t('Diagnosed: {date}', { date: new Date(c.diagnosedDate).toLocaleDateString(getLocale()) })}</p>}
                  {c.notes && <p className="text-xs text-slate-600 mt-0.5">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditCondition(c); setIsConditionOpen(true); }} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteCondition(c._id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">{t('profile.noConditions')}</p>
        )}
      </div>

      {/* Current Medications Section */}
      <div className="glass-card p-6 border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-600" />
            {t('profile.medicationsTitle')} ({profile?.currentMedications?.length || 0})
          </h2>
          <button
            onClick={() => { setEditMedication(null); setIsMedicationOpen(true); }}
            className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> {t('profile.addMedicationBtn')}
          </button>
        </div>

        {profile?.currentMedications?.length > 0 ? (
          <div className="space-y-2.5">
            {profile.currentMedications.map((m: any) => (
              <div key={m._id} className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{m.medicine}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200 font-semibold">
                      {m.dosage} · {m.frequency}
                    </span>
                  </div>
                  {m.startDate && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      
                      {t('Started:')} {new Date(m.startDate).toLocaleDateString(getLocale())}
                      {m.endDate ? t(' · Until: {date}', { date: new Date(m.endDate).toLocaleDateString(getLocale()) }) : t(' · Ongoing')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditMedication(m); setIsMedicationOpen(true); }} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteMedication(m._id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">{t('profile.noMedications')}</p>
        )}
      </div>

      {/* Modals */}
      <AllergyModal
        isOpen={isAllergyOpen}
        onClose={() => { setIsAllergyOpen(false); setEditAllergy(null); }}
        onSuccess={fetchProfile}
        existingAllergy={editAllergy}
      />
      <ConditionModal
        isOpen={isConditionOpen}
        onClose={() => { setIsConditionOpen(false); setEditCondition(null); }}
        onSuccess={fetchProfile}
        existingCondition={editCondition}
      />
      <MedicationModal
        isOpen={isMedicationOpen}
        onClose={() => { setIsMedicationOpen(false); setEditMedication(null); }}
        onSuccess={fetchProfile}
        existingMedication={editMedication}
      />
    </div>
  );
};
