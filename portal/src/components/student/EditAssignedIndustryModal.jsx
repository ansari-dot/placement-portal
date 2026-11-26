import React, { useState, useEffect, useMemo } from 'react';
import { X, Building2, Calendar, MapPin, User, Mail, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateStudent } from '../../api/studentsApi';
import { fetchWorkflows, updateInternshipRequest } from '../../api/workflowApi';
import {
  PLACEMENT_SITES,
  INDUSTRY_TYPES_BY_SITE,
  AUSTRALIAN_STATES
} from '../../constants/industryTaxonomy';

export default function EditAssignedIndustryModal({
  isOpen,
  onClose,
  student,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [placementSite, setPlacementSite] = useState(PLACEMENT_SITES[0]);
  const [industryType, setIndustryType] = useState(INDUSTRY_TYPES_BY_SITE[PLACEMENT_SITES[0]][0]);
  const [selectedIndustryIndex, setSelectedIndustryIndex] = useState(0);

  const [formData, setFormData] = useState({
    originalName: '',
    targetId: '',
    industryName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    suburb: '',
    state: 'VIC',
    postCode: '',
    commencementDate: '',
    notes: '',
  });

  // ─── Compile all distinct industries linked to this student ─────────────
  const availableIndustries = useMemo(() => {
    if (!student) return [];
    const list = [];
    const seenNames = new Set();

    // 1. Records from contactedIndustries
    if (Array.isArray(student.contactedIndustries)) {
      student.contactedIndustries.forEach((c, idx) => {
        if (!c) return;
        const name = (c.organizationName || c.name || c.company || '').trim();
        const normKey = name.toLowerCase();
        if (normKey && !seenNames.has(normKey)) {
          seenNames.add(normKey);
          list.push({
            id: c._id || c.id || `contact-${idx}`,
            _id: c._id || c.id,
            organizationName: name,
            contactPerson: c.contactPerson || c.contactPersonName || '',
            email: c.email || c.contactEmail || '',
            phone: c.phone || c.contactPhone || '',
            address: c.address || '',
            suburb: c.suburb || '',
            state: c.state || 'VIC',
            postCode: c.postCode || '',
            placementSite: c.placementSite || (Array.isArray(student.placementSite) ? student.placementSite[0] : student.placementSite) || 'Aged Care',
            industryType: c.industryType || student.industryType || '',
            notes: c.notes || '',
            isAssigned: name === (student.assignedIndustry || student.company),
            source: 'contacted',
          });
        }
      });
    }

    // 2. Explicit top-level assignedIndustry or company on student doc
    const topAssigned = (student.assignedIndustry || student.company || '').trim();
    if (topAssigned && !seenNames.has(topAssigned.toLowerCase())) {
      seenNames.add(topAssigned.toLowerCase());
      list.unshift({
        id: 'top-assigned',
        organizationName: topAssigned,
        contactPerson: student.industryContactPerson || '',
        email: student.industryContactEmail || '',
        phone: student.industryContactPhone || '',
        address: student.industryAddress || '',
        suburb: student.industrySuburb || student.suburb || '',
        state: student.industryState || student.state || 'VIC',
        postCode: student.industryPostCode || student.postCode || '',
        placementSite: (Array.isArray(student.placementSite) ? student.placementSite[0] : student.placementSite) || 'Aged Care',
        industryType: student.industryType || '',
        notes: student.placementNotes || '',
        isAssigned: true,
        source: 'assigned',
      });
    }

    return list;
  }, [student]);

  // ─── Populate form fields from a specific industry object ────────────────
  const populateForIndustry = (ind) => {
    if (!ind) return;
    const site = ind.placementSite || (Array.isArray(student?.placementSite) ? student?.placementSite[0] : student?.placementSite) || PLACEMENT_SITES[0];
    const validSite = PLACEMENT_SITES.includes(site) ? site : PLACEMENT_SITES[0];
    setPlacementSite(validSite);

    const availableTypes = INDUSTRY_TYPES_BY_SITE[validSite] || [];
    const currentType = ind.industryType || availableTypes[0] || '';
    setIndustryType(currentType);

    setFormData({
      originalName: ind.organizationName || '',
      targetId: ind._id || ind.id || '',
      industryName: ind.organizationName || '',
      contactPerson: ind.contactPerson || '',
      contactEmail: ind.email || '',
      contactPhone: ind.phone || '',
      address: ind.address || '',
      suburb: ind.suburb || student?.suburb || '',
      state: ind.state || student?.state || 'VIC',
      postCode: ind.postCode || student?.postCode || '',
      commencementDate: student?.commencementDate || student?.placementStart || '',
      notes: ind.notes || student?.placementNotes || '',
    });
  };

  useEffect(() => {
    if (isOpen && student) {
      if (availableIndustries.length > 0) {
        const assignedIdx = availableIndustries.findIndex(i => i.isAssigned);
        const initialIdx = assignedIdx >= 0 ? assignedIdx : 0;
        setSelectedIndustryIndex(initialIdx);
        populateForIndustry(availableIndustries[initialIdx]);
      } else {
        // Fallback if student has no recorded industries yet
        const site = (Array.isArray(student.placementSite) ? student.placementSite[0] : student.placementSite) || PLACEMENT_SITES[0];
        const validSite = PLACEMENT_SITES.includes(site) ? site : PLACEMENT_SITES[0];
        setPlacementSite(validSite);
        const availableTypes = INDUSTRY_TYPES_BY_SITE[validSite] || [];
        setIndustryType(availableTypes[0] || '');
        setFormData({
          originalName: '',
          targetId: '',
          industryName: '',
          contactPerson: '',
          contactEmail: '',
          contactPhone: '',
          address: '',
          suburb: student.suburb || '',
          state: student.state || 'VIC',
          postCode: student.postCode || '',
          commencementDate: student.commencementDate || student.placementStart || '',
          notes: student.placementNotes || '',
        });
      }
    }
  }, [isOpen, student, availableIndustries]);

  const handleSelectIndustry = (index) => {
    setSelectedIndustryIndex(index);
    populateForIndustry(availableIndustries[index]);
  };

  const handlePlacementSiteChange = (site) => {
    setPlacementSite(site);
    const availableTypes = INDUSTRY_TYPES_BY_SITE[site] || [];
    setIndustryType(availableTypes[0] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.industryName.trim();
    if (!trimmedName) {
      toast.error('Industry Name is required');
      return;
    }

    const trimmedEmail = formData.contactEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const studentDbId = student.dbId || student.id || student._id;

      // Update the specific record inside student's contactedIndustries list
      const targetOriginalName = (formData.originalName || '').trim().toLowerCase();
      const currentContacts = Array.isArray(student.contactedIndustries) ? [...student.contactedIndustries] : [];
      let foundInContacts = false;

      const updatedContacts = currentContacts.map((c) => {
        const cName = (c.organizationName || c.name || '').trim().toLowerCase();
        const cId = String(c._id || c.id || '');
        if ((formData.targetId && cId === String(formData.targetId)) || (targetOriginalName && cName === targetOriginalName)) {
          foundInContacts = true;
          return {
            ...c,
            organizationName: trimmedName,
            contactPerson: formData.contactPerson.trim(),
            email: trimmedEmail,
            phone: formData.contactPhone.trim(),
            address: formData.address.trim(),
            suburb: formData.suburb.trim(),
            state: formData.state,
            postCode: formData.postCode.trim(),
            placementSite,
            industryType,
            notes: formData.notes.trim(),
          };
        }
        return c;
      });

      if (!foundInContacts && trimmedName) {
        updatedContacts.push({
          organizationName: trimmedName,
          contactPerson: formData.contactPerson.trim(),
          email: trimmedEmail,
          phone: formData.contactPhone.trim(),
          address: formData.address.trim(),
          suburb: formData.suburb.trim(),
          state: formData.state,
          postCode: formData.postCode.trim(),
          placementSite,
          industryType,
          notes: formData.notes.trim(),
          response: 'In Discussion',
          contactedDate: new Date(),
        });
      }

      const updatedPayload = {
        assignedIndustry: trimmedName,
        company: trimmedName,
        placementSite: [placementSite],
        preferredIndustry: placementSite,
        industryType,
        industryContactPerson: formData.contactPerson.trim(),
        industryContactEmail: trimmedEmail,
        industryContactPhone: formData.contactPhone.trim(),
        industryAddress: formData.address.trim(),
        industrySuburb: formData.suburb.trim(),
        industryState: formData.state,
        industryPostCode: formData.postCode.trim(),
        commencementDate: formData.commencementDate,
        placementNotes: formData.notes.trim(),
        contactedIndustries: updatedContacts,
      };

      if (studentDbId) {
        await updateStudent(studentDbId, updatedPayload);
      }

      // Propagate changes to matching workflow request
      try {
        const wfRes = await fetchWorkflows();
        const activeWorkflow = (wfRes?.data || []).find((w) => w.status === 'Active') || (wfRes?.data || [])[0];
        if (activeWorkflow?._id) {
          const norm = v => String(v || '').trim().toLowerCase();
          const studentKeys = [student.id, student.studentId, studentDbId, norm(student.name)].filter(Boolean).map(norm);
          const req = (activeWorkflow.requests || []).find((r) => {
            const rKeys = [r.id, r.reqId, r._id, r.studentId, norm(r.name), norm(r.student)].filter(Boolean).map(norm);
            return rKeys.some(k => studentKeys.includes(k));
          });
          if (req?._id || req?.reqId) {
            await updateInternshipRequest(activeWorkflow._id, req._id || req.reqId, {
              company: trimmedName,
              industryType,
              location: [formData.suburb, formData.state].filter(Boolean).join(', '),
            });
          }
        }
      } catch (wfErr) {
        console.warn('Could not propagate industry update to workflow request:', wfErr.message);
      }

      try {
        window.dispatchEvent(new CustomEvent('placement_data_changed'));
      } catch (_) {}

      toast.success(`Industry "${trimmedName}" updated for ${student.name || 'student'}`);
      if (onSaved) onSaved(updatedPayload);
      onClose();
    } catch (err) {
      console.error('Failed to update assigned industry:', err);
      toast.error(err?.response?.data?.message || 'Failed to update assigned industry.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Industry</h3>
              <p className="text-[11px] text-slate-500">
                Placement employer information for <span className="font-semibold text-slate-700">{student.name}</span> ({student.studentId || student.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">

          {/* ─── Multi-Industry Selector Pill Bar (when student has 2+ industries) ─── */}
          {availableIndustries.length > 1 && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Industry to Edit ({availableIndustries.length} linked)</span>
                </label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Click to switch
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableIndustries.map((ind, idx) => {
                  const isSelected = selectedIndustryIndex === idx;
                  return (
                    <button
                      key={ind.id || ind._id || idx}
                      type="button"
                      onClick={() => handleSelectIndustry(idx)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#0147A6] text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {ind.organizationName}
                          </p>
                          {ind.isAssigned && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                              isSelected ? 'bg-blue-800 text-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              Assigned
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {ind.contactPerson ? `${ind.contactPerson} • ` : ''}{ind.email || ind.phone || 'No direct contact'}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Placement Site & Dynamic Industry Type */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Placement Site <span className="text-rose-500">*</span>
              </label>
              <select
                value={placementSite}
                onChange={(e) => handlePlacementSiteChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {PLACEMENT_SITES.map((site) => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Industry Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {(INDUSTRY_TYPES_BY_SITE[placementSite] || []).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Industry Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Industry / Facility Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Regis Aged Care Facility"
              value={formData.industryName}
              onChange={(e) => setFormData({ ...formData, industryName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              required
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="Supervisor / Manager Name"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. 03 9123 4567 or 0411 222 333"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Email</label>
              <input
                type="text"
                inputMode="email"
                placeholder="manager@facility.com.au"
                value={formData.contactEmail}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFF0D]/g, '-')
                    .replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, '');
                  setFormData({ ...formData, contactEmail: val });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Commencement Date</label>
              <input
                type="date"
                value={formData.commencementDate}
                onChange={(e) => setFormData({ ...formData, commencementDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Address</label>
            <input
              type="text"
              placeholder="Street address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">City / Suburb</label>
              <input
                type="text"
                placeholder="Suburb"
                value={formData.suburb}
                onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">State</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
              >
                {AUSTRALIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Postcode</label>
              <input
                type="text"
                placeholder="e.g. 3000"
                value={formData.postCode}
                onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Placement Notes</label>
            <textarea
              rows={2}
              placeholder="Any special notes or requirements..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0147A6] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Saving Changes...' : 'Save Industry Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
