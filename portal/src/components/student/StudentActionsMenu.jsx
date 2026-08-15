import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function StudentActionsMenu({ student, onClose, onAction }) {
  return (
    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
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
        onClick={() => { onClose(); onAction('delete', student); }}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition cursor-pointer"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </div>
  );
}