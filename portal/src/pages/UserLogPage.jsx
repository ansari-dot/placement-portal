import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, ClipboardList, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import JobLayout from '../components/layout/JobLayout';
import { fetchUserLogs } from '../api/userLogApi';

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';
const humanLabel = (key) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]/g, ' ')
  .replace(/\b\w/g, letter => letter.toUpperCase());

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
    if (value.every(item => item == null || ['string', 'number', 'boolean'].includes(typeof item))) {
      return value.map(item => displayValue(item)).join(', ');
    }
    return <div className="space-y-2">{value.slice(0, 30).map((item, index) => <div key={index} className="rounded-lg bg-white border border-slate-100 p-2"><span className="text-[10px] uppercase text-slate-400">Item {index + 1}</span><ChangeFields data={item} /></div>)}</div>;
  }
  if (typeof value === 'object') {
    if (value._id && Object.keys(value).length <= 2) return String(value.name || value._id);
    return <ChangeFields data={value} />;
  }
  return String(value);
};

function ChangeFields({ data }) {
  if (!data || typeof data !== 'object') return <span>{displayValue(data)}</span>;
  const entries = Object.entries(data).filter(([key]) =>
    !['_id', 'id', '__v', 'password', 'createdAt', 'updatedAt'].includes(key) && !/token|secret|authorization|cookie/i.test(key)
  );
  if (!entries.length) return <span className="text-slate-400">No additional details</span>;
  return (
    <dl className="space-y-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.5fr)] gap-3 border-b border-slate-100 last:border-0 py-1">
          <dt className="text-slate-500">{humanLabel(key)}</dt>
          <dd className="text-slate-800 break-words">{displayValue(value, key)}</dd>
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
        {submitted?.params && Object.keys(submitted.params).length > 0 && <div className="mt-2 pt-2 border-t border-slate-200"><span className="font-semibold text-slate-500">Record Reference</span><ChangeFields data={submitted.params} /></div>}
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
  const authUser = useSelector(state => state.auth?.user);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [resource, setResource] = useState('All');
  const [method, setMethod] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async (page = 1) => {
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
  }, [authUser?.role, search, resource, method]);

  useEffect(() => { loadLogs(1); }, [loadLogs]);

  if (authUser?.role !== 'Administrator') return <Navigate to="/" replace />;

  return (
    <JobLayout title="User Log" breadcrumbs={['Dashboard', 'Administration', 'User Log']}>
      <main className="p-6 max-w-[1600px] mx-auto w-full space-y-5">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <header className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><ClipboardList className="w-5 h-5" /></span>
              <div>
                <h1 className="font-bold text-slate-900">Portal Change History</h1>
                <p className="text-xs text-slate-500 mt-1">Successful changes made throughout the portal, with the acting user and submitted values.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">{pagination.total} recorded changes</span>
          </header>

          <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-slate-100">
            <label className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action or endpoint" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500" />
            </label>
            <select value={resource} onChange={e => setResource(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700">
              <option value="All">All areas</option>
              {['student', 'industry', 'rto', 'workflow', 'placement request', 'appointment', 'placement', 'job', 'user', 'notification'].map(item => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
            </select>
            <select value={method} onChange={e => setMethod(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700">
              <option value="All">All actions</option><option value="created">Created</option><option value="updated">Updated</option><option value="deleted">Deleted</option>
            </select>
            <button onClick={() => loadLogs(pagination.page)} className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
          </div>

          {error && <div className="m-6 p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-6 py-3">When</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Action</th><th className="px-6 py-3">Area / Record</th><th className="px-6 py-3">Change details</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log._id} className="align-top hover:bg-slate-50/70">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4 min-w-[180px]"><div className="font-semibold text-slate-800">{log.actorName}</div><div className="text-xs text-slate-500">{log.actorEmail || '—'}{log.actorRole ? ` · ${log.actorRole}` : ''}</div></td>
                    <td className="px-6 py-4"><span className="inline-flex px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">{log.action}</span><div className="text-[11px] text-slate-400 mt-1">{log.method} · HTTP {log.statusCode}</div></td>
                    <td className="px-6 py-4 text-xs text-slate-600"><div className="font-semibold capitalize">{log.resource}</div><div className="font-mono text-[10px] break-all">{log.resourceId || log.path}</div></td>
                    <td className="px-6 py-4 min-w-[260px] max-w-[520px]">
                      <details><summary className="cursor-pointer text-xs font-semibold text-blue-700">View change details</summary><ReadableChanges changes={log.changes || {}} /></details>
                    </td>
                  </tr>
                ))}
                {!loading && logs.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">No portal changes recorded for these filters.</td></tr>}
                {loading && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">Loading change history…</td></tr>}
              </tbody>
            </table>
          </div>

          <footer className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {pagination.page} of {Math.max(1, pagination.pages)}</span>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1 || loading} onClick={() => loadLogs(pagination.page - 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={pagination.page >= pagination.pages || loading} onClick={() => loadLogs(pagination.page + 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </footer>
        </section>
      </main>
    </JobLayout>
  );
}
