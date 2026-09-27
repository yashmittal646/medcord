import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqsData: FAQItem[] = [
  {
    id: 1,
    category: 'Consent & Privacy',
    question: 'How does patient-controlled consent work on MedCord?',
    answer: 'Traditional hospital systems store medical records in closed institutional databases. On MedCord, you own and hold your records. When a doctor wants to review your medical history or consultation chart, they must submit an access request specifying their clinical reason. You receive an instant alert to approve or deny the request. Furthermore, you can revoke any doctor’s access at any point in the future with a single click.',
  },
  {
    id: 2,
    category: 'Identity System',
    question: 'What is the difference between my PAT-ID and a doctor’s DOC-ID?',
    answer: 'MedCord utilizes strictly separated identifier namespaces: Patients receive a unique collision-resistant PAT-XXXXXX ID (e.g. PAT-A3F92B), which is safe to share with clinicians and emergency personnel. Doctors receive a verified DOC-XXXXXX credential upon clinical verification. Because these two namespaces never overlap, a patient credential can never accidentally gain doctor privileges, guaranteeing zero cross-portal authorization vulnerabilities.',
  },
  {
    id: 3,
    category: 'Emergency HUD',
    question: 'How do first responders access my Emergency HUD without logging in?',
    answer: 'In urgent life-threatening emergencies where every second counts, first responders can access a patient’s public Emergency HUD by entering their PAT-ID (or scanning an emergency card). The HUD displays strictly triage-vital medical data: Blood Group, Severe Allergies, Active Medications, and Emergency Contact details. No sensitive clinical consultation notes or diagnostic files are exposed without full login, and every emergency lookup is permanently timestamped in your privacy audit log.',
  },
  {
    id: 4,
    category: 'Access & Security',
    question: 'Can doctors view or download my medical records without my permission?',
    answer: 'No. MedCord enforces cryptographic and database-level role-based access control (RBAC). A doctor cannot query or decrypt your prescriptions, lab reports, or diagnostic images unless there is an active, valid consent grant recorded in the system. Every attempt to access a chart without active consent is strictly blocked and logged.',
  },
  {
    id: 5,
    category: 'Clinical Care',
    question: 'What are Doctor-Prescribed Health Paths?',
    answer: 'Health Paths are structured recovery and treatment roadmaps created by your attending physician. Instead of vague discharge instructions, your doctor outlines concrete medication schedules, milestone goals (e.g., Week 1 mobility, physical therapy check-in, follow-up scan). As a patient, you can track and check off milestones as you complete them, giving your care team real-time visibility into your recovery progress.',
  },
  {
    id: 6,
    category: 'Data Protection',
    question: 'How is my medical data encrypted and protected?',
    answer: 'All data on MedCord is encrypted in transit using TLS 1.3 and encrypted at rest using industry-standard AES-256 encryption. We adhere to strict HIPAA technical standards. Furthermore, MedCord never sells, rents, or monetizes patient data with third parties or advertisers.',
  },
];

export const FAQPage: React.FC = () => {
  const [openIds, setOpenIds] = useState<number[]>([1, 2]); // First two open by default
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFAQ = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFAQs = faqsData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Frequently Asked Questions
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-4">
            Help & <span className="text-blue-600">FAQs</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Find immediate answers about consent controls, emergency access, identifiers, and longitudinal health records.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xl mx-auto mb-12">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search questions (e.g. consent, emergency, PAT-ID, encryption)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
          />
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 mb-16">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <p className="text-sm text-slate-500">No questions found matching "{searchTerm}".</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-blue-200"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 focus:outline-none"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in duration-150">
                      <p>{faq.answer}</p>
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {faq.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still have questions banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Still have questions?</h3>
            <p className="text-xs text-slate-500">
              Can't find what you're looking for? Reach out directly to our support engineers.
            </p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all shrink-0"
          >
            Contact Support Team
          </Link>
        </div>

      </div>
    </div>
  );
};
