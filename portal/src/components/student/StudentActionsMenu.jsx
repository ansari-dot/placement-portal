import { Eye, Pencil, Trash2, UserCheck, FileText, Calendar, Building2, Moon, RotateCcw } from 'lucide-react';

export default function StudentActionsMenu({
  student,
  onClose,
  onAction,
  canAssign = true,
  hasPlacementRequest = false,
  isSnoozed = false,
  isAdmin = false,
}) {
  const hasCoordinator = !!(student?.assignedCoordinator || student?.assignedCoordinatorName);

  return (
    <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">

      {/* 1. Change Placement Request — coordinators can change type; admin also sees Generate */}
      {hasPlacementRequest ? (
        <button
          onClick={() => { onClose(); onAction('changePlacement', student); }}
          className="w-full px-3 py-2 text-left text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center space-x-2 transition cursor-pointer"
        >
          <FileText size={14} className="text-teal-500" />
          <span>Change Placement Request</span>
        </button>
      ) : (
        /* Generate Placement Request — admin only; coordinators do not see this */
        isAdmin && (
          <button
            onClick={() => { onClose(); onAction('generateRequest', student); }}
            className="w-full px-3 py-2 text-left text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center space-x-2 transition cursor-pointer"
          >
            <FileText size={14} className="text-teal-500" />
            <span>Generate Placement Request</span>
          </button>
        )
      )}

      {/* Snooze / Unsnooze — available to both coordinator and admin */}
      {isSnoozed ? (
        <button
          onClick={() => { onClose(); onAction('unsnooze', student); }}
          className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2 transition cursor-pointer"
        >
          <RotateCcw size={14} className="text-emerald-500" />
          <span>Unsnooze / Restore</span>
        </button>
      ) : (
        <button
          onClick={() => { onClose(); onAction('snooze', student); }}
          className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center space-x-2 transition cursor-pointer"
        >
          <Moon size={14} className="text-amber-500" />
          <span>Snooze</span>
        </button>
      )}

      <div className="my-1 border-t border-slate-100" />

      {/* 2. View Details */}
      <button
        onClick={() => { onClose(); onAction('view', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Eye size={14} className="text-slate-400" />
        <span>View Details</span>
      </button>

      {/* 3. Edit Details */}
      <button
        onClick={() => { onClose(); onAction('edit', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Pencil size={14} className="text-slate-400" />
        <span>Edit Details</span>
      </button>

      {/* 4. Add Industry — takes coordinator to Placement Request (Step 2) */}
      <button
        onClick={() => { onClose(); onAction('contactIndustry', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-sky-700 hover:bg-sky-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Building2 size={14} className="text-sky-500" />
        <span>Add Industry</span>
      </button>

      <button
        onClick={() => { onClose(); onAction('createAppointment', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Calendar size={14} className="text-indigo-500" />
        <span>Create Appointment</span>
      </button>

      {canAssign && (
        <button
          onClick={() => { onClose(); onAction('assignCoordinator', student); }}
          className="w-full px-3 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center space-x-2 transition cursor-pointer"
        >
          <UserCheck size={14} className="text-blue-500" />
          <span>{hasCoordinator ? 'Change Coordinator' : 'Assign Coordinator'}</span>
        </button>
      )}

      {/* Delete — admin only */}
      {isAdmin && (
        <>
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={() => { onClose(); onAction('delete', student); }}
            className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
}
