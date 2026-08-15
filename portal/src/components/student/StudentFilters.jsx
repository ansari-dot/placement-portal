import { Calendar, Filter, X } from 'lucide-react';
import { inputClass, selectClass } from './studentData';

export default function StudentFilters({ filters, onFilterChange, onClear, options, resultCount, selectedCount, onApply }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      {/* Row 1 Filters */}
      <div className="grid grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
          <input
            type="text"
            placeholder="Enter first name"
            value={filters.firstName}
            onChange={(e) => onFilterChange('firstName', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
          <input
            type="text"
            placeholder="Enter last name"
            value={filters.lastName}
            onChange={(e) => onFilterChange('lastName', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student ID</label>
          <input
            type="text"
            placeholder="Enter student ID"
            value={filters.studentId}
            onChange={(e) => onFilterChange('studentId', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">RTO</label>
          <select
            value={filters.rto}
            onChange={(e) => onFilterChange('rto', e.target.value)}
            className={selectClass}
          >
            <option value="">All RTOs</option>
            {options.rtoOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course</label>
          <select
            value={filters.course}
            onChange={(e) => onFilterChange('course', e.target.value)}
            className={selectClass}
          >
            <option value="">All Courses</option>
            {options.courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className={selectClass}
          >
            <option value="">All Status</option>
            {options.statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 Filters */}
      <div className="grid grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">From Date</label>
          <div className="relative">
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => onFilterChange('fromDate', e.target.value)}
              className={`${inputClass} pr-8`}
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={14} />
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">To Date</label>
          <div className="relative">
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => onFilterChange('toDate', e.target.value)}
              className={`${inputClass} pr-8`}
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={14} />
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">City / Suburb</label>
          <input
            type="text"
            placeholder="Enter city or suburb"
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Source</label>
          <select
            value={filters.source}
            onChange={(e) => onFilterChange('source', e.target.value)}
            className={selectClass}
          >
            <option value="">All Sources</option>
            {options.sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age From</label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="Min age"
            value={filters.ageFrom}
            onChange={(e) => onFilterChange('ageFrom', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age To</label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="Max age"
            value={filters.ageTo}
            onChange={(e) => onFilterChange('ageTo', e.target.value)}
            className={inputClass}
          />
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
          <button
            onClick={onClear}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
          >
            <X size={14} />
            <span>Clear Filters</span>
          </button>
          {(Object.values(filters).some(v => v !== '') || selectedCount > 0) && (
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedCount > 0 ? `${selectedCount} selected · ` : ''}{resultCount} result(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}