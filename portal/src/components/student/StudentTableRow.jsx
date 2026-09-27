import { MoreVertical } from 'lucide-react';
import StudentActionsMenu from './StudentActionsMenu';
import { allColumns } from './studentData';
import { formatLastSeen } from '../../utils/presenceUtils';

// ── Placement status config ───────────────────────────────────────────────────
const PLACEMENT_STATUS_CONFIG = {
  'Awaiting':                   { bg: 'bg-slate-100',    text: 'text-slate-600',   border: 'border-slate-200'   },
  'In Progress':                { bg: 'bg-blue-50',      text: 'text-blue-700',    border: 'border-blue-200'    },
  'Appointment Scheduled':      { bg: 'bg-purple-50',    text: 'text-purple-700',  border: 'border-purple-200'  },
  'Appointment Successful':     { bg: 'bg-teal-50',      text: 'text-teal-700',    border: 'border-teal-200'    },
  'Student Withdraw':           { bg: 'bg-amber-50',     text: 'text-amber-700',   border: 'border-amber-200'   },
  'Student Missed Appointment': { bg: 'bg-orange-50',    text: 'text-orange-700',  border: 'border-orange-200'  },
  'Industry Rejected':          { bg: 'bg-rose-50',      text: 'text-rose-700',    border: 'border-rose-200'    },
  'Placement Started':          { bg: 'bg-emerald-50',   text: 'text-emerald-700', border: 'border-emerald-200' },
  'Placement Completed':        { bg: 'bg-emerald-100',  text: 'text-emerald-800', border: 'border-emerald-300' },
  'None':                       { bg: 'bg-slate-50',     text: 'text-slate-400',   border: 'border-slate-200'   },
};

const PLACEMENT_REQUEST_CONFIG = {
  'Urgent':   { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   dot: 'bg-rose-500'   },
  'Normal':   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  'Inactive': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  'Snooze':   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
};

function PlacementStatusBadge({ status }) {
  const s   = status || 'Awaiting';
  const cfg = PLACEMENT_STATUS_CONFIG[s] || PLACEMENT_STATUS_CONFIG['Awaiting'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
      {s}
    </span>
  );
}

function PlacementRequestBadge({ priority, isSnoozed }) {
  const label = isSnoozed ? 'Snooze' : (priority || null);
  if (!label) return <span className="text-slate-300 text-xs">—</span>;
  const cfg = PLACEMENT_REQUEST_CONFIG[label] || PLACEMENT_REQUEST_CONFIG['Normal'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {label}
    </span>
  );
}

const isStudentOnline = (s) => {
  if (!s) return false;
  if (s.isOnline === true) return true;
  try {
    const rawAuth = localStorage.getItem('user') || localStorage.getItem('portal_user');
    if (rawAuth) {
      const u = JSON.parse(rawAuth);
      if (
        (u.email && s.email && u.email.toLowerCase().trim() === s.email.toLowerCase().trim()) ||
        (u.id && (u.id === s.id || u.id === s.studentId || u.id === s.dbId))
      ) return true;
    }
  } catch (e) {}
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

// ── Cell renderers ────────────────────────────────────────────────────────────
const renderCell = (student, colKey, { hasPlacementRequest, workflowPriority, isSnoozed } = {}) => {
  switch (colKey) {

    case 'student': {
      const online      = isStudentOnline(student);
      const lastSeenTxt = formatLastSeen(student.lastSeen || student.lastActive || student.updatedAt, online);
      const studentId   = student.studentId || student.id || '';

      return (
        <div className="flex items-center space-x-3">
          {/* Avatar + online dot */}
          <div className="relative shrink-0">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-9 h-9 rounded-full object-cover"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
              title={online ? 'Online now' : `Last seen: ${lastSeenTxt}`}
            />
          </div>

          {/* Name + Student ID (replaces coordinator name line) */}
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
              {online ? (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="text-[9px] font-medium text-slate-400">{lastSeenTxt}</span>
              )}
            </div>
            {/* Student ID shown under name */}
            {studentId && (
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{studentId}</p>
            )}
          </div>
        </div>
      );
    }

    case 'placementStatus':
      return <PlacementStatusBadge status={student.placementStatus} />;

    case 'placementRequest':
      return (
        <PlacementRequestBadge
          priority={workflowPriority}
          isSnoozed={isSnoozed}
        />
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

    case 'assignedAt':
      return (
        <span className="text-slate-600 font-medium text-xs">
          {student.assignedAt || '—'}
        </span>
      );

    default:
      return null;
  }
};

// ── Row component ─────────────────────────────────────────────────────────────
export default function StudentTableRow({
  student,
  isSelected,
  onSelect,
  isActionsOpen,
  onToggleActions,
  onRowAction,
  hiddenColumns,
  canAssign       = true,
  hasPlacementRequest = false,
  workflowPriority    = null,   // 'Normal' | 'Urgent' | 'Inactive' from workflowRequestMap
  isSnoozed       = false,
  isAdmin         = false,
}) {
  const extras = { hasPlacementRequest, workflowPriority, isSnoozed };

  return (
    <tr className="hover:bg-slate-50/80 transition cursor-pointer">
      {/* Checkbox */}
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
        />
      </td>

      {/* Data cells */}
      {allColumns.map((col) =>
        !hiddenColumns.includes(col.key) && (
          <td
            key={col.key}
            className="p-4"
            onClick={(e) => {
              if (col.key === 'student') {
                e.stopPropagation();
                onRowAction && onRowAction('view', student);
              }
            }}
          >
            {renderCell(student, col.key, extras)}
          </td>
        )
      )}

      {/* Actions */}
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
            hasPlacementRequest={hasPlacementRequest}
            isSnoozed={isSnoozed}
            isAdmin={isAdmin}
          />
        )}
      </td>
    </tr>
  );
}
