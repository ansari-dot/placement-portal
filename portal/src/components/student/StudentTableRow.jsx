import { MoreVertical } from 'lucide-react';
import StudentActionsMenu from './StudentActionsMenu';
import { allColumns } from './studentData';

// Helper to render a single cell based on column key
const renderCell = (student, colKey) => {
  switch (colKey) {
    case 'student':
      return (
        <div className="flex items-center space-x-3">
          <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          <div>
            <p className="font-bold text-slate-900">{student.name}</p>
            <p className="text-[11px] text-slate-400 font-medium">{student.age}</p>
          </div>
        </div>
      );
    case 'studentId':
      return <span className="font-semibold text-slate-800">{student.id}</span>;
    case 'rto':
      return (
        <>
          <p className="font-semibold text-slate-800">{student.rto}</p>
          <p className="text-[11px] text-slate-400">{student.rtoCode}</p>
        </>
      );
    case 'course':
      return (
        <>
          <p className="font-semibold text-slate-800">{student.course}</p>
          <p className="text-[11px] text-slate-400">{student.courseCode}</p>
        </>
      );
    case 'email':
      return <span className="text-slate-600">{student.email}</span>;
    case 'phone':
      return <span className="text-slate-600">{student.phone}</span>;
    case 'location':
      return (
        <>
          <p className="font-semibold text-slate-800">{student.location}</p>
          <p className="text-[11px] text-slate-400">{student.state}</p>
        </>
      );
    case 'status':
      return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${
          student.status === 'Active'
            ? 'bg-emerald-50 text-emerald-600'
            : student.status === 'Pending'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-rose-50 text-rose-600'
        }`}>
          {student.status}
        </span>
      );
    case 'source':
      return <span className="text-slate-600">{student.source || '—'}</span>;
    case 'created':
      return <span className="text-slate-600">{student.created}</span>;
    default:
      return null;
  }
};

export default function StudentTableRow({
  student,
  isSelected,
  onSelect,
  isActionsOpen,
  onToggleActions,
  onRowAction,
  hiddenColumns,
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition">
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
        />
      </td>
      {allColumns.map(col =>
        !hiddenColumns.includes(col.key) && (
          <td key={col.key} className="p-4">
            {renderCell(student, col.key)}
          </td>
        )
      )}
      <td className="p-4 text-center relative">
        <button
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 mx-auto transition cursor-pointer"
          onClick={onToggleActions}
        >
          <MoreVertical size={16} />
        </button>
        {isActionsOpen && (
          <StudentActionsMenu student={student} onClose={onToggleActions} onAction={onRowAction} />
        )}
      </td>
    </tr>
  );
}