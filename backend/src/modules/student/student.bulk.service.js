import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import StudentModel from './student.model.js';
import RtoModel from '../rto/rto.model.js';
import NotificationModel from '../notification/notification.model.js';
import { StudentService } from './student.service.js';
import { studentSchema } from './student.dto.js';
import { BadRequestError } from '../../core/errors/AppError.js';

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

/* ------------------------------------------------------------------ */
/*  Column definitions — single source of truth for template + parser  */
/*  type: string | date | number | days | list                          */
/* ------------------------------------------------------------------ */
export const BULK_COLUMNS = [
  // Personal
  { key: 'firstName', label: 'First Name', required: true, example: 'John' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'lastName', label: 'Last Name', required: true, example: 'Smith' },
  { key: 'preferredName', label: 'Preferred Name' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', example: '15/04/2000' },
  { key: 'gender', label: 'Gender', example: 'Male', hint: 'Male / Female / Other' },
  { key: 'nationality', label: 'Nationality', example: 'Australian' },
  { key: 'language', label: 'Language', example: 'English' },
  { key: 'emailAddress', label: 'Email Address', required: true, example: 'john.smith@example.com' },
  { key: 'phoneCode', label: 'Phone Code', example: '+61' },
  { key: 'phoneNumber', label: 'Phone Number', required: true, example: '412345678' },
  { key: 'altPhoneCode', label: 'Alternate Phone Code' },
  { key: 'alternatePhone', label: 'Alternate Phone' },
  { key: 'waPhoneCode', label: 'WhatsApp Code' },
  { key: 'whatsappNumber', label: 'WhatsApp Number' },
  { key: 'address', label: 'Address', example: '12 George St' },
  { key: 'suburb', label: 'Suburb', example: 'Parramatta' },
  { key: 'state', label: 'State', example: 'NSW', hint: 'ACT/NSW/NT/QLD/SA/TAS/VIC/WA' },
  { key: 'postCode', label: 'Post Code', example: '2150' },
  { key: 'country', label: 'Country', example: 'Australia' },

  // Education / classification
  { key: 'studentId', label: 'Student ID', hint: 'Leave blank to auto-generate' },
  { key: 'studentType', label: 'Student Type', example: 'RTO Student', hint: 'RTO Student / Independent Student / Awaiting RTO Assignment' },
  { key: 'assignedRto', label: 'RTO / College', example: '' },
  { key: 'independentFee', label: 'Independent Fee', type: 'number', hint: 'Required for Independent Student' },
  { key: 'courseQualification', label: 'Course / Qualification', required: true, example: 'Individual Support' },
  { key: 'courseLevel', label: 'Certificate Level', example: 'Certificate III' },
  { key: 'specialisation', label: 'Specialisation' },
  { key: 'studyMode', label: 'Study Mode' },
  { key: 'enrollmentId', label: 'Enrollment ID' },
  { key: 'institute', label: 'Institute' },
  { key: 'campus', label: 'Campus' },
  { key: 'startDate', label: 'Course Start Date', type: 'date' },
  { key: 'expectedEndDate', label: 'Expected End Date', type: 'date' },
  { key: 'currentYearSemester', label: 'Current Year / Semester' },
  { key: 'attendanceStatus', label: 'Attendance Status' },
  { key: 'academicStatus', label: 'Academic Status' },
  { key: 'gpa', label: 'GPA' },
  { key: 'previousQualification', label: 'Previous Qualification' },
  { key: 'yearOfCompletion', label: 'Year of Completion' },
  { key: 'placementHours', label: 'Placement Hours', type: 'number', example: '120' },

  // Additional / placement
  { key: 'internshipPriority', label: 'Internship Priority', hint: 'Normal / High / Urgent' },
  { key: 'studentSource', label: 'Student Source', hint: 'Walk-in / Social Media / Other' },
  { key: 'preferredIndustry', label: 'Preferred Industry', hint: 'Individual Support / ECEC' },
  { key: 'placementSite', label: 'Placement Sites', type: 'list', hint: 'Comma separated' },
  { key: 'transport', label: 'Transport / Licence', hint: 'Yes / No' },
  { key: 'licenceNumber', label: 'Licence Number' },
  { key: 'preferredLocation', label: 'Preferred Location' },
  { key: 'placementRadius', label: 'Placement Radius' },
  { key: 'availabilityDays', label: 'Availability Days', type: 'days', example: 'Mon, Tue, Wed', hint: 'Comma separated: Mon,Tue,Wed,Thu,Fri,Sat,Sun' },
  { key: 'availabilityFrom', label: 'Available From', example: '09:00 AM' },
  { key: 'availabilityTo', label: 'Available To', example: '05:00 PM' },
  { key: 'willingToRelocate', label: 'Willing to Relocate' },
  { key: 'placementNotes', label: 'Placement Notes' },
  { key: 'visaStatus', label: 'Visa Status' },
  { key: 'visaSubclass', label: 'Visa Subclass' },
  { key: 'visaExpiryDate', label: 'Visa Expiry Date', type: 'date' },
  { key: 'workRights', label: 'Work Rights' },
  { key: 'workExperience', label: 'Work Experience' },
  { key: 'englishProficiency', label: 'English Proficiency' },
  { key: 'emergencyContactName', label: 'Emergency Contact Name' },
  { key: 'emergencyContactPhone', label: 'Emergency Contact Phone' },
  { key: 'heardAboutUs', label: 'Heard About Us' },
  { key: 'additionalNotes', label: 'Additional Notes' },
  { key: 'status', label: 'Status', hint: 'Active / Pending / Inactive / Graduated / Suspended' },
];

/* Document type aliases used to match uploaded filenames → schema field */
export const DOC_TYPES = [
  { field: 'policeCheckDoc', label: 'Police Check', aliases: ['police', 'policecheck', 'npc'] },
  { field: 'covidCheckDoc', label: 'COVID-19', aliases: ['covid', 'covid19', 'vaccine', 'vaccination'] },
  { field: 'ndisDoc', label: 'NDIS', aliases: ['ndis'] },
  { field: 'resumeDoc', label: 'Resume', aliases: ['resume', 'cv', 'cb'] },
  { field: 'wwccDoc', label: 'WWCC', aliases: ['wwcc', 'wwc', 'workingwithchildren'] },
  { field: 'passportDoc', label: 'Passport', aliases: ['passport'] },
  { field: 'drivingLicenceDoc', label: 'Driving Licence', aliases: ['licence', 'license', 'drivinglicence', 'drivinglicense', 'dl'] },
  { field: 'infectionControlDoc', label: 'Infection Control', aliases: ['infection', 'infectioncontrol'] },
  { field: 'handHygieneDoc', label: 'Hand Hygiene', aliases: ['hygiene', 'handhygiene', 'hand'] },
  { field: 'cbrDoc', label: 'CPR', aliases: ['cpr', 'cbr', 'firstaidcpr'] },
];

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const HEADER_LOOKUP = (() => {
  const map = new Map();
  BULK_COLUMNS.forEach((c) => {
    map.set(norm(c.key), c);
    map.set(norm(c.label), c);
  });
  // A few friendly aliases
  [
    ['email', 'emailAddress'], ['phone', 'phoneNumber'], ['mobile', 'phoneNumber'], ['dob', 'dateOfBirth'],
    ['course', 'courseQualification'], ['rto', 'assignedRto'], ['college', 'assignedRto'], ['postcode', 'postCode'],
    ['rtoname', 'assignedRto'], ['collegename', 'assignedRto'], ['collegerto', 'assignedRto'],
    ['rtocollege', 'assignedRto'], ['institutename', 'assignedRto'], ['institution', 'assignedRto'],
    ['rtoprovider', 'assignedRto'], ['provider', 'assignedRto'], ['educationprovider', 'assignedRto']
  ].forEach(([alias, key]) => map.set(alias, BULK_COLUMNS.find((c) => c.key === key)));
  return map;
})();

/* ------------------------------------------------------------------ */
/*  Cell value helpers                                                 */
/* ------------------------------------------------------------------ */
const cellToRaw = (v) => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if (v.text !== undefined) return v.text;                 // hyperlink / email cells
    if (v.result !== undefined) return v.result;             // formula cells
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join('');
  }
  return v;
};

