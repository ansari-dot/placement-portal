import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import MyStudentsTable from '../components/student/MyStudentsTable';

export default function MyStudentsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <Header title="My Students" breadcrumbs={['Dashboard', 'My List', 'My Students']} />

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-hidden p-4 max-w-[1600px] w-full mx-auto">
          <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col overflow-hidden">
            
            {/* Page Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Directory</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage and view all registered student records and statuses.</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to="/add-student"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add New Student</span>
                </Link>
              </div>
            </div>

            {/* Render Your Table Component Here */}
            <div className="flex-1 overflow-hidden">
              <MyStudentsTable />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}