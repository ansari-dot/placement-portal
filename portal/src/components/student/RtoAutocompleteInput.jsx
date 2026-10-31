import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Check, Plus, X, Loader2, GraduationCap } from 'lucide-react';
import { fetchRtoAutocomplete } from '../../api/authApi';

export default function RtoAutocompleteInput({
  value = '',
  onChange,
  studentType = 'RTO Student',
  placeholder,
  hasError = false,
  disabled = false,
  allRtos = [],
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  // Sync internal state if external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search adhering to 50% match rule
  useEffect(() => {
    const trimmed = (inputValue || '').trim();
    if (!isOpen || trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        let results = [];

        // 1. Fetch from backend autocomplete (which enforces 50% match rule on code & name tokens)
        try {
          const apiResults = await fetchRtoAutocomplete(trimmed, controller.signal);
          if (Array.isArray(apiResults) && apiResults.length > 0) {
            results = apiResults;
          }
        } catch (apiErr) {
          // If aborted, do nothing
          if (apiErr?.name === 'CanceledError' || apiErr?.code === 'ERR_CANCELED') return;
        }

        // 2. Client-side fallback / augmentation from allRtos prop
        if (Array.isArray(allRtos) && allRtos.length > 0) {
          const lowerQ = trimmed.toLowerCase();
          const localMatches = allRtos.filter((r) => {
            const name = (r?.name || (typeof r === 'string' ? r : '')).trim();
            const code = (r?.code || '').trim();
            const lowerName = name.toLowerCase();
            const lowerCode = code.toLowerCase();

            // 50% rule or prefix match
            const minNameLen = Math.max(2, Math.ceil(name.length * 0.5));
            const isNameMatch = lowerName.includes(lowerQ) && (trimmed.length >= minNameLen || lowerName.startsWith(lowerQ));
            const isCodeMatch = lowerCode && lowerCode.includes(lowerQ);

            return isNameMatch || isCodeMatch;
          });

          // Merge without duplicates
          const seenNames = new Set(results.map((r) => r.name.toLowerCase()));
          localMatches.forEach((lr) => {
            const rName = typeof lr === 'string' ? lr : lr.name;
            if (rName && !seenNames.has(rName.toLowerCase())) {
              seenNames.add(rName.toLowerCase());
              results.push({
                _id: lr._id || null,
                name: rName,
                code: lr.code || '',
              });
            }
          });
        }

        setSuggestions(results.slice(0, 8));
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue, isOpen, allRtos]);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    setIsOpen(true);
    // Allow user to write RTO name directly (50% write rule)
    if (onChange) {
      onChange(newVal, null);
    }
  };

  const handleSelectSuggestion = (rto) => {
    setInputValue(rto.name);
    setIsOpen(false);
    if (onChange) {
      onChange(rto.name, rto);
    }
  };

  const handleAddNewRto = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    setIsOpen(false);
    if (onChange) {
      onChange(trimmed, { name: trimmed, isCustom: true });
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    if (onChange) {
      onChange('', null);
    }
  };

  // Determine if current typed value is verified in DB
  const matchedDbRto = Array.isArray(allRtos)
    ? allRtos.find((r) => {
        const rName = (typeof r === 'string' ? r : r?.name || '').trim().toLowerCase();
        return rName && rName === (inputValue || '').trim().toLowerCase();
      })
    : null;

  const defaultPlaceholder =
    studentType === 'Independent Student'
      ? 'Type college / RTO name (or write new RTO)...'
      : 'Type RTO name or code (suggestions appear as you type)...';

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 pointer-events-none">
          {studentType === 'Independent Student' ? (
            <GraduationCap className="w-4 h-4 text-blue-500" />
          ) : (
            <Building2 className="w-4 h-4 text-slate-400" />
          )}
        </span>

        <input
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder || defaultPlaceholder}
          className={`w-full pl-10 pr-9 py-2.5 bg-white border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition ${
            hasError ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200'
          } ${disabled ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
        />

        <div className="absolute right-3 flex items-center space-x-1.5">
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition"
              title="Clear RTO"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Verification status pill */}
      {inputValue.trim() && !isOpen && (
        <div className="mt-1 flex items-center space-x-1.5">
          {matchedDbRto ? (
            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Verified Database RTO Partner</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              <Plus className="w-3 h-3 text-blue-600" />
              <span>
                {studentType === 'Independent Student'
                  ? 'Custom College / Independent RTO'
                  : 'New RTO / Direct Name'}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {/* Header */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span>Database Suggestions (50% match rule)</span>
            {isLoading && <span className="text-blue-600">Searching...</span>}
          </div>

          {/* Suggestions List */}
          {suggestions.map((rto) => {
            const isSelected = (inputValue || '').trim().toLowerCase() === (rto.name || '').toLowerCase();
            return (
              <div
                key={rto._id || rto.name}
                onClick={() => handleSelectSuggestion(rto)}
                className={`px-3.5 py-2.5 hover:bg-blue-50/70 transition cursor-pointer border-b border-slate-50 last:border-b-0 flex items-center justify-between ${
                  isSelected ? 'bg-blue-50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{rto.name}</p>
                    {rto.code && (
                      <p className="text-[10px] text-slate-400">RTO Code: {rto.code}</p>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
              </div>
            );
          })}

          {/* If no exact match, allow writing/adding as new RTO */}
          {inputValue.trim() &&
            !suggestions.some(
              (r) => (r.name || '').trim().toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <div
                onClick={handleAddNewRto}
                className="px-3.5 py-2.5 hover:bg-emerald-50 transition cursor-pointer border-t border-slate-100 flex items-center space-x-2.5 bg-slate-50/50"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-800 truncate">
                    + Add "{inputValue.trim()}" as {studentType === 'Independent Student' ? 'College' : 'New RTO'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Write / register this RTO name for this student
                  </p>
                </div>
              </div>
            )}

          {suggestions.length === 0 && !isLoading && (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-600 font-medium">No matching RTO in database</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Keep typing to write the full name, or click below to add it.
              </p>
              {inputValue.trim() && (
                <button
                  type="button"
                  onClick={handleAddNewRto}
                  className="mt-2.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Use "{inputValue.trim()}"</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
