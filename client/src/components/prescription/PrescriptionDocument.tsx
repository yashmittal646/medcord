import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';
import { enumLabel } from '../../utils/enumLabel.js';
import { RxDocument, dosagePattern, durationLabel, frequencyLabel, visitDateLabel } from './rx.js';

/**
 * The prescription as the patient receives it: letterhead header at the top, footer at the bottom, an A4
 * sheet in print. Used for the doctor's preview, the patient's view and printing / Save as PDF.
 */
export const PrescriptionDocument: React.FC<{ doc: RxDocument; className?: string }> = ({ doc, className = '' }) => {
  const { t, formatDate } = useLanguage();
  const { header, footer } = doc.letterhead;
  const meds = doc.medicines.filter((m) => m.name);
  const tests = doc.labTests.filter((x) => x.name);

  return (
    <article className={`rx-paper ${className}`} lang={undefined}>
      {/* ── Letterhead header ── */}
      <header className="rx-head">
        <div className="min-w-0">
          <h1 className="rx-doctor">{header.doctorName || t('Doctor name')}</h1>
          {header.qualification && <p className="rx-sub">{header.qualification}</p>}
          {header.specialization && <p className="rx-sub">{header.specialization}</p>}
        </div>
        <div className="rx-head-right">
          {footer.clinicName && <p className="rx-clinic">{footer.clinicName}</p>}
          {header.registrationNumber && (
            <p className="rx-sub">
              {t('Reg. No.')} {header.registrationNumber}
            </p>
          )}
        </div>
      </header>

      {/* ── Patient ── */}
      <section className="rx-patient">
        <p>
          <span className="rx-label">{t('Patient')}</span> <strong>{doc.patient.name}</strong>
          {(doc.patient.age !== undefined || doc.patient.gender) && (
            <span className="rx-muted">
              {' '}
              ({[doc.patient.age !== undefined ? t('{n} yrs', { n: doc.patient.age }) : null, doc.patient.gender ? enumLabel(doc.patient.gender) : null].filter(Boolean).join(', ')})
            </span>
          )}
        </p>
        <p className="rx-mono">{doc.patient.patientId}</p>
        <p>
          <span className="rx-label">{t('Date')}</span> {formatDate(doc.date, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </section>

      {/* ── Clinical notes ── */}
      {(doc.complaints || doc.diagnosis || doc.comorbidities.length > 0) && (
        <section className="rx-notes">
          {doc.complaints && (
            <div>
              <p className="rx-label">{t('Complaints')}</p>
              <p className="rx-pre">{doc.complaints}</p>
            </div>
          )}
          {doc.diagnosis && (
            <div>
              <p className="rx-label">{t('Diagnosis')}</p>
              <p>{doc.diagnosis}</p>
            </div>
          )}
          {doc.comorbidities.length > 0 && (
            <div>
              <p className="rx-label">{t('Comorbidities')}</p>
              <p>{doc.comorbidities.map((c) => t(c)).join(', ')}</p>
            </div>
          )}
        </section>
      )}

      {/* ── Medicines ── */}
      {meds.length > 0 && (
        <section>
          <p className="rx-symbol" aria-label={t('Prescription')}>℞</p>
          <table className="rx-table">
            <thead>
              <tr>
                <th>{t('Medicine')}</th>
                <th>{t('Dosage')}</th>
                <th>{t('Frequency - Duration')}</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((m, i) => (
                <tr key={m.key}>
                  <td>
                    <p>
                      <span className="rx-num">{i + 1})</span> <strong>{m.name}</strong>
                      {m.strength && !m.name.includes(m.strength) && <span className="rx-muted"> {m.strength}</span>}
                    </p>
                    {m.genericName && <p className="rx-small rx-muted">{m.genericName}</p>}
                    {m.timing && (
                      <p className="rx-small">
                        {t('Timing')}: {m.timing}
                      </p>
                    )}
                    {m.note && (
                      <p className="rx-small">
                        {t('Note')}: {m.note}
                      </p>
                    )}
                  </td>
                  <td className="rx-mono rx-nowrap">{m.frequency === 'SOS' && !(m.dosage.morning + m.dosage.afternoon + m.dosage.night) ? '—' : dosagePattern(m.dosage)}</td>
                  <td>{[frequencyLabel(m), durationLabel(m.duration)].filter(Boolean).join(' - ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Investigations ── */}
      {tests.length > 0 && (
        <section className="rx-tests">
          <p className="rx-label">{t('Lab tests / Investigations')}</p>
          <ol>
            {tests.map((x) => (
              <li key={x.key}>
                {x.name}
                {x.note && <span className="rx-muted"> ({x.note})</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {doc.nextVisitDate && (
        <p className="rx-next">
          <span className="rx-label">{t('Next visit')}</span> {visitDateLabel(doc.nextVisitDate)}
        </p>
      )}

      <div className="rx-sign">
        <p>{header.doctorName}</p>
        {header.registrationNumber && <p className="rx-small rx-muted">{t('Reg. No.')} {header.registrationNumber}</p>}
      </div>

      {/* ── Letterhead footer ── */}
      <footer className="rx-foot">
        <p>{footer.clinicAddress || t('Clinic address')}</p>
        <p>
          {t('Phone')}: {footer.phone || '—'}
        </p>
      </footer>
    </article>
  );
};
