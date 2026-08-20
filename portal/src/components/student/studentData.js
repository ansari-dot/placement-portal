export const defaultStudents = [];

export const emptyFilters = {
  firstName: '',
  lastName: '',
  studentId: '',
  rto: '',
  course: '',
  status: '',
  fromDate: '',
  toDate: '',
  city: '',
  source: '',
  ageFrom: '',
  ageTo: '',
};

// Parse "22 years" => 22
export const parseAge = (age) => {
  if (!age) return null;
  const match = String(age).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

// Parse "19 Jul 2025" => timestamp
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getTime();
};

export const inputClass = "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition";
export const selectClass = "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 transition cursor-pointer";
export const btnSecondary = "px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer";

export const allColumns = [
  { key: 'student', label: 'Student' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'rto', label: 'RTO' },
  { key: 'course', label: 'Course' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'City / Suburb' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'created', label: 'Created At' },
];