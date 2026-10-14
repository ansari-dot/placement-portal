import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FileSpreadsheet, Download, Upload, CheckCircle2, XCircle, Loader2,
  FolderOpen, FileText, Users, AlertTriangle, ArrowRight, RefreshCw,
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import {
  downloadBulkTemplate, bulkImportStudents, bulkUploadStudentDocuments,
} from '../api/studentsApi';

const DOC_TYPE_HINTS = [
  ['police', 'Police Check'], ['covid', 'COVID-19'], ['ndis', 'NDIS'], ['resume', 'Resume / CV'],
  ['wwcc', 'WWCC'], ['passport', 'Passport'], ['licence', 'Driving Licence'],
  ['infection', 'Infection Control'], ['hygiene', 'Hand Hygiene'], ['cpr', 'CPR'],
];

const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

function StatCard({ label, value, tone }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <div className={`px-4 py-3 rounded-xl border ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

/* ───────────────────────── Excel import tab ───────────────────────── */
function ExcelImportTab() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dragOver, setDragOver] = useState(false);

  const pickFile = async (f) => {
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) {
      toast.error('Please select an .xlsx Excel file');
      return;
    }
    setFile(f);
    setReport(null);
    setBusy(true);
    try {
      const res = await bulkImportStudents(f, false);
      setReport(res.data);
      setFilter(res.data.invalid > 0 ? 'invalid' : 'all');
    } catch (err) {
      toast.error(errMsg(err, 'Could not read the Excel file'));
      setFile(null);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await bulkImportStudents(file, true);
      setReport(res.data);
      setFilter('all');
      toast.success(res.message);
    } catch (err) {
      toast.error(errMsg(err, 'Import failed'));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setReport(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const rows = (report?.rows || []).filter((r) =>
    filter === 'all' ? true : filter === 'valid' ? r.valid : !r.valid
  );

  return (
    <div className="space-y-5">
      {/* Step 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/40">
        <div>
          <p className="text-xs font-bold text-slate-800">1. Download the template</p>
          <p className="text-[11px] text-slate-500">
            Contains every field from the Add Student form. Red columns are required. Dates as DD/MM/YYYY.
          </p>
        </div>
        <button
          id="download-template-btn"
          onClick={() => downloadBulkTemplate().catch((e) => toast.error(errMsg(e, 'Download failed')))}
          className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-50 transition flex items-center gap-2 shrink-0"
        >
          <Download size={14} /> Download Excel Template
        </button>
      </div>

      {/* Step 2 */}
      {!report && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
          className={`flex flex-col items-center justify-center gap-2 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
          }`}
        >
          {busy ? (
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-9 h-9 text-emerald-600" />
          )}
          <p className="text-sm font-bold text-slate-800">
            {busy ? 'Checking your file…' : '2. Drop your filled Excel file here'}
          </p>
          <p className="text-[11px] text-slate-500">or click to browse (.xlsx, up to 2000 students)</p>
          <input
            id="excel-file-input"
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            disabled={busy}
            onChange={(e) => pickFile(e.target.files[0])}
          />
        </label>
      )}

      {/* Step 3 – preview / result */}
      {report && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <FileSpreadsheet size={16} className="text-emerald-600" />
              <span className="font-semibold">{file?.name}</span>
              {report.committed && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Imported</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={reset} disabled={busy}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5">
                <RefreshCw size={13} /> {report.committed ? 'Import another file' : 'Choose different file'}
              </button>
              {!report.committed && (
                <button id="confirm-import-btn" onClick={handleImport} disabled={busy || report.valid === 0}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Import {report.valid} valid student{report.valid === 1 ? '' : 's'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Rows in file" value={report.total} tone="slate" />
            <StatCard label="Ready / valid" value={report.valid} tone="green" />
            <StatCard label="With errors" value={report.invalid} tone="red" />
            <StatCard label="Imported" value={report.created} tone="blue" />
          </div>

          {report.unknownHeaders?.length > 0 && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-[11px] text-amber-800 flex gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Ignored unknown columns: {report.unknownHeaders.join(', ')}</span>
            </div>
          )}

          {!report.committed && report.invalid > 0 && (
            <p className="text-[11px] text-slate-500">
              Rows with errors will be skipped. Fix them in Excel and re-upload, or import the valid rows now.
            </p>
          )}

          {report.committed && report.created > 0 && (
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-800 flex items-center justify-between gap-2">
              <span>Students created. Now upload their documents in the <b>Documents</b> tab using the Student IDs below.</span>
              <Link to="/my-students" className="font-bold flex items-center gap-1 hover:underline shrink-0">
                View students <ArrowRight size={12} />
              </Link>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit text-[11px] font-semibold">
            {[['all', 'All'], ['valid', 'Valid'], ['invalid', 'Errors']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`px-3 py-1 rounded-md transition ${filter === k ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 w-14">Row</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Student ID</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.row} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2 text-slate-400">{r.row}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {r.id ? <Link to={`/students/${r.id}/view`} className="hover:text-blue-600">{r.name || '—'}</Link> : (r.name || '—')}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{r.studentId || <span className="italic text-slate-400">auto</span>}</td>
                      <td className="px-3 py-2">
                        {r.valid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 size={13} /> {r.imported ? 'Imported' : 'Ready'}
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            {r.errors.map((e, i) => (
                              <div key={i} className="flex items-start gap-1 text-rose-600">
                                <XCircle size={12} className="mt-0.5 shrink-0" /> <span>{e}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Documents tab ───────────────────────── */
function DocumentsTab() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (list) => {
    const arr = Array.from(list || []).filter((f) => /\.(pdf|jpe?g|png|docx?|webp)$/i.test(f.name));
    if (!arr.length) { toast.error('Only PDF, JPG, PNG, DOC files are allowed'); return; }
    setReport(null);
    setFiles((prev) => [...prev, ...arr].slice(0, 500));
  };

  const upload = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const res = await bulkUploadStudentDocuments(files, setProgress);
      setReport(res.data);
      setFiles([]);
      res.data.failed ? toast.warning(res.message) : toast.success(res.message);
    } catch (err) {
      toast.error(errMsg(err, 'Upload failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
        <p className="text-xs font-bold text-slate-800">How to name files</p>
        <p className="text-[11px] text-slate-600">
          <code className="px-1.5 py-0.5 bg-white rounded border border-slate-200">STUDENTID_type.pdf</code> or{' '}
          <code className="px-1.5 py-0.5 bg-white rounded border border-slate-200">email@x.com_type.pdf</code> — or one folder per student:{' '}
          <code className="px-1.5 py-0.5 bg-white rounded border border-slate-200">STU12/police.pdf</code>
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DOC_TYPE_HINTS.map(([k, l]) => (
            <span key={k} className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] text-slate-600">
              <b className="text-blue-700">{k}</b> → {l}
            </span>
          ))}
          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] text-slate-600">
            anything else → Additional document
          </span>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
        }`}
      >
        <FileText className="w-9 h-9 text-blue-600" />
        <p className="text-sm font-bold text-slate-800">Drop student documents here</p>
        <div className="flex gap-2">
          <label className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
            <Upload size={13} /> Select files
            <input id="docs-file-input" type="file" multiple className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.webp" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
          <label className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
            <FolderOpen size={13} /> Select folder
            <input id="docs-folder-input" type="file" multiple webkitdirectory="" directory="" className="hidden"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">{files.length} file{files.length === 1 ? '' : 's'} selected</p>
            <div className="flex gap-2">
              <button onClick={() => setFiles([])} disabled={busy}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Clear</button>
              <button id="upload-docs-btn" onClick={upload} disabled={busy}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-60">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {busy ? `Uploading ${progress}%` : 'Upload & attach to profiles'}
              </button>
            </div>
          </div>
          {busy && (
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {files.map((f, i) => (
              <div key={i} className="px-3 py-1.5 text-[11px] text-slate-600 flex justify-between">
                <span className="truncate">{f.webkitRelativePath || f.name}</span>
                <span className="text-slate-400 shrink-0 ml-3">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Files" value={report.total} tone="slate" />
            <StatCard label="Attached" value={report.attached} tone="green" />
            <StatCard label="Not matched" value={report.failed} tone="red" />
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Saved as</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-600 truncate max-w-[240px]">{r.file}</td>
                    <td className="px-3 py-2">
                      {r.matched
                        ? <span className="font-semibold text-slate-800">{r.studentName} <span className="text-slate-400 font-normal">({r.studentId})</span></span>
                        : <span className="text-rose-600 flex items-center gap-1"><XCircle size={12} /> {r.error}</span>}
                    </td>
                    <td className="px-3 py-2">
                      {r.matched && <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 size={12} /> {r.document}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */
export default function BulkImportStudentsPage() {
  const [tab, setTab] = useState('excel');
  const tabs = [
    { key: 'excel', label: 'Students from Excel', icon: Users },
    { key: 'docs', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header title="Bulk Import Students" breadcrumbs={['Dashboard', 'My List', 'Bulk Import']} />
        <main className="p-4 max-w-[1600px] w-full mx-auto">
          <h1 className="sr-only">Bulk Import Students</h1>
          <div className="flex items-center space-x-1 mb-4 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 w-fit">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} id={`bulk-tab-${key}`} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 transition ${
                  tab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon size={13} /><span>{label}</span>
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            {/* keep both mounted so state survives tab switches */}
            <div className={tab === 'excel' ? '' : 'hidden'}><ExcelImportTab /></div>
            <div className={tab === 'docs' ? '' : 'hidden'}><DocumentsTab /></div>
          </div>
        </main>
      </div>
    </div>
  );
}
