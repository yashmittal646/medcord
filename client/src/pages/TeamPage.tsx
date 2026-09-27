import React from 'react';
import { Users, Github, Mail, Phone, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeamPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Yash Mittal',
      role: 'Project Founder & Lead Full-Stack Architect',
      tag: 'Core Creator',
      bio: 'Architected the core FollowUp engine: patient-controlled consent protocol, collision-resistant identifier namespace (PAT-/DOC-), longitudinal timeline indexing, and real-time clinical audit ledgers.',
      skills: ['TypeScript', 'Node.js / Express', 'React & Tailwind', 'Distributed State', 'Health Tech Security'],
      email: 'yashmittal1973@gmail.com',
      phone: '+91 93581 11009',
      github: 'https://github.com/yashmittal646/FollowUp',
      avatarBg: 'bg-blue-600',
    },
    {
      name: 'Clinical & Security Research Team',
      role: 'Healthcare Standards & Emergency Protocol',
      tag: 'Clinical Advisory',
      bio: 'Collaborated on emergency HUD triage workflows, medical terminology tagging (SNOMED/ICD-10 standards), doctor credential verification, and HIPAA technical compliance specifications.',
      skills: ['HIPAA Safeguards', 'Clinical Workflow', 'Emergency Triage HUD', 'Medical Data Privacy'],
      email: 'yashmittal1973@gmail.com',
      phone: '+91 93581 11009',
      github: 'https://github.com/yashmittal646/FollowUp',
      avatarBg: 'bg-indigo-600',
    },
  ];

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-4">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            The Minds Behind FollowUp
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-4">
            Meet the <span className="text-blue-600">Team</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Engineers, researchers, and innovators building a patient-first future where health records are universal, secure, and always under patient control.
          </p>
        </div>

        {/* Team Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${member.avatarBg} text-white flex items-center justify-center font-black text-xl shadow-sm`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{member.name}</h3>
                      <div className="text-xs font-bold text-blue-600 mt-0.5">{member.role}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {member.tag}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  {member.bio}
                </p>

                {/* Skills pills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact / Links */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-semibold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> {member.email}
                </a>
                <a
                  href={`tel:${member.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> {member.phone}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Hackathon & Project Mission Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-600/30 text-blue-400 border border-blue-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon 2026 Initiative
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Built with purpose for next-gen healthcare
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              FollowUp was developed to solve real-world healthcare fragmentation. Our open-source platform replaces siloed hospital databases with patient-sovereign cryptographic records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <a
              href="https://github.com/yashmittal646/FollowUp"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
            >
              <Github className="w-4 h-4" /> GitHub Repository <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
            >
              <Mail className="w-4 h-4" /> Contact Team
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
