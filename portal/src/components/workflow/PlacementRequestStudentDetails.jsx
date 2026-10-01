import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, ExternalLink, FileText, User, X } from 'lucide-react';
import { fetchStudentById, updateStudent } from '../../api/studentsApi';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DOCUMENT_FIELDS = [
  ['policeCheckDoc', 'Police Check'],
  ['covidCheckDoc', 'COVID Check'],
  ['ndisDoc', 'NDIS Screening Check'],
  ['resumeDoc', 'Resume'],
  ['wwccDoc', 'Working With Children Check'],
  ['passportDoc', 'Passport'],
  ['drivingLicenceDoc', 'Driving Licence'],
  ['infectionControlDoc', 'Infection Control Certificate'],
  ['handHygieneDoc', 'Hand Hygiene Certificate'],
  ['cprDoc', 'CPR Certificate'],
  ['cbrDoc', 'CBR / CPR Certificate'],
];

// Safely convert any value to a display string
const asText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === 'string') return entry;
      return entry?.name || entry?.label || JSON.stringify(entry);
    }).join(', ');
  }
  if (typeof value === 'object') {
    // Map type from MongoDB — convert to plain object first
    const entries = value instanceof Map ? [...value.entries()] : Object.entries(value);
    return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return String(value);
};

// Convert text back to the correct type for saving
const fromText = (value, originalValue) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return Array.isArray(originalValue) ? [] : '';
  if (!Array.isArray(originalValue)) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return trimmed.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean);
  }
};

const documentLink = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value?.url || value?.file || value?.path || '';
};

const formatHistoryDate = (value) => {
  const dateOnly = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      .toLocaleDateString('en-AU', { dateStyle: 'medium' });
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value || 'Date not recorded')
    : date.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
};

const displayDetail = (value) => {
  if (value === null || value === undefined || value === '') return 'Not specified';
  if (value instanceof Date) return formatHistoryDate(value);
  if (Array.isArray(value)) return value.length ? value.map(entry => typeof entry === 'object' ? (entry?.name || entry?.label || '') : entry).filter(Boolean).join(', ') || 'Not specified' : 'Not specified';
  if (typeof value === 'object') return asText(value) || 'Not specified';
  return String(value);
};

const DAY_MAP = {
  mon: 'Monday', monday: 'Monday',
  tue: 'Tuesday', tuesday: 'Tuesday',
  wed: 'Wednesday', wednesday: 'Wednesday',
  thu: 'Thursday', thursday: 'Thursday',
  fri: 'Friday', friday: 'Friday',
  sat: 'Saturday', saturday: 'Saturday',
  sun: 'Sunday', sunday: 'Sunday',
};

// Safely convert availabilityDays (Map or plain object) to a plain object with canonical day names
const normalizeAvailabilityDays = (value) => {
  if (!value) return {};
  const raw = value instanceof Map ? Object.fromEntries(value.entries()) : (typeof value === 'object' ? value : {});
  const normalized = {};
  Object.entries(raw).forEach(([k, v]) => {
    const canonical = DAY_MAP[String(k).trim().toLowerCase()] || k;
    if (v) normalized[canonical] = true;
  });
  return normalized;
};

// Check if there's any meaningful placement data
const hasPlacementData = (student) => {
  if (!student) return false;
  const hasIndustry = Array.isArray(student.preferredIndustry) ? student.preferredIndustry.length > 0 : Boolean(student.preferredIndustry);
  const hasSite = Array.isArray(student.placementSite) ? student.placementSite.length > 0 : Boolean(student.placementSite);
  const hasHours = student.placementHours !== null && student.placementHours !== undefined && student.placementHours !== '';
  const days = normalizeAvailabilityDays(student.availabilityDays);
  const hasDays = Object.keys(days).length > 0;
  const hasNotes = Boolean(student.placementNotes);
  const hasLicence = Boolean(student.licenceNumber);
  const hasLocation = Boolean(student.preferredLocation);
  return hasIndustry || hasSite || hasHours || hasDays || hasNotes || hasLicence || hasLocation;
};