const parseDate = (v) => {
  if (v instanceof Date) return isNaN(v) ? null : v;
  if (typeof v === 'number') {
    // Excel serial date
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d) ? null : d;
  }
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/); // dd/mm/yyyy (AU)
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    return isNaN(date) ? undefined : date;
  }
  const d = new Date(s);
  return isNaN(d) ? undefined : d; // undefined = invalid → reported
};

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const convertValue = (col, raw) => {
  if (raw === '' || raw === null || raw === undefined) return undefined;
  switch (col.type) {
    case 'date': {
      const d = parseDate(raw);
      if (d === undefined) throw new Error(`${col.label}: invalid date "${raw}" (use DD/MM/YYYY)`);
      return d;
    }
    case 'number': {
      const n = Number(String(raw).replace(/[^0-9.\-]/g, ''));
      if (isNaN(n)) throw new Error(`${col.label}: "${raw}" is not a number`);
      return n;
    }
    case 'list':
      return String(raw).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    case 'days': {
      const out = {};
      String(raw).split(/[,;\s]+/).forEach((tok) => {
        const k = DAY_KEYS.find((d) => d.toLowerCase() === tok.trim().slice(0, 3).toLowerCase());
        if (k) out[k] = true;
      });
      return out;
    }
    default:
      return raw instanceof Date ? raw.toISOString().split('T')[0] : String(raw).trim();
  }
};

