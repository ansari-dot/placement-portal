import { MoreVertical } from 'lucide-react';
import StudentActionsMenu from './StudentActionsMenu';
import { allColumns } from './studentData';
import { formatLastSeen } from '../../utils/presenceUtils';

const isStudentOnline = (s) => {
  if (!s) return false;
  // 1. Database-backed real-time online status
  if (s.isOnline === true) return true;

  // 2. Active logged-in user matching student email or ID
  try {
    const rawAuth = localStorage.getItem('user') || localStorage.getItem('portal_user');
    if (rawAuth) {
      const u = JSON.parse(rawAuth);
      if (
        (u.email && s.email && u.email.toLowerCase().trim() === s.email.toLowerCase().trim()) ||
        (u.id && (u.id === s.id || u.id === s.studentId || u.id === s.dbId))
      ) {
        return true;
      }
    }
  } catch (e) {}

  // 3. Dynamic active session registry
  try {
    const raw = localStorage.getItem('portal_online_users');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.some(u => 
        (u.id && (u.id === s.id || u.id === s.studentId || u.id === s.dbId)) || 
        (u.email && s.email && u.email.toLowerCase().trim() === s.email.toLowerCase().trim())
      )) return true;
    }
  } catch (e) {}

  return false;
};

// Helper to render a single cell based on column key
const renderCell = (student, colKey) => {
  switch (colKey) {
    case 'student': {
      const online = isStudentOnline(student);
      const lastSeenText = formatLastSeen(student.lastSeen || student.lastActive || student.updatedAt, online);

      return (
        <div className="flex items-center space-x-3">
          <div className="relative shrink-0">
            <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
            <span 
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`} 
              title={online ? 'Online now' : `Last seen: ${lastSeenText}`}
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="font-bold text-slate-900">{student.name}</p>
              {online ? (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="text-[9px] font-medium text-slate-400">
                  {lastSeenText}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{student.age}</p>
            {student.assignedCoordinatorName && (
              <span className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                👤 {student.assignedCoordinatorName}
              </span>
            )}
          </div>
        </div>
      );
    }
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
    case 'assignedAt':
      return <span className="text-slate-600 font-medium">{student.assignedAt || student.created || '—'}</span>;
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
  canAssign = true,
}) {
  return (
    <tr 
      onClick={() => onRowAction && onRowAction('view', student)}
      className="hover:bg-slate-50/80 transition cursor-pointer"
    >
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
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
      <td className="p-4 text-center relative" onClick={(e) => e.stopPropagation()}>
        <button
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 mx-auto transition cursor-pointer"
          onClick={onToggleActions}
        >
          <MoreVertical size={16} />
        </button>
        {isActionsOpen && (
          <StudentActionsMenu
            student={student}
            onClose={onToggleActions}
            onAction={onRowAction}
            canAssign={canAssign}
          />
        )}
      </td>
    </tr>
  );
}