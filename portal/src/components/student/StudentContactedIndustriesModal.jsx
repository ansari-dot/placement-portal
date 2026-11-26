import React, { useState } from 'react';
import {
  X, Building2, User, Mail, Phone, MapPin, Calendar, Plus,
  CheckCircle2, Clock, AlertCircle, Eye
} from 'lucide-react';
import UnifiedIndustryModal from '../industry/UnifiedIndustryModal';
import { updateStudent, fetchStudentById } from '../../api/studentsApi';
import { fetchWorkflows, fetchWorkflowById } from '../../api/workflowApi';
import { toast } from 'react-toastify';

export default function StudentContactedIndustriesModal({
  isOpen,
  onClose,
  student,
  onStudentUpdated,
}) {
  const [isAddIndustryOpen, setIsAddIndustryOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(student);

  React.useEffect(() => {
    setCurrentStudent(student);
    if (!isOpen || !student) return;

    let isMounted = true;
    const studentDbId = student.dbId || student.id || student._id;

    const loadAllContacts = async () => {
      let combined = Array.isArray(student.contactedIndustries) ? [...student.contactedIndustries] : [];

      // 1. Fetch fresh student document
      try {
        if (studentDbId) {
          const res = await fetchStudentById(studentDbId);
          if (res?.data && isMounted) {
            const apiContacts = Array.isArray(res.data.contactedIndustries) ? res.data.contactedIndustries : [];
            combined = [...combined, ...apiContacts];
          }
        }
      } catch (_) {}

      // 2. Also check active workflow requests to guarantee 100% sync
      try {
        const wfListRes = await fetchWorkflows();
        const wfList = wfListRes?.data ?? wfListRes ?? [];
        if (Array.isArray(wfList) && wfList.length > 0) {
          const wfId = wfList[0]?.id || wfList[0]?._id;
          if (wfId) {
            const wfRes = await fetchWorkflowById(wfId);
            const wf = wfRes?.data ?? wfRes;
            const norm = v => String(v || '').trim().toLowerCase();
            const studentKeys = [student.id, student.studentId, student.dbId, norm(student.name)].filter(Boolean).map(norm);

            const matchingReqs = (wf?.requests || []).filter(r => {
              const rKeys = [r.id, r.reqId, r._id, r.studentId, norm(r.name), norm(r.student)].filter(Boolean).map(norm);
              return rKeys.some(k => studentKeys.includes(k));
            });
            const wfContacts = matchingReqs.flatMap(r => r.contactedIndustries || []);
            combined = [...combined, ...wfContacts];
          }
        }
      } catch (_) {}

      if (!isMounted) return;

      // Deduplicate all collected contacts by organization name
      const seenOrgs = new Set();
      const deduped = [];
      combined.forEach(c => {
        if (!c) return;
        const org = (c.organizationName || c.name || '').trim().toLowerCase();
        if (org && !seenOrgs.has(org)) {
          seenOrgs.add(org);
          deduped.push(c);
        } else if (!org) {
          deduped.push(c);
        }
      });

      setCurrentStudent(prev => ({
        ...prev,
        contactedIndustries: deduped,
      }));
    };

    loadAllContacts();

    return () => {
      isMounted = false;
    };
  }, [student, isOpen]);

  if (!isOpen || !currentStudent) return null;

  const contactedList = Array.isArray(currentStudent.contactedIndustries)
    ? currentStudent.contactedIndustries
    : [];

  const handleContactAdded = async (contactRecord) => {
    try {
      const studentDbId = currentStudent.dbId || currentStudent.id || currentStudent._id;
      const updatedList = [
        ...contactedList,
        {
          ...contactRecord,
          contactedDate: new Date(),
        },
      ];

      if (studentDbId) {
        await updateStudent(studentDbId, { contactedIndustries: updatedList, placementStatus: 'Industry Contacted' });
        const refreshed = await fetchStudentById(studentDbId);
        if (refreshed?.data) {
          setCurrentStudent(refreshed.data);
          if (onStudentUpdated) onStudentUpdated(refreshed.data);
        }
      }
      try {
        window.dispatchEvent(new CustomEvent('placement_data_changed'));
      } catch (_) {}
      toast.success(`Contact record saved for ${contactRecord.organizationName}`);
    } catch (err) {
      console.error('Failed to link contacted industry:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Contacted Industries History</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {contactedList.length} Contacted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Outreach logs and employer discussions for <span className="font-semibold text-slate-700">{currentStudent.name}</span> ({currentStudent.studentId || currentStudent.id})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAddIndustryOpen(true)}
              className="px-3 py-1.5 bg-[#0147A6] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Industry Contact</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {contactedList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No industries contacted yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No outreach attempts have been logged for this student. Click the button below to record the first contacted industry.
              </p>
              <button
                type="button"
                onClick={() => setIsAddIndustryOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Contact Record</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-4">
              {contactedList.map((contact, index) => {
                const isRejected = (contact.response || '').toLowerCase().includes('reject');
                const isConfirmed = (contact.response || '').toLowerCase().includes('confirm') || (contact.response || '').toLowerCase().includes('approve');
                const dateStr = contact.contactedDate
                  ? new Date(contact.contactedDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';

                return (
                  <div key={contact._id || contact.id || index} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                          <span>{contact.organizationName || 'Organisation Name'}</span>
                          {contact.industryType && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {contact.industryType}
                            </span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          {contact.contactPerson && (
                            <span className="flex items-center space-x-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{contact.contactPerson}</span>
                            </span>
                          )}
                          {contact.email && (
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{contact.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-right">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isRejected
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {contact.response || 'In Discussion'}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Contacted on {dateStr}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Address & Coordinator attribution */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-2">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{[contact.address, contact.suburb, contact.state, contact.postCode].filter(Boolean).join(', ') || 'Address not recorded'}</span>
                      </div>
                      {contact.addedByName && (
                        <div className="text-[10px] text-slate-500 font-medium">
                          Contacted by coordinator: <span className="font-bold text-slate-700">{contact.addedByName}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {contact.notes && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                        "{contact.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs">
          <span className="text-slate-500">Showing {contactedList.length} contacted employer(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded Unified Industry Modal for adding contact record directly from here */}
      <UnifiedIndustryModal
        isOpen={isAddIndustryOpen}
        onClose={() => setIsAddIndustryOpen(false)}
        scopeStudent={{
          id: currentStudent.dbId || currentStudent.id,
          studentId: currentStudent.studentId,
          name: currentStudent.name,
          course: currentStudent.course,
        }}
        onAddContactRecord={handleContactAdded}
      />
    </div>
  );
}
