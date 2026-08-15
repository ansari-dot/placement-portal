import { ArrowUp, ArrowDown } from 'lucide-react';
import { allColumns } from './studentData';

export default function StudentTableHeader({ sortField, sortDir, onSort, hiddenColumns, allPageSelected, onSelectAll }) {
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-[10px] text-slate-300">↕</span>;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  };

  return (
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <th className="p-4 w-10">
          <input
            type="checkbox"
            checked={allPageSelected}
            onChange={onSelectAll}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        </th>
        {allColumns.map(col => (
          !hiddenColumns.includes(col.key) && (
            <th key={col.key} className="p-4">
              <div
                className="flex items-center space-x-1 cursor-pointer select-none"
                onClick={() => onSort(col.key)}
              >
                <span>{col.label}</span>
                <SortIcon field={col.key} />
              </div>
            </th>
          )
        ))}
        <th className="p-4 text-center">Actions</th>
      </tr>
    </thead>
  );
}