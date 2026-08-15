import { allColumns } from './studentData';

export default function StudentColumnsMenu({ hiddenColumns, onToggleColumn, onClose }) {
  return (
    <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30">
      <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toggle Columns</p>
      {allColumns.map(col => (
        <label key={col.key} className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={!hiddenColumns.includes(col.key)}
            onChange={() => onToggleColumn(col.key)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
          />
          <span className="text-xs font-medium text-slate-700">{col.label}</span>
        </label>
      ))}
      <button
        onClick={onClose}
        className="w-full mt-1 px-2 py-1.5 text-left text-[11px] font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
      >
        Done
      </button>
    </div>
  );
}