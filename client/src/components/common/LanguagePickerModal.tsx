import React, { useState } from 'react';
import { useLanguage, LANGUAGES, LangCode } from '../../context/LanguageContext.js';
import { Globe, Check, Sparkles, X } from 'lucide-react';

interface LanguagePickerModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isDismissable?: boolean;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  isOpen,
  onClose,
  isDismissable = true,
}) => {
  const { lang, setLang, setShowPicker, t } = useLanguage();
  const [selected, setSelected] = useState<LangCode>(lang);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setLang(selected);
    setShowPicker(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header background with gentle gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-6 text-white text-center">
          {isDismissable && onClose && (
            <button
              onClick={() => {
                setShowPicker(false);
                onClose();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label={t('Close modal')}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Globe className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {t('lang.title') || t('Choose Your Language')}
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto">
            {t('lang.subtitle') || t('Select your preferred language for the FollowUp portal')}
          </p>
        </div>

        {/* Language Options List */}
        <div className="p-6 space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5">
            {LANGUAGES.map((item) => {
              const isSelected = selected === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelected(item.code)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl select-none">{item.flag}</span>
                    <div>
                      <div className="font-bold text-sm tracking-wide group-hover:text-blue-600 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{item.labelEn}</div>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border-2 border-slate-300 group-hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('lang.continue') || t('Continue')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
