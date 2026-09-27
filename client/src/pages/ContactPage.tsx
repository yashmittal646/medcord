import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            Support & Inquiries
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-4">
            Reach out <span className="text-blue-600">to us</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            All you need to do is ping us or give us a call at any of the support channels below
          </p>
        </div>

        {/* 4 Cards Grid (matching screenshot style) */}
        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          
          {/* Card 1: Phone */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">Direct Helpline</div>
              <a
                href="tel:+919358111009"
                className="text-lg sm:text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors block mb-1.5"
              >
                Call us at +91 93581 11009
              </a>
              <p className="text-xs text-slate-500 leading-relaxed">
                Call us anytime. We are available during the working hours mentioned below.
              </p>
            </div>
          </div>

          {/* Card 2: Email */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">Email us on support</div>
              <a
                href="mailto:yashmittal1973@gmail.com"
                className="text-lg sm:text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors block mb-1.5 break-all"
              >
                yashmittal1973@gmail.com
              </a>
              <p className="text-xs text-slate-500 leading-relaxed">
                Expect a response in ~1 business working hours.
              </p>
            </div>
          </div>

          {/* Card 3: Address */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">Communication address</div>
              <div className="text-base font-bold text-slate-900 mb-1.5">
                FollowUp Health Innovation Labs
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tech Hub, Innovation Corridor, Bengaluru - 560102, India
              </p>
            </div>
          </div>

          {/* Card 4: Hours */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">Available work hours</div>
              <div className="text-sm font-bold text-slate-900 mb-1">
                Mon - Fri : 09:00 IST - 20:00 IST
              </div>
              <p className="text-xs text-slate-500">
                Sat - Sun : 09:00 IST - 18:00 IST
              </p>
            </div>
          </div>

        </div>

        {/* Quick Message Form */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900">Send us a message</h3>
            <p className="text-xs text-slate-500 mt-1">Have a question about FollowUp or clinical integration? Drop us a note.</p>
          </div>

          {isSubmitted ? (
            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-center animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Message Received!</h4>
              <p className="text-xs text-slate-600 mb-4">
                Thank you for reaching out. We will review your inquiry and get back to you shortly at <strong className="text-slate-900">{formState.email || 'your email'}</strong>.
              </p>
              <button
                onClick={() => { setIsSubmitted(false); setFormState({ name: '', email: '', subject: '', message: '' }); }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@example.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Clinical Question, Feedback or Support"
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can our team help you today?"
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="w-full glass-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Inquiry
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
