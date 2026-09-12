import React from 'react';

/**
 * Format relative time for Last Seen
 * @param {Date|string|number} dateVal
 * @param {boolean} isOnline
 * @returns {string}
 */
export function formatLastSeen(dateVal, isOnline) {
  if (isOnline) {
    return 'Online now';
  }
  if (!dateVal) {
    return 'Recently';
  }

  const date = new Date(dateVal);
  if (isNaN(date.getTime())) {
    return 'Recently';
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0 || diffMs < 60 * 1000) {
    return 'Just now';
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

/**
 * Professional Live Presence Badge Component
 */
export function LivePresenceBadge({
  isOnline = false,
  lastSeen = null,
  showLabel = true,
  size = 'sm', // 'xs' | 'sm' | 'md'
  pulse = true,
}) {
  const label = formatLastSeen(lastSeen, isOnline);

  const dotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${textSizes[size]} font-semibold`}>
      <span className="relative flex items-center justify-center">
        {isOnline && pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizes[size]} ${
            isOnline ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-400'
          }`}
        />
      </span>
      {showLabel && (
        <span className={isOnline ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
          {label}
        </span>
      )}
    </div>
  );
}
