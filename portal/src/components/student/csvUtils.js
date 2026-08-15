// Export an array of student objects to a CSV file and trigger download
export const downloadStudentsCSV = (students) => {
  if (!students || students.length === 0) return;

  const headers = ['Name', 'Age', 'Student ID', 'RTO', 'RTO Code', 'Course', 'Course Code', 'Email', 'Phone', 'City/Suburb', 'State', 'Status', 'Source', 'Created'];
  const rows = students.map(s => [
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.age || '').replace(/"/g, '""')}"`,
    `"${(s.id || '').replace(/"/g, '""')}"`,
    `"${(s.rto || '').replace(/"/g, '""')}"`,
    `"${(s.rtoCode || '').replace(/"/g, '""')}"`,
    `"${(s.course || '').replace(/"/g, '""')}"`,
    `"${(s.courseCode || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    `"${(s.location || '').replace(/"/g, '""')}"`,
    `"${(s.state || '').replace(/"/g, '""')}"`,
    `"${(s.status || '').replace(/"/g, '""')}"`,
    `"${(s.source || '').replace(/"/g, '""')}"`,
    `"${(s.created || '').replace(/"/g, '""')}"`,
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'students.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};