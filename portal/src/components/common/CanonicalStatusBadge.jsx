import React from 'react';
import { getCanonicalStatusStyle } from '../../constants/canonicalStatus.js';

/**
 * Standardized Canonical Student Lifecycle Status Badge.
 * Used consistently across all 5 workflow steps to show the student's unified stage.
 *
 * @param {string} status - Canonical lifecycle status string
 * @param {string} [className] - Optional extra Tailwind classes
 * @param {boolean} [showDot] - Whether to render the status indicator dot (default: true)
 * @param {string} [size] - 'sm' | 'md' (default: 'sm')
 */
export default function CanonicalStatusBadge({
  status,
  className = '',
  showDot = true,
  size = 'sm',
}) {
  const style = getCanonicalStatusStyle(status);

  const sizeClasses = size === 'md'
    ? 'px-2.5 py-1 text-xs gap-1.5'
    : 'px-2 py-0.5 text-[10px] gap-1';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
      title={`Canonical Lifecycle Status: ${style.label}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      <span>{style.label}</span>
    </span>
  );
}
