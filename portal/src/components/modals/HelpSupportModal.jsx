import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { submitSupportTicket } from '../../api/authApi';
import {
  X,
  HelpCircle,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function HelpSupportModal({ isOpen, onClose }) {
  const authUser = useSelector((state) => state.auth?.user);

  const [activeTab, setActiveTab] = useState('ticket'); // 'ticket' | 'faq'
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Placement Workflow');
  const [priority, setPriority] = useState('Normal');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.warning('Please provide a subject for your inquiry.');
      return;
    }
    if (!message.trim()) {
      toast.warning('Please enter your message details.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitSupportTicket({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      });

      if (res.success) {
        toast.success('Your support request has been submitted. Our team will contact you shortly!');
        setSubject('');
        setMessage('');
        onClose();
      } else {
        toast.error(res.message || 'Failed to submit ticket.');
      }
    } catch (err) {
      console.error('Support ticket submission error:', err);
      toast.error(err.response?.data?.message || 'Unable to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How are vocational logbook shift hours tracked and verified?',
      a: 'Logbook hours are recorded directly by host facilities and verified by Mantis placement coordinators. The system automatically reconciles shift dates and completed hours against the student curriculum requirements.',
    },
    {
      q: 'How do I download tax invoices & billing statements?',
      a: 'Official GST tax invoices are generated automatically upon student placement confirmation. You can view, filter, and download authentic PDF invoices anytime under the "Invoices & Statements" tab.',
    },
    {
      q: 'What compliance checks are mandatory before site commencement?',
      a: 'Under Australian vocational healthcare regulations, students must complete: National Police Check, Working With Children Check (WWCC), NDIS Worker Screening, CPR / First Aid, COVID-19 immunization, and an up-to-date Resume.',
    },
    {
      q: 'Why are host facility contact details protected on certain views?',
      a: 'Under the Mantis Placements service agreement, direct facility matching and coordinator negotiations are managed through the central placement coordination desk to maintain institutional SLA standards.',
    },
    {
      q: 'How do I schedule an orientation appointment for a student?',
      a: 'Orientations are arranged by the placement team once compliance checks are 100% verified. You will receive live in-app notifications and scheduled calendar appointments directly in your portal.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0147A6] via-[#0B6DC8] to-[#02AFA9] text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Help & Support Centre</h3>
              <p className="text-xs text-white/80">Placement coordination assistance and support desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Contact Bar */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <Mail size={15} className="text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Email Desk</span>
              <a href="mailto:support@mantisplacements.com.au" className="font-bold text-blue-700 hover:underline">
                support@mantis.edu.au
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-700">
            <Phone size={15} className="text-teal-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Helpline</span>
              <span className="font-bold text-slate-800">1300 000 000</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-700">
            <Clock size={15} className="text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Support Hours</span>
              <span className="font-bold text-slate-800">Mon-Fri 8:30-17:30</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-100 flex space-x-6">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'ticket' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <MessageSquare size={14} />
            <span>Submit Support Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'faq' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileQuestion size={14} />
            <span>Placement Guide & FAQs</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'ticket' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject / Query Title</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question regarding student logbook verification"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Placement Workflow">Placement Workflow & Sourcing</option>
                    <option value="Logbook & Attendance">Logbook Hours & Shift Verification</option>
                    <option value="Compliance Clearances">Compliance & Police/WWCC Checks</option>
                    <option value="Invoices & Statements">Invoices & Tax Statements</option>
                    <option value="Technical Issue">Portal Technical Assistance</option>
                    <option value="Other">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Normal">Normal — Standard response (24 hrs)</option>
                    <option value="High">High — Requires attention today</option>
                    <option value="Urgent">Urgent — Immediate placement blocker</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Detailed Description</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail. If related to a student, please mention their Name or Student ID..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Logged in as <strong className="text-slate-600">{authUser?.name}</strong> ({authUser?.role})
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between text-xs font-bold text-slate-800 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {expandedFaq === idx ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-4 py-3 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