/* ------------------------------------------------------------------ */
/*  Template                                                           */
/* ------------------------------------------------------------------ */
export const buildTemplateWorkbook = async () => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Placement Portal';
  const ws = wb.addWorksheet('Students');

  ws.columns = BULK_COLUMNS.map((c) => ({
    header: c.required ? `${c.label} *` : c.label,
    key: c.key,
    width: Math.max(16, c.label.length + 4),
  }));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.height = 22;
  BULK_COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.required ? 'FFDC2626' : 'FF2563EB' } };
    if (c.hint) cell.note = c.hint;
  });
  ws.addRow(Object.fromEntries(BULK_COLUMNS.map((c) => [c.key, c.example ?? ''])));
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Instructions sheet
  const info = wb.addWorksheet('Instructions');
  info.columns = [{ header: 'Column', width: 28 }, { header: 'Required', width: 10 }, { header: 'Notes', width: 70 }];
  info.getRow(1).font = { bold: true };
  BULK_COLUMNS.forEach((c) => info.addRow([c.label, c.required ? 'Yes' : '', c.hint || (c.type === 'date' ? 'DD/MM/YYYY' : '')]));
  info.addRow([]);
  info.addRow(['DOCUMENTS', '', 'Upload later from "Bulk Import → Documents". Name each file <StudentID or Email>_<type>.pdf']);
  info.addRow(['', '', `Types: ${DOC_TYPES.map((d) => d.aliases[0]).join(', ')}. Any other name is saved as an additional document.`]);
  info.addRow(['', '', 'Example: STU12_police.pdf, STU12_passport.jpg, john@x.com_first-aid.pdf']);
  info.addRow(['', '', 'Or upload a folder per student: STU12/police.pdf']);

  return wb;
};

/* ------------------------------------------------------------------ */
/*  Parse + validate + (optionally) import                             */
/* ------------------------------------------------------------------ */
const parseWorkbook = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    throw new BadRequestError('Could not read the file. Please upload a valid .xlsx Excel file.');
  }
  const ws = wb.getWorksheet('Students') || wb.worksheets[0];
  if (!ws) throw new BadRequestError('The Excel file has no sheets.');

  const colMap = {}; // column index → column def
  const unknownHeaders = [];
  ws.getRow(1).eachCell((cell, idx) => {
    const text = String(cellToRaw(cell.value)).replace('*', '').trim();
    const def = HEADER_LOOKUP.get(norm(text));
    if (def) colMap[idx] = def;
    else if (text) unknownHeaders.push(text);
  });

  if (!Object.values(colMap).some((c) => c.key === 'emailAddress')) {
    throw new BadRequestError('Missing "Email Address" column. Please use the downloaded template.');
  }

  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const data = {};
    const errors = [];
    let hasValue = false;
    Object.entries(colMap).forEach(([idx, col]) => {
      const raw = cellToRaw(row.getCell(Number(idx)).value);
      if (raw !== '' && raw !== null && raw !== undefined) hasValue = true;
      try {
        const v = convertValue(col, raw);
        if (v !== undefined) data[col.key] = v;
      } catch (e) {
        errors.push(e.message);
      }
    });
    if (hasValue) rows.push({ rowNumber, data, errors });
  });

  return { rows, unknownHeaders };
};

