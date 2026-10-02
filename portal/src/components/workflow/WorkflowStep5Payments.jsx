import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2,
  DollarSign,
  UserCheck,
  ChevronDown,
  Layers,
  Info,
  Printer,
  Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  fetchPayments,
  fetchPaymentTotals,
  updatePaymentStatus,
  bulkGenerateInvoices,
  bulkMarkPaymentReceived,
} from '../../api/paymentApi';
import { fetchRtos } from '../../api/rtoApi';
import PaymentInvoiceModal from './PaymentInvoiceModal';

const PLACEMENT_STATUSES = [
  'Appointment Scheduled',
  'Appointment Successful',
  'Student Withdraw',
  'Student Missed Appointment',
  'Placement Started',
  'Placement Completed',
];

const PAYMENT_STATUSES = [
  'Pending',
  'Invoice Sent',
  '30% Received',
  'Full Payment Received',
];

const getPlacementStatusBadge = (status) => {
  // Match badge colors used in other steps (e.g., Internships)
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Placement Started':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'Joined':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Waiting to Join':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Completed':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Placement Completed':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Appointment Successful':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Declined':
    case 'Industry Rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Student Missed Appointment':
    case 'Student Withdraw':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Not Suitable Site':
      return 'bg-amber-50 text-amber-800 border-amber-400';
    case 'Withdrawn':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

const getPaymentStatusBadge = (status) => {
  switch (status) {
    case 'Invoice Sent':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case '30% Received':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Full Payment Received':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Pending':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

export default function WorkflowStep5Payments() {
  const [payments, setPayments] = useState([]);
  const [totals, setTotals] = useState({
    total100Price: 0,
    total30Price: 0,
    totalRevenue: 0,
    totalCount: 0,
    missingPricingCount: 0,
  });
  const [rtos, setRtos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter States
  const [selectedRto, setSelectedRto] = useState('All');
  const [selectedPlacementStatus, setSelectedPlacementStatus] = useState('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Confirmation Modal States
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: null, // 'invoice' | 'received'
    title: '',
    message: '',
    count: 0,
  });

  // Invoice Preview Modal State
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    payments: [],
  });

  const openSingleInvoiceModal = (paymentRecord) => {
    setInvoiceModal({
      isOpen: true,
      payments: [paymentRecord],
    });
  };

  const openSelectedInvoiceModal = () => {
    if (selectedIds.length === 0) {
      toast.info('Please select at least one student first.');
      return;
    }
    const selected = payments.filter((p) => selectedIds.includes(p._id || p.id));
    setInvoiceModal({
      isOpen: true,
      payments: selected,
    });
  };

  const handleInvoiceModalConfirm = async () => {
    try {
      const idsToUpdate = invoiceModal.payments.map((p) => p._id || p.id);
      if (idsToUpdate.length > 0) {
        const res = await bulkGenerateInvoices(idsToUpdate);
        toast.success(res.message || 'Invoices marked as sent successfully!');
        setInvoiceModal({ isOpen: false, payments: [] });
        setSelectedIds([]);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update invoice status:', err);
      toast.error('Failed to update invoice status.');
    }
  };

  // Fetch RTOs list for filter dropdown
  useEffect(() => {
    fetchRtos()
      .then((res) => {
        if (res && res.data) {
          setRtos(res.data);
        }
      })
      .catch((err) => console.error('Failed to fetch RTOs for filter:', err));
  }, []);

  // Fetch payments and dynamic totals from backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        rto: selectedRto,
        placementStatus: selectedPlacementStatus,
        paymentStatus: selectedPaymentStatus,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: searchQuery || undefined,
      };

      const [paymentsRes, totalsRes] = await Promise.all([
        fetchPayments(params),
        fetchPaymentTotals(params),
      ]);

      if (paymentsRes && paymentsRes.data) {
        setPayments(paymentsRes.data);
      }
      if (totalsRes && totalsRes.data) {
        setTotals(totalsRes.data);
      }
    } catch (err) {
      console.error('Failed to load payment data:', err);
      toast.error('Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  }, [selectedRto, selectedPlacementStatus, selectedPaymentStatus, fromDate, toDate, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle single payment status change from dropdown
  const handleSingleStatusChange = async (paymentId, newStatus) => {
    try {
      await updatePaymentStatus(paymentId, newStatus);
      toast.success(`Status updated to "${newStatus}"`);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.message || 'Failed to update payment status.');
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(payments.map((p) => p._id || p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Trigger Bulk Confirmation Modal
  const openBulkInvoiceModal = () => {
    if (selectedIds.length === 0) {
      toast.info('Please select at least one student first.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      actionType: 'invoice',
      title: 'Generate Invoices',
      message: `Are you sure you want to generate/send invoices for ${selectedIds.length} selected student(s)? Payment status will update to "Invoice Sent" and current date will be recorded.`,
      count: selectedIds.length,
    });
  };

  const openBulkReceivedModal = () => {
    if (selectedIds.length === 0) {
      toast.info('Please select at least one student first.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      actionType: 'received',
      title: 'Mark Payment Received',
      message: `Are you sure you want to mark payment as received for ${selectedIds.length} selected student(s)? 100% charge students will update to "Full Payment Received" and 30% charge students will update to "30% Received".`,
      count: selectedIds.length,
    });
  };

  // Execute confirmed bulk action
  const executeBulkAction = async () => {
    const { actionType } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      if (actionType === 'invoice') {
        const res = await bulkGenerateInvoices(selectedIds);
        toast.success(res.message || 'Invoices generated successfully!');
      } else if (actionType === 'received') {
        const res = await bulkMarkPaymentReceived(selectedIds);
        toast.success(res.message || 'Payments marked as received successfully!');
      }
      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error('Bulk action error:', err);
      toast.error(err.response?.data?.message || 'Bulk action failed.');
    }
  };

  const resetFilters = () => {
    setSelectedRto('All');
    setSelectedPlacementStatus('All');
    setSelectedPaymentStatus('All');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setSelectedIds([]);
  };

  // Compute payment status metrics for top cards
  const metrics = useMemo(() => {
    const total = payments.length;
    const pending = payments.filter((p) => (p.paymentStatus || 'Pending') === 'Pending').length;
    const invoiceSent = payments.filter((p) => p.paymentStatus === 'Invoice Sent').length;
    const received30 = payments.filter((p) => p.paymentStatus === '30% Received').length;
    const fullReceived = payments.filter((p) => p.paymentStatus === 'Full Payment Received').length;
    return { total, pending, invoiceSent, received30, fullReceived };
  }, [payments]);

  const isAllSelected = payments.length > 0 && selectedIds.length === payments.length;

  return (
    <div className="space-y-5 select-none">
      {/* =========================================================
          HEADER ROW (Matching Step 1-4 Clean Header Style)
      ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Step 5 — Payments Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track chargeable students, calculate 100% & 30% RTO course fees, manage invoice dates, and record payments.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          TOP METRICS CARDS (Matching Step 4 Internships Metric Cards)
      ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Chargeable</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.total}</h3>
          </div>
          <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center border border-slate-100">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Pending</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.pending}</h3>
          </div>
          <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Invoice Sent</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.invoiceSent}</h3>
          </div>
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">30% Received</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.received30}</h3>
          </div>
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Full Received</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.fullReceived}</h3>
          </div>
          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* =========================================================
          FILTERS SECTION
      ========================================================= */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Search & Filter Payments</span>
          </div>
          <button
            onClick={resetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center space-x-1"
          >
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, ID, or RTO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* RTO Filter */}
          <div>
            <select
              value={selectedRto}
              onChange={(e) => setSelectedRto(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition font-medium text-slate-700"
            >
              <option value="All">All RTOs</option>
              {rtos.map((rto) => (
                <option key={rto._id || rto.id} value={rto.name}>
                  {rto.name}
                </option>
              ))}
            </select>
          </div>

          {/* Placement Status Filter */}
          <div>
            <select
              value={selectedPlacementStatus}
              onChange={(e) => setSelectedPlacementStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition font-medium text-slate-700"
            >
              <option value="All">All Placement Statuses</option>
              {PLACEMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition font-medium text-slate-700"
            >
              <option value="All">All Payment Statuses</option>
              {PAYMENT_STATUSES.map((pst) => (
                <option key={pst} value={pst}>
                  {pst}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="flex space-x-1.5">
            <input
              type="date"
              title="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition text-slate-700"
            />
            <input
              type="date"
              title="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          BULK ACTIONS BAR
      ========================================================= */}
      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xs flex flex-wrap sm:flex-row items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-semibold">Select All ({payments.length})</span>
          </label>
          {selectedIds.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-medium">
              {selectedIds.length} Selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openSelectedInvoiceModal}
            disabled={selectedIds.length === 0}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedIds.length > 0
                ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-xs cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Preview & Print ({selectedIds.length})</span>
          </button>

          <button
            onClick={openBulkInvoiceModal}
            disabled={selectedIds.length === 0}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedIds.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Invoice</span>
          </button>

          <button
            onClick={openBulkReceivedModal}
            disabled={selectedIds.length === 0}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedIds.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Payment Received</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          PAYMENTS TABLE
      ========================================================= */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading payments data...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <Info className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No chargeable students found</p>
            <p className="text-xs text-slate-500 max-w-md">
              Students become visible in Payments once their placement reaches <strong>Appointment Scheduled</strong> or higher.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 w-8 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Student Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">RTO Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">Placement Status</th>
                  <th className="py-3 px-3 whitespace-nowrap">Invoice Date</th>
                  <th className="py-3 px-3 whitespace-nowrap">Payment Date</th>
                  <th className="py-3 px-3 whitespace-nowrap">Payment Status</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Payment Amount</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => {
                  const pId = p._id || p.id;
                  const isSelected = selectedIds.includes(pId);
                  const is30Pct = p.chargePercentage === 30;

                  return (
                    <tr
                      key={pId}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(pId)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Column 1 — Student Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{p.studentName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                            {p.studentId || 'N/A'}
                          </span>
                          {p.course && <span className="truncate max-w-[140px] inline-block">{p.course}</span>}
                        </div>
                      </td>

                      {/* Column 2 — RTO Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px] inline-block">{p.rto || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Column 3 — Placement Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPlacementStatusBadge(
                            p.placementStatus
                          )}`}
                        >
                          {p.placementStatus}
                        </span>
                      </td>

                      {/* Column 4 — Invoice Generated Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formatDate(p.invoiceGeneratedDate)}
                      </td>

                      {/* Column 5 — Payment Received Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formatDate(p.paymentReceivedDate)}
                      </td>

                      {/* Column 6 — Payment Status Control */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={p.paymentStatus || 'Pending'}
                          onChange={(e) => handleSingleStatusChange(pId, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border cursor-pointer shadow-2xs focus:outline-none transition ${getPaymentStatusBadge(
                            p.paymentStatus
                          )}`}
                        >
                          {PAYMENT_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-white text-slate-800 font-normal">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Column 7 — Payment Amount */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        {!p.priceConfigured ? (
                          <div className="flex flex-col items-end">
                            <span className="text-rose-600 font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>AUD 0</span>
                            </span>
                            <span className="text-[10px] text-rose-500 font-medium">Unconfigured RTO price</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-slate-900 text-xs">
                              AUD {p.paymentAmount?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                is30Pct
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {is30Pct ? `30% Charge` : '100% Charge'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Column 8 — Actions (Preview / Print Invoice) */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => openSingleInvoiceModal(p)}
                          title="Preview & Print Tax Invoice"
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition border border-slate-200 shadow-2xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================
          TOTALS SUMMARY SECTION (Consistent slate summary box)
      ========================================================= */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Summary Totals (Reflects Active Filters)</span>
          </div>
          {totals.missingPricingCount > 0 && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{totals.missingPricingCount} student(s) have unconfigured RTO pricing</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total 100% Price */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Total 100% Price</div>
            <div className="text-xl font-bold text-white mt-1">
              AUD {totals.total100Price?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Full price for Scheduled, Successful, Started, & Completed placements
            </div>
          </div>

          {/* Total 30% Price */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Total 30% Price</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              AUD {totals.total30Price?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              30% price for Withdraw & Missed Appointment placements
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-500/30">
            <div className="text-xs text-emerald-300 font-medium">Total Revenue</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              AUD {totals.totalRevenue?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-1">
              Sum of Total 100% Price + Total 30% Price
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          BULK ACTION CONFIRMATION MODAL
      ========================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-slate-900 font-bold text-base mb-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h3>{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
              >
                Confirm Action ({confirmModal.count})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAX INVOICE PREVIEW & PRINT MODAL
      ========================================================= */}
      <PaymentInvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, payments: [] })}
        payments={invoiceModal.payments}
        onConfirmStatusUpdate={handleInvoiceModalConfirm}
      />
    </div>
  );
}
