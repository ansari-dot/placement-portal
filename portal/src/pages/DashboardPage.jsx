import React, { useState, useEffect } from 'react';
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
import { fetchWorkflowDashboardData } from '../api/workflowApi';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalRequests: 0,
    totalAppointments: 0,
    totalInternships: 0,
    requestsStats: null,
    appointmentsStats: null,
    internshipsStats: null,
    recentActivities: [],
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetchWorkflowDashboardData();
        if (res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header title="Dashboard" breadcrumbs={['Dashboard']} />

        <main className="p-4 space-y-4 max-w-[1600px] w-full mx-auto">
          {/* Sub-header Filter Row */}
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Overview & Live Analytics</h2>
            <div className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
              <Calendar size={14} className="text-slate-500" />
              <span>Real-Time System Data</span>
            </div>
          </div>

          {/* Top 4 KPI Cards */}
          <StatsOverview stats={dashboardData} loading={loading} />

          {/* Second Row Grid: Internship Requests (2 cols), Appointments (1 col), Internships (1 col) */}
          <div className="grid grid-cols-4 gap-6 items-stretch">
            <div className="col-span-2 flex">
              <div className="w-full">
                <InternshipRequestsCard stats={dashboardData.requestsStats} loading={loading} />
              </div>
            </div>
            <div className="col-span-1 flex">
              <div className="w-full">
                <AppointmentsCard stats={dashboardData.appointmentsStats} loading={loading} />
              </div>
            </div>
            <div className="col-span-1 flex">
              <div className="w-full">
                <InternshipsSummaryCard stats={dashboardData.internshipsStats} loading={loading} />
              </div>
            </div>
          </div>

          {/* Third Row Grid: Requests Overview Chart (2 cols) & Recent Activity (1 col) */}
          <div className="grid grid-cols-3 gap-6 items-stretch">
            <div className="col-span-2 flex">
              <div className="w-full">
                <RequestsChartCard chartData={dashboardData.chartData} loading={loading} />
              </div>
            </div>
            <div className="col-span-1 flex">
              <div className="w-full">
                <RecentActivityCard activities={dashboardData.recentActivities} loading={loading} />
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