export const processBulkImport = async (buffer, { commit = false, actingUser } = {}) => {
  const { rows, unknownHeaders } = await parseWorkbook(buffer);
  if (rows.length === 0) throw new BadRequestError('No student rows found in the sheet.');
  if (rows.length > 2000) throw new BadRequestError('Maximum 2000 students per upload.');

  // Pre-load lookups
  const rtos = await RtoModel.find({}, { name: 1 }).lean();
  const rtoByName = new Map(rtos.map((r) => [norm(r.name), r]));

  const emails = rows.map((r) => String(r.data.emailAddress || '').toLowerCase()).filter(Boolean);
  const ids = rows.map((r) => String(r.data.studentId || '').toUpperCase()).filter(Boolean);
  const existing = await StudentModel.find(
    { $or: [{ emailAddress: { $in: emails } }, { studentId: { $in: ids } }] },
    { emailAddress: 1, studentId: 1 }
  ).lean();
  const existingEmails = new Set(existing.map((s) => s.emailAddress));
  const existingIds = new Set(existing.map((s) => s.studentId));

  const seenEmails = new Set();
  const seenIds = new Set();
  const results = [];

  for (const row of rows) {
    const errors = [...row.errors];
    const d = { ...row.data };

    // Normalisations
    if (d.phoneNumber) d.phoneNumber = String(d.phoneNumber).replace(/^\+?61/, '').trim() || d.phoneNumber;
    if (d.studentType) {
      const t = ['RTO Student', 'Independent Student', 'Awaiting RTO Assignment'].find((x) => norm(x) === norm(d.studentType) || norm(x).startsWith(norm(d.studentType)));
      if (t) d.studentType = t;
    }
    if (d.status) {
      const s = ['Active', 'Pending', 'Inactive', 'Graduated', 'Suspended'].find((x) => norm(x) === norm(d.status));
      if (s) d.status = s;
    }
    if (!d.assignedRto && d.institute) {
      d.assignedRto = d.institute;
    }
    if (d.assignedRto) {
      const rto = rtoByName.get(norm(d.assignedRto));
      if (rto) {
        d.assignedRto = rto.name;
        d.rtoId = String(rto._id);
        if (!d.studentType || d.studentType === 'Awaiting RTO Assignment') {
          d.studentType = 'RTO Student';
        }
      }
    }
    if (d.studentType === 'Independent Student' && !d.assignedRto) d.assignedRto = 'Independent Student';
    if (d.studentType === 'Independent Student' && !(d.independentFee > 0)) {
      errors.push('Independent Fee is required for Independent Student');
    }

    const parsed = studentSchema.safeParse(d);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => {
        const col = BULK_COLUMNS.find((c) => c.key === i.path?.[0]);
        errors.push(`${col?.label || i.path?.join('.') || 'Field'}: ${i.message}`);
      });
    }

    const email = String(d.emailAddress || '').toLowerCase();
    const sid = String(d.studentId || '').toUpperCase();
    if (email) {
      if (existingEmails.has(email)) errors.push(`Email "${email}" already exists in the portal`);
      else if (seenEmails.has(email)) errors.push(`Email "${email}" is duplicated in this file`);
      seenEmails.add(email);
    }
    if (sid) {
      if (existingIds.has(sid)) errors.push(`Student ID "${sid}" already exists`);
      else if (seenIds.has(sid)) errors.push(`Student ID "${sid}" is duplicated in this file`);
      seenIds.add(sid);
    }

    results.push({
      row: row.rowNumber,
      name: [d.firstName, d.lastName].filter(Boolean).join(' '),
      email,
      studentId: sid || null,
      valid: errors.length === 0,
      errors,
      _payload: parsed.success ? parsed.data : null,
    });
  }

  let created = 0;
  if (commit) {
    for (const r of results) {
      if (!r.valid) continue;
      try {
        const student = await StudentService.createStudent(r._payload, { silent: true });
        r.studentId = student.studentId;
        r.id = student._id.toString();
        r.imported = true;
        created++;
      } catch (e) {
        r.valid = false;
        r.imported = false;
        r.errors.push(e.code === 11000 ? 'Duplicate email or Student ID' : e.message);
      }
    }
    if (created > 0) {
      try {
        await NotificationModel.create({
          title: 'Bulk Student Import',
          desc: `${created} student${created === 1 ? '' : 's'} imported from Excel${actingUser?.name ? ` by ${actingUser.name}` : ''}`,
          type: 'student',
          link: '/my-students',
        });
      } catch (_) {}
      try {
        const { syncChargeableStudents } = await import('../payment/payment.service.js');
        syncChargeableStudents().catch(() => {});
      } catch (_) {}
    }
  }

  results.forEach((r) => delete r._payload);
  return {
    total: results.length,
    valid: results.filter((r) => r.valid).length,
    invalid: results.filter((r) => !r.valid).length,
    created,
    committed: commit,
    unknownHeaders,
    rows: results,
  };
};

