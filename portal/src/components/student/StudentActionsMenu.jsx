import { Eye, Pencil, Trash2, UserCheck, FileText, Calendar, Building2 } from 'lucide-react';

export default function StudentActionsMenu({ student, onClose, onAction, canAssign = true }) {
  return (
    <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
      <button
        onClick={() => { onClose(); onAction('view', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Eye size={14} className="text-slate-400" />
        <span>View Details</span>
      </button>

      <button
        onClick={() => { onClose(); onAction('edit', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Pencil size={14} className="text-slate-400" />
        <span>Edit</span>
      </button>

      <button
        onClick={() => { onClose(); onAction('generateRequest', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <FileText size={14} className="text-teal-500" />
        <span>Generate Placement Request</span>
      </button>

      <button
        onClick={() => { onClose(); onAction('contactIndustry', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-sky-700 hover:bg-sky-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Building2 size={14} className="text-sky-500" />
        <span>Add Industry Contact</span>
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
          <span>Assign Coordinator</span>
        </button>
      )}

      <div className="my-1 border-t border-slate-100" />

      <button
        onClick={() => { onClose(); onAction('delete', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </div>
  );
}
