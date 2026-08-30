import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import AllStudentsTable from '../components/student/AllStudentsTable';

export default function StudentsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <Header title="Students" breadcrumbs={['Dashboard', 'My List', 'Students']} />

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 max-w-[1600px] w-full mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
            
            {/* Page Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">All Students</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Search and manage all students across the portal. Assign coordinators from here.</p>
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

            {/* Render Table */}
            <div>
              <AllStudentsTable />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
