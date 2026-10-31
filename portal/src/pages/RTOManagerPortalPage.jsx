import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { fetchStudents, openStudentDocument, isStoredDocument } from '../api/studentsApi';
import { fetchWorkflows } from '../api/workflowApi';
import { fetchPayments, fetchPaymentTotals, downloadInvoicePDF } from '../api/paymentApi';
import { fetchMyRtos, fetchRtos } from '../api/rtoApi';
import { fetchMyReviews } from '../api/reviewApi';
import { fetchAttendanceRecords } from '../api/attendanceApi';
import ReviewSubmitModal from '../components/review/ReviewSubmitModal';
import {
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Filter,
  Building2,
  UserCheck,
  UserPlus,
  Star,
  Layers,
  ShieldCheck,
  CreditCard,
  Download,
  Eye,
  X,
  ChevronRight,
  FileText,
  Check,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  CalendarClock,
  Mail,
  Phone,
  MapPin,
  Award,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function RTOManagerPortalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  // Data State
  const [students, setStudents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [paymentTotals, setPaymentTotals] = useState({ totalAmount: 0, paidAmount: 0, pendingAmount: 0 });
  const [rtoProfile, setRtoProfile] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [invoiceFilter, setInvoiceFilter] = useState('All');

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

  const handleTabChange = (viewKey) => {
    setSearchParams({ view: viewKey });
  };

  useEffect(() => {
    loadAllRTOData();
  }, []);

  const loadAllRTOData = async () => {
    setLoading(true);
    try {
      const [
        studentsRes,
        workflowsRes,
        paymentsRes,
        totalsRes,
        rtoRes,
        reviewsRes,
        attendanceRes,
      ] = await Promise.allSettled([
        fetchStudents(),
        fetchWorkflows(),
        fetchPayments(),
        fetchPaymentTotals(),
        fetchMyRtos().catch(() => fetchRtos()),
        fetchMyReviews(),
        fetchAttendanceRecords(),
      ]);

      if (studentsRes.status === 'fulfilled') {
        const list = studentsRes.value?.data ?? studentsRes.value ?? [];
        setStudents(Array.isArray(list) ? list : []);
      }
      if (workflowsRes.status === 'fulfilled') {
        const wfList = workflowsRes.value?.data ?? workflowsRes.value ?? [];
        setWorkflows(Array.isArray(wfList) ? wfList : []);
      }
      if (paymentsRes.status === 'fulfilled') {
        const payList = paymentsRes.value?.data ?? paymentsRes.value ?? [];
        setPayments(Array.isArray(payList) ? payList : []);
      }
      if (totalsRes.status === 'fulfilled') {
        const t = totalsRes.value?.data ?? totalsRes.value ?? {};
        setPaymentTotals({
          totalAmount: t.totalAmount || 0,
          paidAmount: t.paidAmount || 0,
          pendingAmount: t.pendingAmount || 0,
        });
      }
      if (rtoRes.status === 'fulfilled') {
        const rtoList = rtoRes.value?.data ?? rtoRes.value ?? [];
        if (Array.isArray(rtoList) && rtoList.length > 0) {
          setRtoProfile(rtoList[0]);
        } else if (rtoList && typeof rtoList === 'object' && !Array.isArray(rtoList)) {
          setRtoProfile(rtoList);
        }
      }
      if (reviewsRes.status === 'fulfilled') {
        const revList = reviewsRes.value?.data ?? reviewsRes.value ?? [];
        setMyReviews(Array.isArray(revList) ? revList : []);
      }
      if (attendanceRes.status === 'fulfilled') {
        const attList = attendanceRes.value?.data ?? attendanceRes.value ?? [];
        setAttendanceRecords(Array.isArray(attList) ? attList : []);
      }
    } catch (err) {
      console.error('Error loading RTO portal data:', err);
      toast.error('Unable to sync complete RTO records.');
    } finally {
      setLoading(false);
    }
  };

  // Student keys for strictly scoped appointments
  const myStudentKeys = useMemo(() => {
    const keys = new Set();
    students.forEach((s) => {
      if (s._id) keys.add(String(s._id));
      if (s.id) keys.add(String(s.id));
      if (s.studentId) keys.add(String(s.studentId).trim());
      const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const sName = (s.name || sFullName).trim().toLowerCase();
      if (sName) keys.add(sName);
      if (sFullName) keys.add(sFullName);
    });
    return keys;
  }, [students]);

  const allAppointments = useMemo(() => {
    return workflows.flatMap((wf) => wf.appointments || []);
  }, [workflows]);

  // Appointments scoped strictly to this RTO's students
  const myAppointments = useMemo(() => {
    const list = [];
    allAppointments.forEach((a) => {
      const aId = String(a.studentId || '').trim();
      const aDbId = String(a._id || '').trim();
      const aName = String(a.student || a.studentName || '').trim().toLowerCase();
      if (myStudentKeys.has(aId) || myStudentKeys.has(aDbId) || myStudentKeys.has(aName)) {
        list.push({
          ...a,
          company: 'Host Facility Partner',
        });
      }
    });

    students.forEach((s) => {
      if (
        s.appointmentDate &&
        !list.some((a) => String(a.studentId).trim() === String(s.studentId).trim())
      ) {
        list.push({
          student: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          studentId: s.studentId,
          date: s.appointmentDate,
          time: s.appointmentTime || '10:00 AM',
          type: 'On-site Orientation',
          company: 'Host Facility Partner',
          status: s.placementStatus || 'Scheduled',
          commencementDate: s.commencementDate,
        });
      }
    });

    return list;
  }, [students, allAppointments, myStudentKeys]);

  // Distinct courses for dropdown filter
  const distinctCourses = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const c = s.course || s.courseQualification;
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set);
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
      const sId = (s.studentId || s.id || '').toLowerCase();
      const sCourse = (s.course || s.courseQualification || '').toLowerCase();
      const q = search.toLowerCase().trim();

      const matchesSearch = !q || sName.includes(q) || sId.includes(q) || sCourse.includes(q);
      const matchesStatus =
        statusFilter === 'All' ||
        (s.placementStatus || s.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesCourse =
        courseFilter === 'All' ||
        (s.course || s.courseQualification || '').toLowerCase() === courseFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [students, search, statusFilter, courseFilter]);

  // Metrics for KPI Cards
  const totalEnrolled = students.length;
  const orientationScheduled = myAppointments.length;
  const activePlacements = students.filter((s) =>
    ['Placement Started', 'Joined', 'Active'].includes(s.placementStatus || s.status)
  ).length;
  const completedPlacements = students.filter((s) =>
    ['Placement Completed', 'Completed'].includes(s.placementStatus || s.status)
  ).length;

  // Compliance summary
  const complianceStats = useMemo(() => {
    let clearedCount = 0;
    students.forEach((s) => {
      const hasPolice = Boolean(s.policeCheckDoc);
      const hasWwcc = Boolean(s.wwccDoc);
      const hasNdis = Boolean(s.ndisDoc);
      const hasCpr = Boolean(s.cbrDoc);
      const hasCovid = Boolean(s.covidCheckDoc);
      const hasResume = Boolean(s.resumeDoc || s.resumeFile || s.hasResume === 'Yes');
      if (hasPolice && hasWwcc && hasNdis && hasCpr && hasCovid && hasResume) {
        clearedCount++;
      }
    });
    const pct = totalEnrolled > 0 ? Math.round((clearedCount / totalEnrolled) * 100) : 0;
    return { clearedCount, pct };
  }, [students, totalEnrolled]);

  // Pipeline Stages
  const pipelineStages = useMemo(() => {
    return {
      enrolled: students.filter((s) =>
        ['Awaiting', 'Inactive', 'Enrolled'].includes(s.placementStatus || s.status || 'Awaiting')
      ),
      sourcing: students.filter((s) =>
        ['In Progress', 'Industry Contacted', 'Sourcing'].includes(s.placementStatus || s.status)
      ),
      interview: students.filter((s) =>
        ['Appointment Scheduled', 'Orientation Scheduled', 'Appointment Successful'].includes(
          s.placementStatus || s.status
        )
      ),
      active: students.filter((s) =>
        ['Placement Started', 'Joined', 'Active'].includes(s.placementStatus || s.status)
      ),
      completed: students.filter((s) =>
        ['Placement Completed', 'Completed'].includes(s.placementStatus || s.status)
      ),
    };
  }, [students]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return payments.filter((pay) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (pay.invoiceNumber && pay.invoiceNumber.toLowerCase().includes(q)) ||
        (pay.studentName && pay.studentName.toLowerCase().includes(q)) ||
        (pay.studentId && pay.studentId.toLowerCase().includes(q));

      const isPaid = pay.paymentStatus === 'Paid' || pay.paymentStatus === 'Full Payment Received';
      const isIssued = Boolean(pay.invoiceNumber);

      let matchesFilter = true;
      if (invoiceFilter === 'Generated') matchesFilter = isIssued;
      else if (invoiceFilter === 'Paid') matchesFilter = isPaid;
      else if (invoiceFilter === 'Pending') matchesFilter = isIssued && !isPaid;

      return matchesSearch && matchesFilter;
    });
  }, [payments, search, invoiceFilter]);

  const generatedInvoicesCount = useMemo(() => {
    return payments.filter((p) => Boolean(p.invoiceNumber)).length;
  }, [payments]);

  // Download Invoice PDF
  const handleDownloadInvoice = async (invoiceNumber) => {
    if (!invoiceNumber) return;
    try {
      setDownloadingInvoice(invoiceNumber);
      toast.info(`Generating official PDF for Invoice #${invoiceNumber}...`);
      const blob = await downloadInvoicePDF(invoiceNumber);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Invoice #${invoiceNumber} downloaded successfully.`);
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Unable to download invoice PDF.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Safe document opener
  const handleOpenDoc = (docPath, docTitle = 'Compliance Document') => {
    if (!docPath) {
      toast.warning('No document file attached.');
      return;
    }
    if (isStoredDocument(docPath)) {
      openStudentDocument(docPath);
    } else if (typeof docPath === 'string' && docPath.startsWith('http')) {
      window.open(docPath, '_blank', 'noopener,noreferrer');
    } else {
      toast.info(`${docTitle} is registered on student profile.`);
    }
  };

  // Breadcrumb titles
  const viewTitles = {
    dashboard: 'Dashboard',
    students: 'Enrolled Students',
    pipeline: 'Placement Pipeline',
    interviews: 'Interviews & Schedule',
    placements: 'Placements & Hours',
    compliance: 'Compliance Clearances',
    invoices: 'Invoices & Billing',
    profile: 'RTO Profile',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header
          title="RTO Management Portal"
          breadcrumbs={['Dashboard', 'RTO Portal', viewTitles[currentView] || 'Overview']}
        />

        <main className="p-5 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* ========================================================
              TOP BANNER — Matches Admin / Industry Portal Theme
          ========================================================= */}
          <div className="bg-gradient-to-r from-[#0147A6] via-[#0B6DC8] to-[#02AFA9] text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold">
                    {rtoProfile?.name || 'Registered Training Organisation (RTO)'}
                  </h2>
                  <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-semibold backdrop-blur-xs">
                    RTO Partner
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Live placement pipeline, enrolled students, attendance hours, clearances, and invoices
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {myReviews.length === 0 ? (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
                  <span>Rate & Review</span>
                </button>
              ) : (
                <span className="flex items-center space-x-1 px-3 py-2 bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Review Submitted ({myReviews[0]?.rating || 5}★)</span>
                </span>
              )}

              <Link
                to="/add-student"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-xs transition"
              >
                <UserPlus className="w-4 h-4 text-blue-700" />
                <span>Add Student</span>
              </Link>
            </div>
          </div>

          {/* ========================================================
              VIEW 1: OVERVIEW & DASHBOARD (Matches Admin Dashboard)
          ========================================================= */}
          {currentView === 'dashboard' && (
            <div className="space-y-5">
              {/* Top Sub-header Row */}
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Overview & Live Analytics</h3>
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
                  <Calendar size={13} className="text-slate-500" />
                  <span>Real-Time RTO Data</span>
                </div>
              </div>

              {/* Top 4 KPI Cards (Admin Dashboard Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Students */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl self-start">
                    <Users size={22} />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">Total Students</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">
                          {totalEnrolled}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">In Pipeline</span>
                        <span className="text-sm font-bold text-blue-600 leading-none">
                          {pipelineStages.sourcing.length + pipelineStages.interview.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
                        <TrendingUp size={13} className="stroke-[2.5]" />
                        <span>Enrolled Cohort</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Active Placements */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl self-start">
                    <Briefcase size={22} />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">Active Placements</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">
                          {activePlacements}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">Completed</span>
                        <span className="text-sm font-bold text-teal-600 leading-none">{completedPlacements}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
                        <TrendingUp size={13} className="stroke-[2.5]" />
                        <span>Logging Hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Scheduled Orientations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl self-start">
                    <CalendarClock size={22} />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">Orientations</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">
                          {orientationScheduled}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1 text-[11px] text-amber-600 font-semibold leading-none">
                        <Clock size={13} className="stroke-[2.5]" />
                        <span>Upcoming Meetings</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Compliance Status */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-[auto_1fr] gap-4 items-center">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl self-start">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">Compliance Cleared</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">
                          {complianceStats.pct}%
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-medium block leading-tight">Cleared</span>
                        <span className="text-sm font-bold text-teal-600 leading-none">
                          {complianceStats.clearedCount}/{totalEnrolled}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold leading-none">
                        <CheckCircle2 size={13} className="stroke-[2.5]" />
                        <span>Mandatory Checks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: Pipeline Stages Breakdown (2 cols) & Billing Overview (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Placement Pipeline Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-2">
                        <Layers className="text-blue-600" size={18} />
                        <h3 className="text-base font-bold text-slate-900">Placement Pipeline</h3>
                      </div>
                      <button
                        onClick={() => handleTabChange('pipeline')}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-0.5"
                      >
                        <span>View Pipeline</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: 'Onboarding', count: pipelineStages.enrolled.length, icon: <Clock size={16} className="text-slate-500" />, bg: 'bg-slate-50' },
                        { label: 'Sourcing', count: pipelineStages.sourcing.length, icon: <Search size={16} className="text-blue-500" />, bg: 'bg-blue-50' },
                        { label: 'Orientation', count: pipelineStages.interview.length, icon: <CalendarClock size={16} className="text-amber-500" />, bg: 'bg-amber-50' },
                        { label: 'Active Placement', count: pipelineStages.active.length, icon: <Briefcase size={16} className="text-teal-500" />, bg: 'bg-teal-50' },
                        { label: 'Completed', count: pipelineStages.completed.length, icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 transition">
                          <div className={`p-2.5 rounded-lg mb-2 ${item.bg}`}>
                            {item.icon}
                          </div>
                          <span className="text-xl font-extrabold text-slate-900 mb-0.5">{item.count}</span>
                          <span className="text-[11px] text-slate-500 font-medium leading-tight">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Invoices & Statements Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="text-teal-600" size={18} />
                        <h3 className="text-base font-bold text-slate-900">Invoices & Statements</h3>
                      </div>
                      <button
                        onClick={() => handleTabChange('invoices')}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-0.5"
                      >
                        <span>View All</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={16} />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Total Invoiced</span>
                            <span className="text-sm font-bold text-slate-900">
                              ${paymentTotals.totalAmount.toLocaleString()} AUD
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {generatedInvoicesCount} Invoices
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Settled Payments</span>
                            <span className="text-sm font-bold text-emerald-600">
                              ${paymentTotals.paidAmount.toLocaleString()} AUD
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock size={16} />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Outstanding Balance</span>
                            <span className="text-sm font-bold text-amber-600">
                              ${paymentTotals.pendingAmount.toLocaleString()} AUD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Row: Recent Students Progress Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <GraduationCap size={18} className="text-blue-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Recent Student Cohort Progress</h3>
                      <p className="text-[11px] text-slate-400">Live placement status and orientation schedule</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabChange('students')}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>View All {students.length} Students</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-bold text-slate-600">Student Name & ID</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Course / Qualification</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Placement Status</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Orientation Date</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Required Hours</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students.slice(0, 6).map((s) => (
                        <tr key={s._id || s.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {(s.name || s.firstName || 'S')[0]?.toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-xs">
                                  {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student'}
                                </span>
                                <span className="text-[11px] text-slate-400">{s.studentId || s.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {s.course || s.courseQualification || 'Vocational Education'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block bg-teal-50 text-teal-700 border-teal-200">
                              {s.placementStatus || s.status || 'Awaiting'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {s.appointmentDate ? `${new Date(s.appointmentDate).toLocaleDateString()} ${s.appointmentTime || ''}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {s.placementHours ? `${s.placementHours} hrs` : '120 hrs'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: ENROLLED STUDENTS DIRECTORY
          ========================================================= */}
          {currentView === 'students' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student name, ID, course..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <div className="flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="All">All Courses</option>
                      {distinctCourses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Awaiting">Awaiting / Onboarding</option>
                    <option value="In Progress">In Progress (Sourcing)</option>
                    <option value="Appointment Scheduled">Appointment Scheduled</option>
                    <option value="Appointment Successful">Appointment Successful</option>
                    <option value="Placement Started">Placement Started</option>
                    <option value="Placement Completed">Placement Completed</option>
                  </select>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Enrolled Students</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                    {filteredStudents.length} Students
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4 font-bold text-slate-600">Student Name & ID</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Course / Qualification</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Placement Status</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Target Hours</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Orientation</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Compliance</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            Loading student records...
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            No students found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s) => {
                          const hasPolice = Boolean(s.policeCheckDoc);
                          const hasWwcc = Boolean(s.wwccDoc);
                          const hasNdis = Boolean(s.ndisDoc);
                          const isCleared = hasPolice && hasWwcc && hasNdis;

                          return (
                            <tr key={s._id || s.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                    {(s.name || s.firstName || 'S')[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 text-xs">
                                      {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student'}
                                    </span>
                                    <span className="text-[11px] text-slate-400">{s.studentId || s.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700">
                                {s.course || s.courseQualification || 'Vocational Education'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block bg-teal-50 text-teal-700 border-teal-200">
                                  {s.placementStatus || s.status || 'Awaiting'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {s.placementHours ? `${s.placementHours} hrs` : '120 hrs'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {s.appointmentDate ? (
                                  <div>
                                    <p className="font-semibold text-slate-800">{new Date(s.appointmentDate).toLocaleDateString()}</p>
                                    {s.appointmentTime && <p className="text-[10px] text-slate-400">{s.appointmentTime}</p>}
                                  </div>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {isCleared ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-max">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Cleared</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-max">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedStudent(s)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 3: PLACEMENT PIPELINE (KANBAN BOARD)
          ========================================================= */}
          {currentView === 'pipeline' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { title: '1. Onboarding', list: pipelineStages.enrolled, color: 'text-slate-700', bg: 'bg-slate-100' },
                  { title: '2. Sourcing', list: pipelineStages.sourcing, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { title: '3. Orientation', list: pipelineStages.interview, color: 'text-amber-700', bg: 'bg-amber-50' },
                  { title: '4. Active Placement', list: pipelineStages.active, color: 'text-teal-700', bg: 'bg-teal-50' },
                  { title: '5. Completed', list: pipelineStages.completed, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                ].map((col, idx) => (
                  <div key={idx} className="bg-slate-100/60 p-3.5 rounded-2xl border border-slate-200 flex flex-col min-h-[420px]">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <span className={`text-xs font-bold uppercase ${col.color}`}>{col.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.bg} ${col.color}`}>
                        {col.list.length}
                      </span>
                    </div>
                    <div className="space-y-2.5 overflow-y-auto flex-1">
                      {col.list.map((s) => (
                        <div
                          key={s._id || s.id}
                          onClick={() => setSelectedStudent(s)}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{s.studentId}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            {s.course || s.courseQualification || 'Vocational Placement'}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{s.placementHours ? `${s.placementHours} hrs` : '120 hrs'}</span>
                            <span className="font-bold text-blue-600">Details &rsaquo;</span>
                          </div>
                        </div>
                      ))}
                      {col.list.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-slate-400 text-xs italic">
                          No students
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 4: INTERVIEWS & SCHEDULE
          ========================================================= */}
          {currentView === 'interviews' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Scheduled Orientations & Interviews</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                    {myAppointments.length} Appointments
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4 font-bold text-slate-600">Student Name & ID</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Orientation Date & Time</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Meeting Format</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Status</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Commencement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {myAppointments.length > 0 ? (
                        myAppointments.map((appt, idx) => (
                          <tr key={appt._id || idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {appt.student || appt.studentName || 'Student'}
                              <span className="block text-[11px] text-slate-400 font-normal">{appt.studentId}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-800">
                                {appt.date ? new Date(appt.date).toLocaleDateString() : '—'}
                              </span>
                              <span className="block text-[11px] text-slate-500">{appt.time || '10:00 AM'}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {appt.type || appt.meetingType || 'On-site Orientation'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {appt.status || 'Scheduled'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {appt.commencementDate ? new Date(appt.commencementDate).toLocaleDateString() : 'TBD'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                            No upcoming student orientations scheduled at this time.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 5: PLACEMENTS & LOGGED HOURS
          ========================================================= */}
          {currentView === 'placements' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active on Site</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{activePlacements}</h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{completedPlacements}</h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Logbook Hours Sync</span>
                    <h3 className="text-sm font-bold text-emerald-600 mt-0.5">Real-Time Sync Active</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Active Placements & Verified Hours Progress</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4 font-bold text-slate-600">Student Name & ID</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Course / Qualification</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Commencement</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Required Hours</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Hours Progress</th>
                        <th className="py-3.5 px-4 font-bold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students
                        .filter((s) =>
                          ['Placement Started', 'Joined', 'Active', 'Placement Completed', 'Completed'].includes(
                            s.placementStatus || s.status
                          )
                        )
                        .map((s) => {
                          const sBizId = String(s.studentId || '').trim();
                          const sDbId = String(s._id || s.id || '').trim();
                          const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase();

                          const studentShifts = attendanceRecords.filter((att) => {
                            const attStu = String(att.student || att.studentId || '').trim();
                            const attName = String(att.studentName || '').trim().toLowerCase();
                            return attStu === sBizId || attStu === sDbId || (attName && attName === sName);
                          });

                          const realLoggedHours = studentShifts.reduce((sum, att) => sum + (Number(att.totalHours) || 0), 0);
                          const reqHours = parseInt(s.placementHours, 10) || 120;
                          const isComplete = ['Placement Completed', 'Completed'].includes(s.placementStatus || s.status);
                          const loggedHours = studentShifts.length > 0 ? realLoggedHours : isComplete ? reqHours : 0;
                          const pct = reqHours > 0 ? Math.min(100, Math.round((loggedHours / reqHours) * 100)) : 0;

                          return (
                            <tr key={s._id || s.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}
                                <span className="block text-[11px] text-slate-400 font-normal">{s.studentId}</span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700">
                                {s.course || s.courseQualification || 'Vocational Education'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {s.commencementDate
                                  ? new Date(s.commencementDate).toLocaleDateString()
                                  : s.startDate
                                  ? new Date(s.startDate).toLocaleDateString()
                                  : 'Active'}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{reqHours} hrs</td>
                              <td className="py-3.5 px-4 min-w-[170px]">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-bold text-slate-800">{loggedHours} hrs logged</span>
                                    <span className="font-semibold text-slate-500">{pct}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${isComplete ? 'bg-emerald-600' : 'bg-teal-500'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${
                                    isComplete
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-teal-50 text-teal-700 border-teal-200'
                                  }`}
                                >
                                  {s.placementStatus || s.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {students.filter((s) =>
                        ['Placement Started', 'Joined', 'Active', 'Placement Completed', 'Completed'].includes(
                          s.placementStatus || s.status
                        )
                      ).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                            No students currently in active placement or completed stages.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 6: COMPLIANCE CLEARANCES
          ========================================================= */}
          {currentView === 'compliance' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Mandatory Vocational Clearance Matrix</h3>
                </div>
                <div className="flex items-center space-x-3 text-xs font-semibold">
                  <span className="flex items-center space-x-1 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified</span>
                  </span>
                  <span className="flex items-center space-x-1 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span>Pending</span>
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-bold text-slate-600">Student Name & ID</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-center">Police Check</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-center">WWCC</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-center">NDIS Worker</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-center">CPR</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-center">COVID-19</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-center">Resume</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students.map((s) => {
                        const hasPolice = Boolean(s.policeCheckDoc);
                        const hasWwcc = Boolean(s.wwccDoc);
                        const hasNdis = Boolean(s.ndisDoc);
                        const hasCpr = Boolean(s.cbrDoc);
                        const hasCovid = Boolean(s.covidCheckDoc);
                        const hasResume = Boolean(s.resumeDoc || s.resumeFile || s.hasResume === 'Yes');
                        const isFullyCleared = hasPolice && hasWwcc && hasNdis && hasCpr && hasCovid && hasResume;

                        const renderCheck = (hasDoc, docPath, title) => {
                          if (hasDoc) {
                            return (
                              <button
                                onClick={() => handleOpenDoc(docPath, title)}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </button>
                            );
                          }
                          return (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          );
                        };

                        return (
                          <tr key={s._id || s.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}
                              <span className="block text-[11px] text-slate-400 font-normal">{s.studentId}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">{renderCheck(hasPolice, s.policeCheckDoc, 'Police Clearance')}</td>
                            <td className="py-3.5 px-4 text-center">{renderCheck(hasWwcc, s.wwccDoc, 'Working With Children Check')}</td>
                            <td className="py-3.5 px-4 text-center">{renderCheck(hasNdis, s.ndisDoc, 'NDIS Worker Screening')}</td>
                            <td className="py-3.5 px-4 text-center">{renderCheck(hasCpr, s.cbrDoc, 'CPR Certificate')}</td>
                            <td className="py-3.5 px-4 text-center">{renderCheck(hasCovid, s.covidCheckDoc, 'COVID-19 Proof')}</td>
                            <td className="py-3.5 px-4 text-center">{renderCheck(hasResume, s.resumeDoc || s.resumeFile, 'Student Resume')}</td>
                            <td className="py-3.5 px-4 text-center">
                              {isFullyCleared ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                                  100% Cleared
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Action Required
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 7: INVOICES & BILLING
          ========================================================= */}
          {currentView === 'invoices' && (
            <div className="space-y-4">
              {/* Financial 3-Card Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      ${paymentTotals.totalAmount.toLocaleString()} AUD
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settled</span>
                    <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
                      ${paymentTotals.paidAmount.toLocaleString()} AUD
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
                    <h3 className="text-2xl font-black text-amber-600 mt-0.5">
                      ${paymentTotals.pendingAmount.toLocaleString()} AUD
                    </h3>
                  </div>
                </div>
              </div>

              {/* Invoices Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by invoice #, student name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={invoiceFilter}
                    onChange={(e) => setInvoiceFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All Invoices ({payments.length})</option>
                    <option value="Generated">Generated Invoices ({generatedInvoicesCount})</option>
                    <option value="Paid">Settled / Paid</option>
                    <option value="Pending">Pending Payment</option>
                  </select>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Official Invoices & Statements</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                    {filteredInvoices.length} Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-bold text-slate-600">Invoice Number</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Issue Date</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Student Name & ID</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Course</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Amount (AUD)</th>
                        <th className="py-3 px-4 font-bold text-slate-600">Status</th>
                        <th className="py-3 px-4 font-bold text-slate-600 text-right">PDF Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((pay) => {
                          const isPaid = pay.paymentStatus === 'Paid' || pay.paymentStatus === 'Full Payment Received';
                          const isIssued = Boolean(pay.invoiceNumber);

                          return (
                            <tr key={pay._id || pay.invoiceNumber} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                                {pay.invoiceNumber ? (
                                  <span className="flex items-center space-x-1">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    <span>#{pay.invoiceNumber}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal italic">Pending</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {pay.invoiceGeneratedDate
                                  ? new Date(pay.invoiceGeneratedDate).toLocaleDateString()
                                  : pay.createdAt
                                  ? new Date(pay.createdAt).toLocaleDateString()
                                  : '—'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-900">{pay.studentName || 'Student'}</span>
                                <span className="block text-[11px] text-slate-400 font-normal">{pay.studentId}</span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {pay.course || 'Vocational Education'}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                ${((pay.chargedAmount !== undefined ? pay.chargedAmount : (pay.totalAmount || pay.paymentAmount || pay.originalPrice)) || 0).toLocaleString()} AUD
                              </td>
                              <td className="py-3.5 px-4">
                                {isPaid ? (
                                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Full Payment Settled
                                  </span>
                                ) : isIssued ? (
                                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block bg-blue-50 text-blue-700 border-blue-200">
                                    {pay.paymentStatus || 'Invoice Issued'}
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block bg-slate-100 text-slate-600 border-slate-200">
                                    Pending Invoice
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {pay.invoiceNumber ? (
                                  <button
                                    onClick={() => handleDownloadInvoice(pay.invoiceNumber)}
                                    disabled={downloadingInvoice === pay.invoiceNumber}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{downloadingInvoice === pay.invoiceNumber ? 'Generating...' : 'PDF'}</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Not issued</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            No invoices found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 8: RTO PROFILE
          ========================================================= */}
          {currentView === 'profile' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-3 pb-5 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {rtoProfile?.name || 'Registered Training Organisation (RTO)'}
                    </h3>
                    <p className="text-xs text-slate-500">Accredited RTO Partner Details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-5">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">RTO Code / ID</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{rtoProfile?.code || rtoProfile?.rtoCode || 'RTO-PARTNER'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ABN</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{rtoProfile?.abn || 'Registered'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Contact Person</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{rtoProfile?.contactPerson || 'Administration'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{rtoProfile?.contactEmail || rtoProfile?.email || '—'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{rtoProfile?.contactPhone || rtoProfile?.phone || '—'}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {[rtoProfile?.address, rtoProfile?.city || rtoProfile?.suburb, rtoProfile?.state, rtoProfile?.postcode]
                        .filter(Boolean)
                        .join(', ') || 'Australia'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Enrolled Qualifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {distinctCourses.length > 0 ? (
                      distinctCourses.map((c) => (
                        <span key={c} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">All standard vocational placement courses</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          STUDENT DETAILS MODAL
      ========================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {(selectedStudent.name || selectedStudent.firstName || 'S')[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedStudent.name || `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim()}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{selectedStudent.studentId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Placement Stage</span>
                  <p className="font-extrabold text-blue-900 text-sm mt-0.5">
                    {selectedStudent.placementStatus || selectedStudent.status || 'Awaiting'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Required Hours</span>
                  <p className="font-extrabold text-blue-900 text-sm mt-0.5">
                    {selectedStudent.placementHours ? `${selectedStudent.placementHours} hrs` : '120 hrs'}
                  </p>
                </div>
              </div>

              {/* Student Info Grid */}
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Course:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedStudent.course || selectedStudent.courseQualification || 'Health & Care Services'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Study Mode:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedStudent.studyMode || selectedStudent.courseLevel || 'Full Time'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Email:</span>
                  <p className="font-bold text-slate-800 mt-0.5 truncate">{selectedStudent.emailAddress || '—'}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Phone:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedStudent.phoneNumber || '—'}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Orientation Date:</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedStudent.appointmentDate ? new Date(selectedStudent.appointmentDate).toLocaleDateString() : '—'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Host Facility:</span>
                  <p className="font-bold text-blue-700 mt-0.5">Host Facility Partner</p>
                </div>
              </div>

              {/* Compliance Documents */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs">Compliance Clearances</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Police Clearance', doc: selectedStudent.policeCheckDoc },
                    { label: 'WWCC Clearance', doc: selectedStudent.wwccDoc },
                    { label: 'NDIS Worker Screening', doc: selectedStudent.ndisDoc },
                    { label: 'CPR Certificate', doc: selectedStudent.cbrDoc },
                    { label: 'COVID-19 Proof', doc: selectedStudent.covidCheckDoc },
                    { label: 'Resume / CV', doc: selectedStudent.resumeDoc || selectedStudent.resumeFile },
                  ].map(({ label, doc }) => (
                    <div key={label} className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{label}</span>
                      {doc ? (
                        <button
                          onClick={() => handleOpenDoc(doc, label)}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-md text-[10px] font-bold transition cursor-pointer flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                          Missing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewSubmitModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          loadAllRTOData();
        }}
        onSuccess={loadAllRTOData}
      />
    </div>
  );
}
