import React from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import StatsOverview from '../components/dashboard/StatsOverview';
import InternshipRequestsCard from '../components/dashboard/InternshipRequestsCard';
import AppointmentsCard from '../components/dashboard/AppointmentsCard';
import InternshipsSummaryCard from '../components/dashboard/InternshipsSummaryCard';
import RequestsChartCard from '../components/dashboard/RequestsChartCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import QuickActions from '../components/dashboard/QuickActions';
import { Calendar } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header title="Dashboard" breadcrumbs={['Dashboard']} />

        <main className="p-4 space-y-4 max-w-[1600px] w-full mx-auto">
          {/* Sub-header Filter Row */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
              <Calendar size={14} className="text-slate-500" />
              <span>19 Jul 2025 - 19 Aug 2025</span>
              <span className="text-slate-400">&or;</span>
            </div>
          </div>

          {/* Top 4 KPI Cards */}
          <StatsOverview />

          {/* Second Row Grid: Internship Requests (2 cols), Appointments (1 col), Internships (1 col) adjusted to 4-column layout */}
          <div className="grid grid-cols-4 gap-6 items-stretch">
            <div className="col-span-2 flex">
              <div className="w-full">
                <InternshipRequestsCard />
              </div>
            </div>
            <div className="col-span-1 flex">
              <div className="w-full">
                <AppointmentsCard />
              </div>
            </div>
            <div className="col-span-1 flex">
              <div className="w-full">
                <InternshipsSummaryCard />
              </div>
            </div>
          </div>

          {/* Third Row Grid */}
          <div className="grid grid-cols-3 gap-6 items-stretch">
            <div className="col-span-2 flex">
              <div className="w-full">
                <RequestsChartCard />
              </div>
            </div>
            <div className="col-span-1 flex">
              <div className="w-full">
                <RecentActivityCard />
              </div>
            </div>
          </div>

          {/* Quick Actions Footer Component */}
          <QuickActions />
        </main>
      </div>
    </div>
  );
}