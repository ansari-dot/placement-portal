import { Calendar, Filter, X } from 'lucide-react';
import { inputClass, selectClass } from './studentData';

const PLACEMENT_REQUEST_OPTIONS = ['Urgent', 'Normal', 'Snooze', 'Inactive'];

const PLACEMENT_STATUS_OPTIONS = [
  'In Progress',
  'Appointment Scheduled',
  'Appointment Successful',
  'Waiting to Join',
  'Placement Started',
  'Student Withdraw',
  'Industry Rejected',
  'Placement Completed',
];

export default function StudentFilters({ filters, onFilterChange, onClear, options, resultCount, selectedCount, onApply }) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="grid grid-cols-5 gap-4">

        {/* Assigned Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Date</label>
          <div className="relative">
            <input
              type="date"
              value={filters.assignedDate}
              onChange={(e) => onFilterChange('assignedDate', e.target.value)}
              className={`${inputClass} pr-8`}
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={14} />
            </span>
          </div>
        </div>

        {/* Placement Request type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Placement Request</label>
          <select
            value={filters.placementRequest}
            onChange={(e) => onFilterChange('placementRequest', e.target.value)}
            className={selectClass}
          >
            <option value="">All Requests</option>
            {PLACEMENT_REQUEST_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Placement Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Placement Status</label>
          <select
            value={filters.placementStatus}
            onChange={(e) => onFilterChange('placementStatus', e.target.value)}
            className={selectClass}
          >
            <option value="">All Statuses</option>
            {PLACEMENT_STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
          <input
            type="text"
            placeholder="Enter city or suburb"
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Course */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course</label>
          <select
            value={filters.course}
            onChange={(e) => onFilterChange('course', e.target.value)}
            className={selectClass}
          >
            <option value="">All Courses</option>
            {(options.courseOptions || []).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Filter Action Buttons */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={onApply}
            className="px-4 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 transition-all duration-500 cursor-pointer"
          >
            <Filter size={14} />
            <span>Filter</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
            >
              <X size={14} />
              <span>Clear Filters</span>
            </button>
          )}
          {(hasActiveFilters || selectedCount > 0) && (
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedCount > 0 ? `${selectedCount} selected · ` : ''}{resultCount} result(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
