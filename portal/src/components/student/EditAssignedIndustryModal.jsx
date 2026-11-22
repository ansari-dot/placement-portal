import React, { useState, useEffect } from 'react';
import { X, Building2, Calendar, MapPin, User, Mail, Phone, Loader2 } from 'lucide-react';
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

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (isOpen && student) {
      const site = (Array.isArray(student.placementSite) ? student.placementSite[0] : student.placementSite) ||
        (Array.isArray(student.preferredIndustry) ? student.preferredIndustry[0] : student.preferredIndustry) ||
        PLACEMENT_SITES[0];
      const validSite = PLACEMENT_SITES.includes(site) ? site : PLACEMENT_SITES[0];
      setPlacementSite(validSite);

      const availableTypes = INDUSTRY_TYPES_BY_SITE[validSite] || [];
      const currentType = student.industryType || student.preferredIndustryType || availableTypes[0] || '';
      setIndustryType(currentType);

      // Check if student has assigned industry in active placement or contacted industries
      const latestContact = Array.isArray(student.contactedIndustries) && student.contactedIndustries.length > 0
        ? student.contactedIndustries[student.contactedIndustries.length - 1]
        : null;

      setFormData({
        industryName: student.assignedIndustry || student.company || latestContact?.organizationName || '',
        contactPerson: student.industryContactPerson || latestContact?.contactPerson || '',
        contactEmail: student.industryContactEmail || latestContact?.email || '',
        contactPhone: student.industryContactPhone || latestContact?.phone || '',
        address: student.industryAddress || latestContact?.address || '',
        suburb: student.industrySuburb || latestContact?.suburb || student.suburb || '',
        state: student.industryState || latestContact?.state || student.state || 'VIC',
        postCode: student.industryPostCode || latestContact?.postCode || student.postCode || '',
        commencementDate: student.commencementDate || student.placementStart || '',
        notes: student.placementNotes || '',
      });
    }
  }, [isOpen, student]);

  const handlePlacementSiteChange = (site) => {
    setPlacementSite(site);
    const availableTypes = INDUSTRY_TYPES_BY_SITE[site] || [];
    setIndustryType(availableTypes[0] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.industryName.trim()) {
      toast.error('Industry Name is required');
      return;
    }

    setLoading(true);
    try {
      const studentDbId = student.dbId || student.id || student._id;

      const updatedPayload = {
        assignedIndustry: formData.industryName.trim(),
        placementSite: [placementSite],
        preferredIndustry: placementSite,
        industryType,
        industryContactPerson: formData.contactPerson.trim(),
        industryContactEmail: formData.contactEmail.trim(),
        industryContactPhone: formData.contactPhone.trim(),
        industryAddress: formData.address.trim(),
        industrySuburb: formData.suburb.trim(),
        industryState: formData.state,
        industryPostCode: formData.postCode.trim(),
        commencementDate: formData.commencementDate,
        placementNotes: formData.notes.trim(),
      };

      if (studentDbId) {
        await updateStudent(studentDbId, updatedPayload);
      }

      // Also propagate changes to any active workflow internship request or record
      try {
        const wfRes = await fetchWorkflows();
        const activeWorkflow = (wfRes?.data || []).find((w) => w.status === 'Active') || (wfRes?.data || [])[0];
        if (activeWorkflow?._id) {
          const req = (activeWorkflow.requests || []).find(
            (r) => (r.studentId && r.studentId === (student.studentId || student.id)) || (r.student && r.student === student.name)
          );
          if (req?._id || req?.reqId) {
            await updateInternshipRequest(activeWorkflow._id, req._id || req.reqId, {
              company: formData.industryName.trim(),
              industryType,
              location: [formData.suburb, formData.state].filter(Boolean).join(', '),
            });
          }
        }
      } catch (wfErr) {
        console.warn('Could not propagate industry update to workflow request:', wfErr.message);
      }

      toast.success(`Assigned industry updated for ${student.name || 'student'}`);
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Assigned Industry</h3>
              <p className="text-[11px] text-slate-500">
                Updating assigned placement information for <span className="font-semibold text-slate-700">{student.name}</span> ({student.studentId || student.id})
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Placement Site & Dynamic Industry Type */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Placement Site <span className="text-rose-500">*</span>
              </label>
              <select
                value={placementSite}
                onChange={(e) => handlePlacementSiteChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
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
                placeholder="e.g. 03 9123 4567"
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
                type="email"
                placeholder="manager@facility.com.au"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Commencement Date</label>
              <input
                type="date"
                value={formData.commencementDate}
                onChange={(e) => setFormData({ ...formData, commencementDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
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
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
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
                value={formData.postCode}
                onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0147A6] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Saving Changes...' : 'Save Assigned Industry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
