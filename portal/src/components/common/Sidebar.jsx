import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

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

      <div className="p-3.5 flex items-center space-x-2.5">

        <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
          M
        </div>

        <div className="min-w-0">

          <h1 className="text-white font-bold tracking-wider text-xs leading-tight">
            MANTIS
          </h1>

          <span className="text-[7px] text-cyan-400 tracking-widest uppercase font-semibold">
            PLACEMENTS
          </span>

        </div>

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

            {/* My Students */}

            <Link
              to="/my-students"
              className={navLinkClass('/my-students')}
            >

              <Users
                className={iconClass('/my-students')}
              />

              <span className="truncate">
                My Students
              </span>

            </Link>


            {/* Student Search */}

            <Link
              to="/my-students"
              className={navLinkClass('/my-students')}
            >

              <Search
                className={iconClass('/my-students')}
              />

              <span className="truncate">
                Student Search...
              </span>

            </Link>


            {/* Add Student */}

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

          </div>

        </div>


        {/* ===================================================
            WORKFLOW
        ==================================================== */}

        <div className="mb-4">

          <p className={sectionTitle}>
            Workflow
          </p>

          <div className="space-y-0.5">


            {/* Step 1 */}

            <Link
              to="/workflow?step=1"
              className={workflowLinkClass(1)}
            >

              <Users
                className={workflowIconClass(1)}
              />

              <span className="truncate">
                Step 1: Students
              </span>

            </Link>


            {/* Step 2 */}

            <Link
              to="/workflow?step=2"
              className={workflowLinkClass(2)}
            >

              <Layers
                className={workflowIconClass(2)}
              />

              <span className="truncate">
                Step 2: Internship Requests
              </span>

            </Link>


            {/* Step 3 */}

            <Link
              to="/workflow?step=3"
              className={workflowLinkClass(3)}
            >

              <Calendar
                className={workflowIconClass(3)}
              />

              <span className="truncate">
                Step 3: Appointments
              </span>

            </Link>


            {/* Step 4 */}

            <Link
              to="/workflow?step=4"
              className={workflowLinkClass(4)}
            >

              <Briefcase
                className={workflowIconClass(4)}
              />

              <span className="truncate">
                Step 4: Internships
              </span>

            </Link>

          </div>

        </div>


        {/* ===================================================
            PARTNERS
        ==================================================== */}

        <div className="mb-4">

          <p className={sectionTitle}>
            Partners
          </p>

          <div className="space-y-0.5">


            {/* RTOs */}

            <Link
              to="/rto"
              className={`
                ${navLinkClass('/rto')}
                justify-between
              `}
            >

              <div className="flex items-center gap-2.5 min-w-0">

                <Building2
                  className={iconClass('/rto')}
                />

                <span className="truncate">
                  RTOs
                </span>

              </div>

              <ChevronRight
                className="
                  w-2.5
                  h-2.5
                  text-white/40
                  shrink-0
                "
              />

            </Link>


            {/* Industries */}

            <Link
              to="/industry"
              className={`
                ${navLinkClass('/industry')}
                justify-between
              `}
            >

              <div className="flex items-center gap-2.5 min-w-0">

                <Building2
                  className={iconClass('/industry')}
                />

                <span className="truncate">
                  Industries
                </span>

              </div>

              <ChevronRight
                className="
                  w-2.5
                  h-2.5
                  text-white/40
                  shrink-0
                "
              />

            </Link>

          </div>

        </div>


        {/* ===================================================
            OPERATIONS
        ==================================================== */}

        <div className="mb-4">

          <p className={sectionTitle}>
            Operations
          </p>

          <Link
            to="/jobs"
            className={`
              ${navLinkClass('/jobs')}
              justify-between
            `}
          >

            <div className="flex items-center gap-2.5 min-w-0">

              <Briefcase
                className={iconClass('/jobs')}
              />

              <span className="truncate">
                Jobs
              </span>

            </div>

            <ChevronRight
              className="
                w-2.5
                h-2.5
                text-white/40
                shrink-0
              "
            />

          </Link>

        </div>


        {/* ===================================================
            ADMINISTRATION
        ==================================================== */}

        <div>

          <p className={sectionTitle}>
            Administration
          </p>

          <Link
            to="/"
            className="
              group
              flex
              items-center
              justify-between
              w-full
              px-2.5
              py-1.5
              rounded-md
              text-[10px]
              text-white/75
              hover:bg-white/10
              hover:text-white
              transition-all
              duration-200
            "
          >

            <div className="flex items-center gap-2.5 min-w-0">

              <Settings
                className="
                  w-3
                  h-3
                  text-white/60
                  group-hover:text-white
                  shrink-0
                "
              />

              <span className="truncate">
                Users
              </span>

            </div>

            <ChevronRight
              className="
                w-2.5
                h-2.5
                text-white/40
                shrink-0
              "
            />

          </Link>

        </div>

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
          onClick={() => {
            localStorage.removeItem('portal_user');
            navigate('/');
          }}
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