export default function PlacementRequestStudentDetails({ request, editable, onClose, onSaved, processHistory = null, placementRecord = null }) {
  const [student, setStudent] = useState(request?.studentRecord || null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Try both studentDbId and studentId
  const studentLookupId = request?.studentDbId || request?.studentId;

  // ── Load student from backend ─────────────────────────────────────────────
  useEffect(() => {
    let isCurrent = true;
    const loadStudent = async () => {
      setLoadingStudent(true);
      setLoadError('');
      try {
        if (!studentLookupId) {
          // Fall back to studentRecord if no ID
          if (request?.studentRecord) {
            if (isCurrent) {
              setStudent(request.studentRecord);
              setLoadingStudent(false);
            }
            return;
          }
          throw new Error('Student ID is missing from the placement request.');
        }

        // Try multiple IDs
        const lookupIds = [...new Set([studentLookupId, request?.studentId, request?.studentDbId].filter(Boolean))];
        let record = null;
        for (const lookupId of lookupIds) {
          try {
            const response = await fetchStudentById(lookupId);
            // fetchStudentById returns response.data (axios unwraps HTTP body)
            // Backend sends: { success, message, data: studentObject }
            const fetched = response?.data || response;
            if (fetched && (fetched._id || fetched.id || fetched.studentId)) {
              record = fetched;
              break;
            }
          } catch {
            // try next ID
          }
        }

        if (!record) {
          // Fall back to the pre-loaded studentRecord from the table row
          record = request?.studentRecord || null;
          if (!record) {
            throw new Error('Student record was not found. Showing available data.');
          }
        }

        if (isCurrent) setStudent(record);
      } catch (err) {
        if (isCurrent) {
          setLoadError(err?.response?.data?.message || err.message || 'Could not load student details.');
          // Still show whatever we have from the request
          if (request?.studentRecord) setStudent(request.studentRecord);
        }
      } finally {
        if (isCurrent) setLoadingStudent(false);
      }
    };
    loadStudent();
    return () => { isCurrent = false; };
  }, [studentLookupId]);

  // ── Initialise form whenever student changes ──────────────────────────────
  useEffect(() => {
    const s = student || {};
    const days = normalizeAvailabilityDays(s.availabilityDays);
    setForm({
      preferredIndustry: asText(s.preferredIndustry),
      placementSite: asText(s.placementSite),
      placementHours: s.placementHours != null ? String(s.placementHours) : '',
      preferredLocation: s.preferredLocation || '',
      placementRadius: s.placementRadius || '',
      willingToRelocate: s.willingToRelocate || '',
      availabilityDays: days,
      availabilityFrom: s.availabilityFrom || '',
      availabilityTo: s.availabilityTo || '',
      licenceNumber: s.licenceNumber || '',
      placementNotes: s.placementNotes || '',
      additionalNotes: s.additionalNotes || '',
      ...Object.fromEntries(DOCUMENT_FIELDS.map(([key]) => [key, s[key] || ''])),
    });
  }, [student]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Documents that already have links
  const documents = DOCUMENT_FIELDS
    .map(([key, label]) => ({ key, label, value: student?.[key] }))
    .filter((d) => documentLink(d.value));

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const studentId = student?._id || student?.id || student?.studentId || studentLookupId;
    if (!studentId) {
      setSaveError('Could not identify student record. Please close and try again.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const patch = {
        preferredIndustry: fromText(form.preferredIndustry, student?.preferredIndustry),
        placementSite: fromText(form.placementSite, student?.placementSite),
        placementHours: form.placementHours === '' ? null : Number(form.placementHours),
        preferredLocation: form.preferredLocation,
        placementRadius: form.placementRadius,
        willingToRelocate: form.willingToRelocate,
        availabilityDays: form.availabilityDays,
        availabilityFrom: form.availabilityFrom,
        availabilityTo: form.availabilityTo,
        licenceNumber: form.licenceNumber,
        placementNotes: form.placementNotes,
        additionalNotes: form.additionalNotes,
        ...Object.fromEntries(DOCUMENT_FIELDS.map(([key]) => [key, form[key] || null])),
      };
      await updateStudent(studentId, patch);
      setSaveSuccess(true);
      // Refresh parent data then close
      await onSaved?.();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || 'Could not save placement details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = `w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800
    focus:border-cyan-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500`;

  // Student display name & info from request or loaded student
  const displayName = request?.student || student?.name || student?.firstName
    ? (request?.student || `${student?.firstName || ''} ${student?.lastName || ''}`.trim())
    : 'Student';
  const displayEmail = student?.emailAddress || student?.email || request?.studentEmail || '';
  const displayPhone = student?.phoneNumber || request?.studentPhone || '';
  const displayAddress = [student?.address, student?.suburb, student?.state, student?.postCode]
    .filter(Boolean).join(', ') || request?.studentAddress || '';
  const contactedIndustries = request?.contactedIndustries?.length
    ? request.contactedIndustries
    : (student?.contactedIndustries || []);
  const noPlacementData = !loadingStudent && !hasPlacementData(student);
  const requestChanges = request?.changeHistory || [];
  const requestHistoryEvents = requestChanges.map((entry) => ({
    title: 'Placement Request Updated',
    date: entry.changedAt,
    by: entry.changedBy,
    description: (entry.changes || []).map((change) => {
      const previous = displayDetail(change.from);
      const next = displayDetail(change.to);
      return `${change.field || 'Field'}: ${previous} → ${next}`;
    }).join('\n'),
  }));
  const allProcessHistory = [...requestHistoryEvents, ...(Array.isArray(processHistory) ? processHistory : [])];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <section className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

        {/* ── Header ── */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {editable ? 'Edit Placement Details' : 'Placement Details'}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="font-semibold text-slate-700">{displayName}</span>
              </span>
              {displayEmail && <span>{displayEmail}</span>}
              {displayPhone && <span>{displayPhone}</span>}
              {displayAddress && <span>{displayAddress}</span>}
            </div>
            {placementRecord && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-[11px] text-slate-700">
                <span><strong>Status:</strong> {placementRecord.status || 'Waiting to Join'}</span>
                <span><strong>Industry:</strong> {placementRecord.company || 'Not specified'}</span>
                <span><strong>Commencement:</strong> {placementRecord.start ? formatHistoryDate(placementRecord.start) : 'Not entered'}</span>
                <span><strong>Expected completion:</strong> {placementRecord.end ? formatHistoryDate(placementRecord.end) : 'Not entered'}</span>
                <span><strong>Placement hours:</strong> {student?.placementHours || 'Not specified'}</span>
                <span><strong>Available days:</strong> {Object.entries(form.availabilityDays || {}).filter(([, available]) => available).map(([day]) => day).join(', ') || 'Not specified'}</span>
                <span><strong>Available hours:</strong> {[form.availabilityFrom, form.availabilityTo].filter(Boolean).join(' – ') || 'Not specified'}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-xs">

          {/* Status messages */}
          {loadingStudent && (
            <p className="rounded-lg bg-slate-50 px-3 py-3 text-slate-500 animate-pulse">
              Loading placement details…
            </p>
          )}
          {!loadingStudent && loadError && (
            <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </p>
          )}
          {saveError && (
            <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
              <Check className="h-4 w-4 shrink-0" />
              Placement details saved successfully!
            </p>
          )}
          {!loadingStudent && noPlacementData && !editable && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
              <p className="font-semibold text-slate-600">No placement preferences entered yet.</p>
              <p className="mt-1 text-slate-400">
                Click <strong>Edit Placement Details</strong> (from the Actions menu) to add placement information for this student.
              </p>
            </div>
          )}

          {!loadingStudent && (
            <>
              <section className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <h3 className="font-bold text-slate-800">Placement Request Details</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ['Request ID', request?.reqId || request?.id],
                    ['Request Date', request?.createdAt || request?.date],
                    ['Request Status', request?.status],
                    ['Priority', request?.priority],
                    ['Assigned Coordinator', request?.coordinatorName],
                    ['Coordinator Assignment Date', request?.assignedCoordinatorAt],
                    ['RTO', request?.rto || student?.assignedRto],
                    ['Course / Placement', request?.title || student?.courseQualification],
                    ['Industry', request?.company],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="font-semibold text-slate-500">{label}</p>
                      <p className="mt-1 text-slate-800">{label.toLowerCase().includes('date') && value ? formatHistoryDate(value) : displayDetail(value)}</p>
                    </div>
                  ))}
                  {request?.notes && <div className="sm:col-span-2 lg:col-span-3"><p className="font-semibold text-slate-500">Request Notes</p><p className="mt-1 whitespace-pre-wrap text-slate-800">{request.notes}</p></div>}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-slate-800">Student Information</h3>
                <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ['Student ID', student?.studentId || request?.studentId],
                    ['Full Name', `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.name || request?.student],
                    ['Preferred Name', student?.preferredName],
                    ['Date of Birth', student?.dateOfBirth],
                    ['Gender', student?.gender],
                    ['Email', student?.emailAddress || student?.email || request?.studentEmail],
                    ['Phone', [student?.phoneCode, student?.phoneNumber].filter(Boolean).join(' ') || request?.studentPhone],
                    ['Alternate Phone', [student?.altPhoneCode, student?.alternatePhone].filter(Boolean).join(' ')],
                    ['Address', displayAddress],
                    ['Nationality', student?.nationality],
                    ['Languages', student?.language],
                    ['Course / Qualification', student?.courseQualification],
                    ['Specialisation', student?.specialisation],
                    ['Course Level', student?.courseLevel],
                    ['Study Mode', student?.studyMode],
                    ['Institute', student?.institute],
                    ['Campus', student?.campus],
                    ['Enrolment ID', student?.enrollmentId],
                    ['Attendance Status', student?.attendanceStatus],
                    ['Academic Status', student?.academicStatus],
                    ['Visa Status', student?.visaStatus],
                    ['Work Rights', student?.workRights],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="font-semibold text-slate-500">{label}</p>
                      <p className="mt-1 break-words text-slate-800">{label === 'Date of Birth' && value ? formatHistoryDate(value) : displayDetail(value)}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {placementRecord && (
            <section className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <h3 className="font-bold text-slate-800">Step 4 Placement Dates</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-500">Placement Status</p>
                  <p className="mt-1 text-slate-800">{placementRecord.status || 'Waiting to Join'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Industry</p>
                  <p className="mt-1 text-slate-800">{placementRecord.company || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Commencement / Placement Date</p>
                  <p className="mt-1 text-slate-800">{placementRecord.start ? formatHistoryDate(placementRecord.start) : 'Not entered'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Expected Completion Date</p>
                  <p className="mt-1 text-slate-800">{placementRecord.end ? formatHistoryDate(placementRecord.end) : 'Not entered'}</p>
                </div>
                {(placementRecord._appointmentDate || placementRecord._appointmentTime) && (
                  <div className="sm:col-span-2">
                    <p className="font-semibold text-slate-500">Appointment</p>
                    <p className="mt-1 text-slate-800">{[placementRecord._appointmentDate, placementRecord._appointmentTime].filter(Boolean).join(' at ')}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Placement Preferences ── */}
          <section className="space-y-3">
            <h3 className="font-bold text-slate-800">Placement Preferences</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-600">Preferred Industries</span>
                {editable ? (
                  <textarea
                    rows={3}
                    className={fieldClass}
                    placeholder="e.g. Aged Care, Childcare (one per line or comma-separated)"
                    value={form.preferredIndustry || ''}
                    onChange={(e) => setField('preferredIndustry', e.target.value)}
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 min-h-[48px] whitespace-pre-wrap">
                    {form.preferredIndustry || <span className="text-slate-400">Not specified</span>}
                  </p>
                )}
              </label>
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-600">Preferred Placement Sites</span>
                {editable ? (
                  <textarea
                    rows={3}
                    className={fieldClass}
                    placeholder="e.g. St Vincent's Hospital (one per line)"
                    value={form.placementSite || ''}
                    onChange={(e) => setField('placementSite', e.target.value)}
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 min-h-[48px] whitespace-pre-wrap">
                    {form.placementSite || <span className="text-slate-400">Not specified</span>}
                  </p>
                )}
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-600">Placement Hours</span>
                {editable ? (
                  <input
                    type="number"
                    min="0"
                    className={fieldClass}
                    placeholder="e.g. 120"
                    value={form.placementHours ?? ''}
                    onChange={(e) => setField('placementHours', e.target.value)}
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2">
                    {form.placementHours ? `${form.placementHours} hrs` : <span className="text-slate-400">Not specified</span>}
                  </p>
                )}
              </label>
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-600">Preferred Location</span>
                {editable ? (
                  <input
                    className={fieldClass}
                    placeholder="e.g. Sydney CBD"
                    value={form.preferredLocation || ''}
                    onChange={(e) => setField('preferredLocation', e.target.value)}
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2">
                    {form.preferredLocation || <span className="text-slate-400">Not specified</span>}
                  </p>
                )}
              </label>
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-600">Placement Radius</span>
                {editable ? (
                  <input
                    className={fieldClass}
                    placeholder="e.g. 20km"
                    value={form.placementRadius || ''}
                    onChange={(e) => setField('placementRadius', e.target.value)}
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2">
                    {form.placementRadius || <span className="text-slate-400">Not specified</span>}
                  </p>
                )}
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="font-semibold text-slate-600">Willing to Relocate</span>
              {editable ? (
                <input
                  className={fieldClass}
                  placeholder="Yes / No / Within 50km"
                  value={form.willingToRelocate || ''}
                  onChange={(e) => setField('willingToRelocate', e.target.value)}
                />
              ) : (
                <p className="rounded-lg bg-slate-50 px-3 py-2">
                  {form.willingToRelocate || <span className="text-slate-400">Not specified</span>}
                </p>
              )}
            </label>
          </section>

          {/* ── Availability ── */}
          <section className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-800">Availability</h3>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const checked = Boolean(form.availabilityDays?.[day]);
                if (!editable && !checked) return null;
                return (
                  <label
                    key={day}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs
                      ${editable ? 'cursor-pointer hover:bg-slate-50' : ''}
                      ${checked ? 'border-cyan-300 bg-cyan-50 text-cyan-800 font-semibold' : 'border-slate-200 text-slate-500'}`}
                  >
                    {editable && (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setField('availabilityDays', { ...form.availabilityDays, [day]: e.target.checked })}
                        className="accent-cyan-700"
                      />
                    )}
                    <span>{day}</span>
                  </label>
                );
              })}
              {!editable && !WEEKDAYS.some((d) => Boolean(form.availabilityDays?.[d])) && (
                <p className="text-slate-400">No availability days specified</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-600">Available From</span>
                {editable ? (
                  <input
                    className={fieldClass}
                    placeholder="09:00 AM"
                    value={form.availabilityFrom || ''}
                    onChange={(e) => setField('availabilityFrom', e.target.value)}
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2">
                    {form.availabilityFrom || <span className="text-slate-400">Not specified</span>}
                  </p>
                )}
              </label>
              <label className="space-y-1.5">
                <span className="font-semibold text-slate-600">Available To</span>
                {editable ? (
                  <input
                    className={fieldClass}
                    placeholder="05:00 PM"
                    value={form.availabilityTo || ''}
                    onChange={(e) => setField('availabilityTo', e.target.value)}
                  />
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2">
                    {form.availabilityTo || <span className="text-slate-400">Not specified</span>}
                  </p>
                )}
              </label>
            </div>
          </section>

          {/* ── Driving Licence ── */}
          <section className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-800">Driving Licence</h3>
            <label className="block space-y-1.5">
              <span className="font-semibold text-slate-600">Licence Number</span>
              {editable ? (
                <input
                  className={fieldClass}
                  placeholder="Licence number"
                  value={form.licenceNumber || ''}
                  onChange={(e) => setField('licenceNumber', e.target.value)}
                />
              ) : (
                <p className="rounded-lg bg-slate-50 px-3 py-2">
                  {form.licenceNumber || <span className="text-slate-400">Not specified</span>}
                </p>
              )}
            </label>
          </section>

          {/* ── Documents ── */}
          <section className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-800">Documents</h3>
            {editable ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {DOCUMENT_FIELDS.map(([key, label]) => (
                  <label key={key} className="space-y-1.5">
                    <span className="font-semibold text-slate-600">{label} (link/URL)</span>
                    <input
                      className={fieldClass}
                      placeholder="https://..."
                      value={form[key] || ''}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            ) : (
              documents.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {documents.map(({ key, label, value }) => {
                    const href = documentLink(value);
                    return (
                      <li key={key} className="flex min-w-0 items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
                        <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="truncate">{label}</span>
                        {href && (
                          <a
                            className="ml-auto text-cyan-700 hover:underline"
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${label}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-slate-400">No documents attached.</p>
              )
            )}
          </section>

          {/* ── Contacted Industries (from request, not student) ── */}
          <section className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-800">Contacted Industries</h3>
            {contactedIndustries.length > 0 ? (
              contactedIndustries.map((industry, idx) => (
                <article key={industry.id || idx} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-bold text-slate-800">{industry.organizationName || 'Industry'}</p>
                  <p className="mt-1 text-slate-600">
                    {[industry.industryType, industry.contactPerson].filter(Boolean).join(' · ') || 'Details not specified'}
                  </p>
                  {(industry.email || industry.phone) && (
                    <p className="mt-1 text-slate-600">{[industry.email, industry.phone].filter(Boolean).join(' · ')}</p>
                  )}
                  {[industry.address, industry.suburb, industry.state, industry.postCode, industry.country].some(Boolean) && (
                    <p className="mt-1 text-slate-600">
                      {[industry.address, industry.suburb, industry.state, industry.postCode, industry.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="mt-1 text-slate-500">Response: {industry.response || 'Industry Contacted'}</p>
                  {industry.notes && (
                    <p className="mt-1 whitespace-pre-wrap text-slate-600">{industry.notes}</p>
                  )}
                  {industry.addedByName && (
                    <p className="mt-1 text-slate-400 text-[10px]">Added by {industry.addedByName}</p>
                  )}
                </article>
              ))
            ) : (
              <p className="text-slate-400">No contacted industries recorded yet.</p>
            )}
          </section>

          {(Array.isArray(processHistory) || requestChanges.length > 0) && (
            <section className="space-y-3 border-t border-slate-100 pt-4">
              <h3 className="font-bold text-slate-800">Placement Request Change History</h3>
              {allProcessHistory.length > 0 ? (
                <ol className="space-y-3">
                  {allProcessHistory.map((event, index) => (
                    <li key={`${event.title}-${event.date || 'undated'}-${index}`} className="relative flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-600 ring-4 ring-cyan-50" />
                      <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="font-semibold text-slate-800">{event.title}</p>
                          <time className="text-[10px] text-slate-500">
                            {event.date ? formatHistoryDate(event.date) : 'Date not recorded'}
                          </time>
                        </div>
                        {event.description && <p className="mt-1 whitespace-pre-wrap text-slate-600">{event.description}</p>}
                        {event.by && <p className="mt-1 text-[10px] text-slate-400">By {event.by}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-slate-400">No process history has been recorded yet.</p>
              )}
            </section>
          )}

          {/* ── Placement Notes ── */}
          <section className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-800">Placement Notes</h3>
            {editable ? (
              <>
                <label className="block space-y-1.5">
                  <span className="font-semibold text-slate-600">Placement Notes</span>
                  <textarea
                    rows={4}
                    className={fieldClass}
                    placeholder="Notes about placement requirements, special considerations, etc."
                    value={form.placementNotes || ''}
                    onChange={(e) => setField('placementNotes', e.target.value)}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="font-semibold text-slate-600">Additional Notes</span>
                  <textarea
                    rows={3}
                    className={fieldClass}
                    placeholder="Any other relevant notes"
                    value={form.additionalNotes || ''}
                    onChange={(e) => setField('additionalNotes', e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                {form.placementNotes ? (
                  <p className="whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-slate-700">{form.placementNotes}</p>
                ) : (
                  <p className="text-slate-400">No placement notes added.</p>
                )}
                {student?.additionalNotes && (
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">{student.additionalNotes}</p>
                )}
              </>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
          <div className="text-xs text-slate-400">
            {editable && '* Changes apply to placement fields only. Personal info is editable in Step 1.'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {editable ? 'Cancel' : 'Close'}
            </button>
            {editable && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" />
                {saving ? 'Saving…' : 'Save Placement Details'}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
