import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, ClipboardList, ChevronLeft, ChevronRight, RefreshCw, RotateCcw, Undo2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import JobLayout from '../components/layout/JobLayout';
import { fetchUserLogs, revertUserLog } from '../api/userLogApi';

const formatDate = (value) => (value ? new Date(value).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const humanLabel = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const displayValue = (value, key = '') => {
  if (value == null || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return formatDate(value);
    return value;
  }
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    if (value.every((item) => item == null || ['string', 'number', 'boolean'].includes(typeof item))) {
      return value.map((item) => displayValue(item)).join(', ');
    }
    return (
      <div className="space-y-2">
        {value.slice(0, 30).map((item, index) => (
          <div key={index} className="rounded-lg bg-white border border-slate-100 p-2">
            <span className="text-[10px] uppercase text-slate-400">Item {index + 1}</span>
            <ChangeFields data={item} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    if (value._id && Object.keys(value).length <= 2) return String(value.name || value._id);
    return <ChangeFields data={value} />;
  }
  return String(value);
};

function ChangeFields({ data }) {
  if (!data || typeof data !== 'object') return <span>{displayValue(data)}</span>;
  const entries = Object.entries(data).filter(
    ([key]) =>
      !['_id', 'id', '__v', 'password', 'createdAt', 'updatedAt'].includes(key) &&
      !/token|secret|authorization|cookie/i.test(key)
  );
  if (!entries.length) return <span className="text-slate-400">No additional details</span>;
  return (
    <dl className="space-y-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.5fr)] gap-3 border-b border-slate-100 last:border-0 py-1">
          <dt className="text-slate-500 font-medium">{humanLabel(key)}</dt>
          <dd className="text-slate-800 break-words font-semibold">{displayValue(value, key)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReadableChanges({ changes }) {
  const submitted = changes?.submitted || { body: changes?.body, params: changes?.params };
  const result = changes?.result;
  const body = submitted?.body || {};
  return (
    <div className="mt-3 space-y-3 text-xs">
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h4 className="font-bold text-slate-700 mb-2">Submitted Changes</h4>
        <ChangeFields data={body} />
        {submitted?.params && Object.keys(submitted.params).length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-500">Record Reference</span>
            <ChangeFields data={submitted.params} />
          </div>
        )}
      </section>
      {result && (
        <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
          <h4 className="font-bold text-emerald-800 mb-2">Saved Result</h4>
          {result.message && <p className="text-emerald-800 mb-2">{result.message}</p>}
          {result.data && <ChangeFields data={result.data} />}
        </section>
      )}
    </div>
  );
}

export default function UserLogPage() {
  const authUser = useSelector((state) => state.auth?.user);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [resource, setResource] = useState('All');
  const [method, setMethod] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revertingLog, setRevertingLog] = useState(null);
  const [revertLoading, setRevertLoading] = useState(false);

  const loadLogs = useCallback(
    async (page = 1) => {
      if (authUser?.role !== 'Administrator') return;
      setLoading(true);
      setError('');
      try {
        const result = await fetchUserLogs({ page, limit: 25, search: search.trim(), resource, action: method });
        setLogs(result.data || []);
        setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load User Log.');
      } finally {
        setLoading(false);
      }
    },
    [authUser?.role, search, resource, method]
  );

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  const handleConfirmRevert = async () => {
    if (!revertingLog) return;
    setRevertLoading(true);
    try {
      const res = await revertUserLog(revertingLog._id);
      toast.success(res?.message || 'Change reverted successfully!');
      setRevertingLog(null);
      await loadLogs(pagination.page);
    } catch (err) {
      console.error('Failed to revert change:', err);
      toast.error(err?.response?.data?.message || 'Failed to revert change.');
    } finally {
      setRevertLoading(false);
    }
  };

  if (authUser?.role !== 'Administrator') return <Navigate to="/" replace />;

  return (
    <JobLayout title="User Log" breadcrumbs={['Dashboard', 'Administration', 'User Log']}>
      <main className="p-6 max-w-[1600px] mx-auto w-full space-y-5">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <header className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </span>
              <div>
                <h1 className="font-bold text-slate-900 text-lg">Portal Change History</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Human-readable descriptions for all portal actions, with acting user, timestamp, and instant undo/revert options.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {pagination.total} recorded change(s)
            </span>
          </header>

          <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50/50">
            <label className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, user, action or endpoint..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white"
              />
            </label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All areas</option>
              {['student', 'industry', 'rto', 'workflow', 'placement request', 'appointment', 'payment', 'job', 'user', 'notification'].map((item) => (
                <option key={item} value={item}>
                  {item[0].toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
            </select>
            <button
              onClick={() => loadLogs(pagination.page)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {error && <div className="m-6 p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">When</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Description &amp; Action</th>
                  <th className="px-6 py-3.5">Area / Record</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5 text-center">Revert / Undo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isRevertAction = log.action?.startsWith('reverted');
                  const canRevert = !log.isReverted && !isRevertAction;

                  return (
                    <tr key={log._id} className={`align-top transition ${log.isReverted ? 'bg-purple-50/20' : 'hover:bg-slate-50/70'}`}>
                      {/* Column 1: Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                        {formatDate(log.createdAt)}
                      </td>

                      {/* Column 2: User */}
                      <td className="px-6 py-4 min-w-[160px]">
                        <div className="font-bold text-slate-900 text-xs">{log.actorName}</div>
                        <div className="text-[11px] text-slate-500">
                          {log.actorEmail || '—'}
                          {log.actorRole ? ` · ${log.actorRole}` : ''}
                        </div>
                      </td>

                      {/* Column 3: Description & Badges */}
                      <td className="px-6 py-4 min-w-[320px]">
                        <p className="font-bold text-slate-900 text-xs leading-relaxed">
                          {log.humanDescription || log.action}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.method} · HTTP {log.statusCode}
                          </span>
                          {log.isReverted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-300">
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Reverted by {log.revertedByName || 'Admin'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Area / Record */}
                      <td className="px-6 py-4 text-xs text-slate-600 min-w-[140px]">
                        <div className="font-bold capitalize text-slate-800">{log.resource}</div>
                        <div className="font-mono text-[10px] text-slate-400 break-all">{log.resourceId || log.path}</div>
                      </td>

                      {/* Column 5: Change Details */}
                      <td className="px-6 py-4 min-w-[220px] max-w-[420px]">
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-blue-700 hover:text-blue-900">
                            View submitted changes
                          </summary>
                          <ReadableChanges changes={log.changes || {}} />
                        </details>
                      </td>

                      {/* Column 6: Revert / Undo Action */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {log.isReverted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>Reverted</span>
                          </span>
                        ) : canRevert ? (
                          <button
                            type="button"
                            onClick={() => setRevertingLog(log)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="Revert / Undo this change"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Undo / Revert</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Not reversible</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      No portal changes recorded for these filters.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      Loading change history…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Page {pagination.page} of {Math.max(1, pagination.pages)} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => loadLogs(pagination.page - 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => loadLogs(pagination.page + 1)}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </section>

        {/* =========================================================
            UNDO / REVERT CONFIRMATION MODAL
        ========================================================= */}
        {revertingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-3 text-slate-900 font-bold text-base">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <Undo2 className="w-5 h-5" />
                </div>
                <h3>Undo / Revert Portal Change</h3>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <p className="font-bold text-slate-900">
                  {revertingLog.humanDescription || revertingLog.action}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  By {revertingLog.actorName} &bull; {formatDate(revertingLog.createdAt)}
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong>Confirmation:</strong> This will restore the modified record back to its previous state prior to this action. A new audit log entry will be recorded documenting this revert.
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  disabled={revertLoading}
                  onClick={() => setRevertingLog(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={revertLoading}
                  onClick={handleConfirmRevert}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  {revertLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirm Revert</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </JobLayout>
  );
}
