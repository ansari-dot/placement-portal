import React from 'react';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';

export default function JobLayout({ title = 'Jobs', breadcrumbs = [], children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 ml-52 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <Header title={title} breadcrumbs={breadcrumbs} />

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-4 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}