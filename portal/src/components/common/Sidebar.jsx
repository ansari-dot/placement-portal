import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../../redux/authSlice';
import { fetchPendingUsers } from '../../api/userApi';
import logo1 from '../../assets/logo1.png';
import {
  LayoutDashboard,
  Users,
  Search,
  UserPlus,
  Layers,
  Calendar,
  Briefcase,
  Building2,
  Settings,
  ClipboardList,
  LogOut,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const userRole = authUser?.role || 'Administrator';
  const isAdmin = userRole === 'Administrator';
  const isCoordinator = userRole === 'Coordinator' || userRole === 'Staff';
  const isRtoManager = userRole === 'RTO Manager';
  const isStudent = userRole === 'Student';
  const isIndustry = userRole === 'Industry';
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      const checkPending = async () => {
        try {
          const res = await fetchPendingUsers();
          if (res.success && Array.isArray(res.data)) {
            setPendingCount(res.data.length);
          }
        } catch (err) {
          // ignore silently
        }
      };
      checkPending();
      const interval = setInterval(checkPending, 10000);
      window.addEventListener('focus', checkPending);
      window.addEventListener('user-approval-changed', checkPending);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', checkPending);
        window.removeEventListener('user-approval-changed', checkPending);
      };
    }
  }, [isAdmin]);

  const pathname = location.pathname;

  const searchParams = new URLSearchParams(location.search);

  const workflowStep = parseInt(
    searchParams.get('step') || '1',
    10
  );

  // ============================================
  // ACTIVE ROUTE
  // ============================================

  const isActive = (path) => {
    return pathname === path;
  };

  // ============================================
  // WORKFLOW ACTIVE ROUTE
  // ============================================

  const isWorkflowStepActive = (step) => {
    return pathname === '/workflow' && workflowStep === step;
  };

  // ============================================
  // NORMAL NAVIGATION CLASS
  // ============================================

  const navLinkClass = (path) => {
    return `
      group
      flex
      items-center
      gap-2.5
      w-full
      px-2.5
      py-1.5
      rounded-md
      transition-all
      duration-200
      text-[10px]
      ${
        isActive(path)
          ? 'bg-[#08a8b8] text-white font-medium shadow-sm'
          : 'text-white/75 hover:bg-white/10 hover:text-white'
      }
    `;
  };

  // ============================================
  // WORKFLOW NAVIGATION CLASS
  // ============================================

  const workflowLinkClass = (step) => {
    return `
      group
      flex
      items-center
      gap-2.5
      w-full
      px-2.5
      py-1.5
      rounded-md
      transition-all
      duration-200
      text-[10px]
      ${
        isWorkflowStepActive(step)
          ? 'bg-[#08a8b8] text-white font-medium shadow-sm'
          : 'text-white/75 hover:bg-white/10 hover:text-white'
      }
    `;
  };

  // ============================================
  // NORMAL ICON CLASS
  // ============================================

  const iconClass = (path) => {
    return `
      w-3
      h-3
      shrink-0
      transition-colors
      ${
        isActive(path)
          ? 'text-white'
          : 'text-white/60 group-hover:text-white'
      }
    `;
  };

  // ============================================
  // WORKFLOW ICON CLASS
  // ============================================

  const workflowIconClass = (step) => {
    return `
      w-3
      h-3
      shrink-0
      transition-colors
      ${
        isWorkflowStepActive(step)
          ? 'text-white'
          : 'text-white/60 group-hover:text-white'
      }
    `;
  };

  // ============================================
  // SECTION TITLE
  // ============================================

  const sectionTitle = `
    px-2.5
    mb-1
    text-[7px]
    font-semibold
    text-white/45
    uppercase
    tracking-[0.12em]
  `;

  // ============================================
  // SIDEBAR
  // ============================================

  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
    } catch (err) {
      console.error('Sidebar logout error:', err);
    }
    navigate('/login');
  };

  return (
  <aside
  className="
    fixed
    left-0
    top-0
    z-30
    flex
    h-screen
    w-[220px]
    flex-col
    overflow-y-auto
    select-none
    text-white
    bg-gradient-to-b
    from-[#0751a3]
    via-[#0879a7]
    to-[#05b5a8]
  "
>

      {/* =====================================================
          LOGO SECTION
          KEEPING YOUR ORIGINAL LOGO
      ====================================================== */}

      <div className="p-4 flex justify-center items-center">
        <img src={logo1} alt="Mantis Placements" className="w-44 h-14 object-contain" />
      </div>


      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <div className="flex-1 px-3 pb-3 text-[10px]">


        {/* ===================================================
            DASHBOARD
        ==================================================== */}

        <div className="mb-4">

          <Link
            to="/"
            className={navLinkClass('/')}
          >

            <LayoutDashboard
              className={iconClass('/')}
            />

            <span className="truncate">
              Dashboard
            </span>

          </Link>

        </div>


        {/* ===================================================
            MY LIST
        ==================================================== */}

        <div className="mb-4">

          <p className={sectionTitle}>
            My List
          </p>

          <div className="space-y-0.5">

            {/* My Progress */}

            <Link
              to="/my-students"
              className={navLinkClass('/my-students')}
            >

              <Users
                className={iconClass('/my-students')}
              />

              <span className="truncate">
                {isIndustry ? 'Students & Attendance' : 'My Progress'}
              </span>

            </Link>


            {/* Add Student — Admin only */}
            {isAdmin && (
            <Link
              to="/add-student"
              className={navLinkClass('/add-student')}
            >

              <UserPlus
                className={iconClass('/add-student')}
              />

              <span className="truncate">
                Add New Student
              </span>

            </Link>
            )}

            {/* Bulk Import — Admin only */}
            {isAdmin && (
            <Link to="/bulk-import" className={navLinkClass('/bulk-import')}>
              <FileSpreadsheet className={iconClass('/bulk-import')} />
              <span className="truncate">Bulk Import</span>
            </Link>
            )}

          </div>

        </div>


        {/* ===================================================
            WORKFLOW, PARTNERS, OPERATIONS & ADMINISTRATION
            Only accessible to Administrators and Coordinators
        ==================================================== */}
        {(isAdmin || isCoordinator) && (
          <>
            {/* WORKFLOW */}
            <div className="mb-4">
              <p className={sectionTitle}>Workflow</p>
              <div className="space-y-0.5">
                <Link to="/workflow?step=1" className={workflowLinkClass(1)}>
                  <Users className={workflowIconClass(1)} />
                  <span className="truncate">Step 1: Students</span>
                </Link>
                <Link to="/workflow?step=2" className={workflowLinkClass(2)}>
                  <Layers className={workflowIconClass(2)} />
                  <span className="truncate">Step 2: Placement Requests</span>
                </Link>
                <Link to="/workflow?step=3" className={workflowLinkClass(3)}>
                  <Calendar className={workflowIconClass(3)} />
                  <span className="truncate">Step 3: Appointments</span>
                </Link>
                <Link to="/workflow?step=4" className={workflowLinkClass(4)}>
                  <Briefcase className={workflowIconClass(4)} />
                  <span className="truncate">Step 4: Placements</span>
                </Link>
                <Link to="/workflow?step=5" className={workflowLinkClass(5)}>
                  <CreditCard className={workflowIconClass(5)} />
                  <span className="truncate">Step 5: Payments</span>
                </Link>
              </div>
            </div>

            {/* PARTNERS */}
            <div className="mb-4">
              <p className={sectionTitle}>Partners</p>
              <div className="space-y-0.5">
                <Link to="/rto" className={`${navLinkClass('/rto')} justify-between`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={iconClass('/rto')} />
                    <span className="truncate">RTOs</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 text-white/40 shrink-0" />
                </Link>
                <Link to="/industry" className={`${navLinkClass('/industry')} justify-between`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={iconClass('/industry')} />
                    <span className="truncate">Industries</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 text-white/40 shrink-0" />
                </Link>
              </div>
            </div>

            {/* OPERATIONS */}
            <div className="mb-4">
              <p className={sectionTitle}>Operations</p>
              <Link to="/jobs" className={`${navLinkClass('/jobs')} justify-between`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Briefcase className={iconClass('/jobs')} />
                  <span className="truncate">Jobs</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 text-white/40 shrink-0" />
              </Link>
            </div>

            {/* ADMINISTRATION */}
            <div>
              <p className={sectionTitle}>Administration</p>
              <Link to="/users" className={`${navLinkClass('/users')} justify-between`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className={iconClass('/users')} />
                  <span className="truncate">Users</span>
                </div>
                {pendingCount > 0 ? (
                  <span
                    className="px-1.5 py-0.5 bg-[#f59e0b] text-slate-950 font-black text-[9px] rounded-full animate-pulse shadow-sm border border-amber-300 shrink-0"
                    title={`${pendingCount} Pending registration approval request(s)`}
                  >
                    {pendingCount}
                  </span>
                ) : (
                  <ChevronRight className="w-2.5 h-2.5 text-white/40 shrink-0" />
                )}
              </Link>
              {isAdmin && (
                <Link to="/user-log" className={`${navLinkClass('/user-log')} justify-between`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ClipboardList className={iconClass('/user-log')} />
                    <span className="truncate">User Log</span>
                  </div>
                  <ChevronRight className="w-2.5 h-2.5 text-white/40 shrink-0" />
                </Link>
              )}
            </div>
          </>
        )}
      </div>


      {/* =====================================================
          LOGOUT
      ====================================================== */}

      <div
        className="
          px-3
          py-3
          border-t
          border-white/10
        "
      >

        <button
          onClick={handleLogout}
          className="
            group
            flex
            items-center
            gap-2.5
            w-full
            px-2.5
            py-1.5
            rounded-md
            text-[10px]
            text-red-500
            hover:bg-red-500/10
            hover:text-red-700
            transition-all
            duration-200
            cursor-pointer
          "
        >

          <LogOut
            className="
              w-3
              h-3
              shrink-0
            "
          />

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}
