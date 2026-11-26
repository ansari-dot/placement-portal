import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  X, Building2, User, Mail, Phone, MapPin, Upload, FileText,
  Plus, Trash2, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { createIndustry } from '../../api/industryApi';
import { fetchUsers } from '../../api/userApi';
import {
  PLACEMENT_SITES,
  INDUSTRY_TYPES_BY_SITE,
  INDUSTRY_CATEGORIES,
  AUSTRALIAN_STATES
} from '../../constants/industryTaxonomy';

export default function UnifiedIndustryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'Random',
  scopeStudent = null, // Optional: { id, studentId, name, course }
  onAddContactRecord = null, // Optional callback to also link contact to workflow request
}) {
  const authUser = useSelector((state) => state.auth?.user);

  const [category, setCategory] = useState(defaultCategory);
  const [placementSite, setPlacementSite] = useState(PLACEMENT_SITES[0]);
  const [industryType, setIndustryType] = useState(INDUSTRY_TYPES_BY_SITE[PLACEMENT_SITES[0]][0]);

  const [formData, setFormData] = useState({
    industryName: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    contactJobTitle: '',
    address: '',
    suburb: '',
    state: 'VIC',
    postCode: '',
    country: 'Australia',
    partnershipInfo: '',
    onboardedByName: authUser?.name || '',
    onboardedBy: authUser?._id || '',
    notes: '',
  });

  const [documents, setDocuments] = useState([]); // Array of { name: '', file: null, fileName: '', size: '' }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setPlacementSite(PLACEMENT_SITES[0]);
      setIndustryType(INDUSTRY_TYPES_BY_SITE[PLACEMENT_SITES[0]][0]);
      setFormData({
        industryName: '',
        contactPersonName: '',
        contactEmail: '',
        contactPhone: '',
        contactJobTitle: '',
        address: '',
        suburb: '',
        state: 'VIC',
        postCode: '',
        country: 'Australia',
        partnershipInfo: '',
        onboardedByName: authUser?.name || '',
        onboardedBy: authUser?._id || '',
        notes: '',
      });
      setDocuments([]);
      setErrors({});

      // Load portal users for Onboarded By selection
      fetchUsers()
        .then((res) => {
          const list = res?.data || res?.users || (Array.isArray(res) ? res : []);
          setUsers(list.filter(u => ['Administrator', 'Coordinator', 'Staff'].includes(u.role)));
        })
        .catch(() => {});
    }
  }, [isOpen, defaultCategory, authUser]);

  // When placement site changes, update industry type choices and pick first option
  const handlePlacementSiteChange = (site) => {
    setPlacementSite(site);
    const availableTypes = INDUSTRY_TYPES_BY_SITE[site] || [];
    setIndustryType(availableTypes[0] || '');
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Document management for Partner Industry
  const handleAddDocumentSlot = () => {
    setDocuments((prev) => [
      ...prev,
      { name: '', file: null, fileName: '', size: '', uploadDate: new Date().toLocaleDateString() },
    ]);
  };

  const handleDocumentNameChange = (index, name) => {
    setDocuments((prev) => {
      const updated = [...prev];
      updated[index].name = name;
      return updated;
    });
  };

  const handleDocumentFileChange = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocuments((prev) => {
        const updated = [...prev];
        updated[index].file = reader.result;
        updated[index].fileName = file.name;
        if (!updated[index].name) {
          // Default name to file name without extension
          updated[index].name = file.name.replace(/\.[^/.]+$/, '');
        }
        updated[index].size = `${(file.size / 1024).toFixed(1)} KB`;
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!formData.industryName.trim()) errs.industryName = 'Industry Name is required';
    if (!placementSite) errs.placementSite = 'Placement Site is required';
    if (!industryType) errs.industryType = 'Industry Type is required';
    if (!formData.contactPersonName.trim()) errs.contactPersonName = 'Contact Person Name is required';
    if (!formData.contactEmail.trim()) {
      errs.contactEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail.trim())) {
      errs.contactEmail = 'Valid email is required';
    }
    if (!formData.contactPhone.trim()) errs.contactPhone = 'Phone Number is required';
    if (!formData.address.trim()) errs.address = 'Street Address is required';

    if (category === 'Partner') {
      if (!formData.suburb.trim()) errs.suburb = 'City / Suburb is required for Partner Industry';
      if (!formData.postCode.trim()) errs.postCode = 'Postcode is required for Partner Industry';
      if (!formData.onboardedByName.trim() && !formData.onboardedBy) {
        errs.onboardedBy = 'Onboarded By is required for Partner Industry';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        industryName: formData.industryName.trim(),
        placementSite,
        industryType,
        sector: placementSite,
        contactPersonName: formData.contactPersonName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactJobTitle: formData.contactJobTitle.trim(),
        address: formData.address.trim(),
        suburb: formData.suburb.trim(),
        state: formData.state,
        postCode: formData.postCode.trim(),
        country: formData.country || 'Australia',
        shortDescription: formData.notes.trim(),
        industryCategory: category,
        onboardedByName: category === 'Partner' ? formData.onboardedByName.trim() : '',
        onboardedBy: category === 'Partner' && formData.onboardedBy ? formData.onboardedBy : null,
        partnershipInfo: category === 'Partner' ? formData.partnershipInfo.trim() : '',
        documents: category === 'Partner' ? documents : [],
      };

      const result = await createIndustry(payload);

      // If student is attached and an onAddContactRecord callback is provided, link this industry as a contact record
      if (scopeStudent && onAddContactRecord) {
        await onAddContactRecord({
          organizationName: formData.industryName.trim(),
          contactPerson: formData.contactPersonName.trim(),
          email: formData.contactEmail.trim(),
          phone: formData.contactPhone.trim(),
          industryType,
          address: formData.address.trim(),
          suburb: formData.suburb.trim(),
          state: formData.state,
          postCode: formData.postCode.trim(),
          notes: formData.notes.trim(),
          response: 'In Discussion',
        });
      }

      toast.success(`${category} Industry "${formData.industryName}" added successfully!`);

      if (onSuccess) {
        onSuccess(result?.data || result || payload);
      }

      // Automatically close modal upon successful addition
      onClose();
    } catch (err) {
      console.error('Failed to create industry:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save industry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {scopeStudent ? `Add Industry for ${scopeStudent.name}` : 'Add Industry'}
              </h3>
              <p className="text-xs text-slate-500">
                {scopeStudent
                  ? `Assign a placement industry contact for student ${scopeStudent.studentId || ''}`
                  : 'Standardized Industry Partner & Random Directory Creation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* 1. Category Switcher (Random vs Partner) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Industry Classification <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategory('Random')}
                className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                  category === 'Random'
                    ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🏢 Random Industry</span>
                {category === 'Random' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setCategory('Partner')}
                className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                  category === 'Partner'
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🤝 Partner Industry (Formal MOU)</span>
                {category === 'Partner' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>
          </div>

          {/* 2. Placement Site & Dynamic Industry Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Placement Site <span className="text-rose-500">*</span>
              </label>
              <select
                value={placementSite}
                onChange={(e) => handlePlacementSiteChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {PLACEMENT_SITES.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Select placement site domain</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Industry Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {(INDUSTRY_TYPES_BY_SITE[placementSite] || []).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Changes dynamically with Placement Site</p>
            </div>
          </div>

          {/* 3. Industry Name & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Industry / Organisation Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aegis Aged Care Facility"
                value={formData.industryName}
                onChange={(e) => handleInputChange('industryName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${
                  errors.industryName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.industryName && <p className="text-[10px] text-rose-500 mt-0.5">{errors.industryName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.contactPersonName}
                onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${
                  errors.contactPersonName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.contactPersonName && <p className="text-[10px] text-rose-500 mt-0.5">{errors.contactPersonName}</p>}
            </div>
          </div>

          {/* 4. Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="contact@organisation.com.au"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${
                  errors.contactEmail ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.contactEmail && <p className="text-[10px] text-rose-500 mt-0.5">{errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 0412 345 678 or 03 9123 4567"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${
                  errors.contactPhone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.contactPhone && <p className="text-[10px] text-rose-500 mt-0.5">{errors.contactPhone}</p>}
            </div>
          </div>

          {/* 5. Address Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Street Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 124 Main Street, Suite 3"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${
                errors.address ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
            />
            {errors.address && <p className="text-[10px] text-rose-500 mt-0.5">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / Suburb {category === 'Partner' && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Melbourne"
                value={formData.suburb}
                onChange={(e) => handleInputChange('suburb', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${
                  errors.suburb ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.suburb && <p className="text-[10px] text-rose-500 mt-0.5">{errors.suburb}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State / Territory <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {AUSTRALIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Postcode {category === 'Partner' && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. 3000"
                value={formData.postCode}
                onChange={(e) => handleInputChange('postCode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 ${
                  errors.postCode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.postCode && <p className="text-[10px] text-rose-500 mt-0.5">{errors.postCode}</p>}
            </div>
          </div>

          {/* 6. Partner Industry Specific Section */}
          {category === 'Partner' && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-4">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Partner Industry Details & Documents</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Onboarded By (Portal User) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.onboardedBy}
                    onChange={(e) => {
                      const u = users.find((x) => x._id === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        onboardedBy: e.target.value,
                        onboardedByName: u ? u.name : prev.onboardedByName,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Coordinator / Admin</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                  {errors.onboardedBy && <p className="text-[10px] text-rose-500 mt-0.5">{errors.onboardedBy}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MOU / Partnership Info
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2-Year Placement Partnership Agreement"
                    value={formData.partnershipInfo}
                    onChange={(e) => handleInputChange('partnershipInfo', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Multi-Document Upload with Custom Document Naming */}
              <div className="space-y-3 pt-2 border-t border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Partner Documents</h5>
                    <p className="text-[10px] text-slate-500">Upload one or more documents with document titles (e.g. MOU, Agreement)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDocumentSlot}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Document</span>
                  </button>
                </div>

                {documents.length === 0 ? (
                  <div className="p-3 bg-white border border-dashed border-indigo-200 rounded-xl text-center text-slate-400 text-xs">
                    No documents attached yet. Click "Add Document" to upload MOU agreements or contracts.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Document Name / Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Placement MOU 2026, Insurance Certificate"
                            value={doc.name}
                            onChange={(e) => handleDocumentNameChange(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="w-full sm:w-auto">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Choose File
                          </label>
                          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>{doc.fileName ? 'Change File' : 'Browse File'}</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleDocumentFileChange(idx, e.target.files?.[0])}
                            />
                          </label>
                        </div>

                        {doc.fileName && (
                          <div className="text-[11px] text-slate-600 truncate max-w-xs">
                            <span className="font-semibold text-indigo-700">{doc.fileName}</span>
                            {doc.size && <span className="text-slate-400 ml-1.5">({doc.size})</span>}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer self-end sm:self-center"
                          title="Remove document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Enter any additional contact notes, supervisor details, or placement terms..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#0147A6] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Saving...' : `Add ${category} Industry`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
