// Default student records and shared utilities for My Students table

export const defaultStudents = [
  { name: 'Ali Raza', age: '22 years', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', id: 'STU-1001', rto: 'Bright Futures', rtoCode: 'RTO 4058', course: 'Diploma of IT', courseCode: '(ICT50220)', email: 'ali.raza@email.com', phone: '0412 345 678', location: 'Melbourne', state: 'VIC 3000', status: 'Active', source: 'Website', created: '19 Jul 2025' },
  { name: 'Sara Khan', age: '23 years', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces', id: 'STU-1002', rto: 'Kingsford Institute', rtoCode: 'RTO 3195', course: 'Certificate IV in Business', courseCode: '(BSB40120)', email: 'sara.khan@email.com', phone: '0423 567 890', location: 'Sydney', state: 'NSW 2000', status: 'Active', source: 'RTO Referral', created: '18 Jul 2025' },
  { name: 'Ahmed Malik', age: '21 years', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=faces', id: 'STU-1003', rto: 'Victoria Training', rtoCode: 'RTO 2187', course: 'Diploma of Leadership', courseCode: '(BSB50420)', email: 'ahmed.malik@email.com', phone: '0431 234 567', location: 'Brisbane', state: 'QLD 4000', status: 'Pending', source: 'Agent', created: '17 Jul 2025' },
  { name: 'Zara Noor', age: '24 years', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', id: 'STU-1004', rto: 'Skill Australia', rtoCode: 'RTO 4561', course: 'Certificate III in Aged Care', courseCode: '(CHC33021)', email: 'zara.noor@email.com', phone: '0404 678 901', location: 'Adelaide', state: 'SA 5000', status: 'Active', source: 'Social Media', created: '16 Jul 2025' },
  { name: 'Usman Tariq', age: '22 years', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', id: 'STU-1005', rto: 'Northern College', rtoCode: 'RTO 2056', course: 'Diploma of Marketing', courseCode: '(BSB50820)', email: 'usman.tariq@email.com', phone: '0410 987 654', location: 'Perth', state: 'WA 6000', status: 'Active', source: 'Walk-in', created: '15 Jul 2025' },
  { name: 'Fatima Ali', age: '23 years', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces', id: 'STU-1006', rto: 'Australian Learning', rtoCode: 'RTO 4073', course: 'Certificate IV in Accounting', courseCode: '(FNS40222)', email: 'fatima.ali@email.com', phone: '0422 111 222', location: 'Melbourne', state: 'VIC 3000', status: 'Pending', source: 'Referral', created: '14 Jul 2025' },
  { name: 'Hassan Raza', age: '20 years', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces', id: 'STU-1007', rto: 'Sydney City College', rtoCode: 'RTO 9001', course: 'Diploma of Project Mgmt', courseCode: '(BSB50820)', email: 'hassan.raza@email.com', phone: '0433 555 666', location: 'Sydney', state: 'NSW 2000', status: 'Inactive', source: 'Website', created: '13 Jul 2025' },
  { name: 'Ayesha Khan', age: '22 years', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=faces', id: 'STU-1008', rto: 'Future Skills', rtoCode: 'RTO 3008', course: 'Certificate IV in HR', courseCode: '(BSB40420)', email: 'ayesha.khan@email.com', phone: '0411 222 333', location: 'Brisbane', state: 'QLD 4000', status: 'Active', source: 'Other', created: '12 Jul 2025' },
];

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