/* ------------------------------------------------------------------ */
/*  Bulk documents                                                     */
/* ------------------------------------------------------------------ */
const safeName = (s) => String(s).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);

const resolveDocType = (label) => {
  const n = norm(label);
  if (!n) return null;
  return DOC_TYPES.find((d) => d.aliases.includes(n) || norm(d.field) === n || norm(d.label) === n)
    || DOC_TYPES.find((d) => d.aliases.some((a) => a.length >= 3 && n.startsWith(a)))
    || null;
};

/**
 * Split "<identifier>_<type>.ext" or "<identifier>/<type>.ext".
 * Identifier = Student ID or email.
 */
const splitFileName = (originalName) => {
  const clean = originalName.replace(/\\/g, '/');
  const ext = path.extname(clean);
  const noExt = clean.slice(0, clean.length - ext.length);
  const parts = noExt.split('/').filter(Boolean);
  const base = parts[parts.length - 1] || '';
  const candidates = [];
  const m = base.includes('@')
    ? base.match(/^([^@]+@[^_\s]+)[_\s]+(.+)$/)
    : base.match(/^(.+?)[_\s]+(.+)$/) || base.match(/^([^-]+)-(.+)$/);
  if (m) candidates.push({ identifier: m[1], docLabel: m[2], ext });
  if (parts.length >= 2) candidates.push({ identifier: parts[parts.length - 2], docLabel: base, ext });
  if (!candidates.length) candidates.push({ identifier: base, docLabel: '', ext });
  return candidates;
};

export const processBulkDocuments = async (files = []) => {
  if (!files.length) throw new BadRequestError('Please select at least one document.');

  const results = [];
  const studentCache = new Map();

  const findStudent = async (identifier) => {
    const key = identifier.trim().toLowerCase();
    if (studentCache.has(key)) return studentCache.get(key);
    const student = key.includes('@')
      ? await StudentModel.findOne({ emailAddress: key })
      : await StudentModel.findOne({ studentId: key.toUpperCase() });
    studentCache.set(key, student);
    return student;
  };

  for (const file of files) {
    const originalName = file.relativeName || file.originalname;
    const candidates = splitFileName(originalName);
    let student = null;
    let picked = candidates[0];
    for (const c of candidates) {
      student = c.identifier ? await findStudent(c.identifier) : null;
      if (student) { picked = c; break; }
    }
    const { identifier, docLabel, ext } = picked;

    if (!student) {
      results.push({ file: originalName, matched: false, error: `No student found for "${identifier}"` });
      continue;
    }

    const docType = resolveDocType(docLabel);
    const dir = path.join(UPLOAD_ROOT, 'students', student._id.toString());
    fs.mkdirSync(dir, { recursive: true });
    const storedName = `${Date.now()}_${safeName((docType?.field || docLabel || 'document') + ext)}`;
    fs.writeFileSync(path.join(dir, storedName), file.buffer);
    const url = `/uploads/students/${student._id.toString()}/${storedName}`;

    if (docType) {
      student[docType.field] = url;
    } else {
      const title = (docLabel || path.basename(originalName, ext)).replace(/[_-]+/g, ' ').trim();
      student.additionalDocuments.push({ title, file: url });
    }
    await student.save({ validateModifiedOnly: true });

    results.push({
      file: originalName,
      matched: true,
      studentId: student.studentId,
      studentName: student.name,
      document: docType ? docType.label : `Additional: ${docLabel || 'document'}`,
      url,
    });
  }

  return {
    total: results.length,
    attached: results.filter((r) => r.matched).length,
    failed: results.filter((r) => !r.matched).length,
    rows: results,
  };
};
