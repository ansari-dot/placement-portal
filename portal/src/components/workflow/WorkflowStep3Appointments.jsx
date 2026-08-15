// src/components/workflow/WorkflowStep3Appointments.jsx
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, 
  FileText, CheckCircle2, UserX, Clock, Plus, Filter, 
  X, Mail, Phone, MapPin, Building2, Check,
  Briefcase, ShieldCheck, ArrowUpRight, Download, CalendarClock, Video, Users
} from 'lucide-react';

export default function WorkflowStep3Appointments({ appointments = [], onBack, onNext }) {
  const [activeTab, setActiveTab] = useState('Calendar View');
  const [selectedAppointment, setSelectedAppointment] = useState({
    id: 'APPT-000245',
    status: 'Scheduled',
    student: 'John Smith',
    studentId: 'STU-0002453',
    rto: 'AI Global Institute',
    email: 'john.smith@email.com',
    phone: '+61 412 345 678',
    date: '20 May 2025 (Tue)',
    time: '09:00 AM – 09:45 AM',
    company: 'TechSolutions Pty Ltd',
    interviewer: 'Sarah Mitchell',
    location: 'Level 12, 530 Collins St, Melbourne, VIC 3000',
    meetingType: 'In-Person',
    position: 'Software Developer Intern',
    linkedReq: 'REQ-000122',
    linkedReqStatus: 'New',
    linkedReqDate: 'Requested on 19 May 2025 at 10:24 AM',
    notes: 'Student is familiar with React and Node.js. Looking for backend-focused projects.'
  });
  const [showDrawer, setShowDrawer] = useState(true);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  const timeSlots = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
  const days = [
    { name: 'Mon 19 May', date: '19' },
    { name: 'Tue 20 May', date: '20' },
    { name: 'Wed 21 May', date: '21' },
    { name: 'Thu 22 May', date: '22' },
    { name: 'Fri 23 May', date: '23' },
    { name: 'Sat 24 May', date: '24' },
    { name: 'Sun 25 May', date: '25' }
  ];

  // Grid layout helper mapping for appointments
  const calendarData = {
    '9 AM': {
      'Mon 19 May': { name: 'John Smith', company: 'TechSolutions Pty Ltd', time: '09:00 – 09:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' },
      'Tue 20 May': { name: 'Priya Sharma', company: 'DataInsights', time: '09:00 – 09:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' },
      'Thu 22 May': { name: 'Emily Davis', company: 'SecureNet', time: '09:00 – 09:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' },
      'Fri 23 May': { name: 'David Brown', company: 'FinEdge Solutions', time: '09:00 – 09:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' },
      'Sun 25 May': { name: 'Sophia Lee', company: 'DataCore', time: '09:00 – 09:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' }
    },
    '10 AM': {
      'Wed 21 May': { name: 'Aisha Khan', company: 'BrandBoost', time: '10:00 – 10:45 AM', color: 'bg-amber-50 border-amber-200 text-amber-900', subColor: 'text-amber-600' }
    },
    '11 AM': {
      'Mon 19 May': { name: 'Liam Johnson', company: 'Pixel Perfect', time: '11:00 – 11:45 AM', color: 'bg-purple-50 border-purple-200 text-purple-900', subColor: 'text-purple-600' },
      'Wed 21 May': { name: 'Mohammed Ali', company: 'CloudNova', time: '11:00 – 11:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' },
      'Sat 24 May': { name: 'Daniel Wilson', company: 'CodeCraft', time: '11:00 – 11:45 AM', color: 'bg-rose-50 border-rose-200 text-rose-900', subColor: 'text-rose-600' }
    },
    '1 PM': {
      'Tue 20 May': { name: 'Olivia Thompson', company: 'SoftWareHouse', time: '01:00 – 01:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' },
      'Thu 22 May': { name: 'James Taylor', company: 'NetSecure', time: '01:00 – 01:45 AM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' }
    },
    '2 PM': {
      'Mon 19 May': { name: 'Noah Anderson', company: 'DevPro Solutions', time: '02:00 – 02:45 PM', color: 'bg-amber-50 border-amber-200 text-amber-900', subColor: 'text-amber-600' },
      'Wed 21 May': { name: 'Isabella Martinez', company: 'Insight Analytics', time: '02:00 – 02:45 PM', color: 'bg-purple-50 border-purple-200 text-purple-900', subColor: 'text-purple-600' },
      'Fri 23 May': { name: 'Benjamin Clark', company: 'TechWave', time: '02:00 – 02:45 PM', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', subColor: 'text-emerald-600' }
    },
    '3 PM': {
      'Tue 20 May': { name: 'Charlotte White', company: 'Glowbyte', time: '03:00 – 03:45 PM', color: 'bg-rose-50 border-rose-200 text-rose-900', subColor: 'text-rose-600' }
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSelectAppointment = (slotData) => {
    setSelectedAppointment({
      ...selectedAppointment,
      student: slotData.name,
      company: slotData.company,
      time: `${slotData.time} AM/PM`
    });
    setShowDrawer(true);
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    showToast(`Exported as ${format.toUpperCase()}`);
  };

  const handleWeekChange = (dir) => {
    setCurrentWeek(prev => prev + dir);
    showToast(dir > 0 ? 'Next week' : 'Previous week');
  };

  const handleMarkCompleted = () => {
    showToast('Appointment marked as completed');
  };

  const handleReschedule = () => {
    showToast('Rescheduling appointment...');
  };

  const handleCancel = () => {
    showToast('Appointment cancelled');
  };

  return (
    <div className="flex gap-4 items-start pb-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 min-w-0">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Today's Appointments</p>
              <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">8</h3>
            <p className="text-[8px] text-emerald-600 font-semibold mt-0.5">↑ 14% vs yesterday</p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">This Week</p>
              <div className="w-5 h-5 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">42</h3>
            <p className="text-[8px] text-emerald-600 font-semibold mt-0.5">↑ 18% vs last week</p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Completed</p>
              <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">126</h3>
            <p className="text-[8px] text-emerald-600 font-semibold mt-0.5">↑ 12% this month</p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">No Show</p>
              <div className="w-5 h-5 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                <UserX className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">9</h3>
            <p className="text-[8px] text-rose-600 font-semibold mt-0.5">↓ 5% this month</p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Rescheduled</p>
              <div className="w-5 h-5 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">15</h3>
            <p className="text-[8px] text-rose-600 font-semibold mt-0.5">↓ 3% this month</p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <p className="text-[9px] text-slate-500 font-medium">Upcoming</p>
              <div className="w-5 h-5 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">57</h3>
            <p className="text-[8px] text-emerald-600 font-semibold mt-0.5">↑ 16%</p>
          </div>
        </div>

        {/* View Toggle & Toolbar Container */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            {/* Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button 
                onClick={() => { setActiveTab('Calendar View'); showToast('Calendar view'); }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${activeTab === 'Calendar View' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Calendar
              </button>
              <button 
                onClick={() => { setActiveTab('List View'); showToast('List view'); }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${activeTab === 'List View' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                List
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button 
                  onClick={() => handleWeekChange(-1)}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 shadow-xs transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => { setCurrentWeek(0); showToast('Current week'); }}
                  className="px-2.5 py-1 bg-white rounded-lg text-[11px] font-bold text-slate-800 shadow-xs"
                >
                  Today
                </button>
                <button 
                  onClick={() => handleWeekChange(1)}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 shadow-xs transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => showToast('Date range')}
                  className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                >
                  <CalendarIcon className="w-3 h-3 text-slate-400" />
                  <span>19–25 May</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => showToast('View options')}
                  className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                >
                  <span>Week</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => { setShowFilters(!showFilters); }}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-100 whitespace-nowrap"
                >
                  <Filter className="w-3 h-3 text-blue-600" />
                  <span>Filters</span>
                  {filterCount > 0 && (
                    <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">{filterCount}</span>
                  )}
                </button>
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Options</p>
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-blue-600" />
                        <span>Scheduled</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-blue-600" />
                        <span>Completed</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                        <input type="checkbox" className="rounded accent-blue-600" />
                        <span>No Show</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer">
                        <input type="checkbox" className="rounded accent-blue-600" />
                        <span>Rescheduled</span>
                      </label>
                    </div>
                    <button 
                      onClick={() => { setShowFilters(false); setHasActiveFilters(true); setFilterCount(2); showToast('Filters applied'); }}
                      className="w-full py-1.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-[11px] font-semibold rounded-lg transition-all duration-500 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button 
                  onClick={() => { setHasActiveFilters(false); setFilterCount(0); showToast('Filters cleared'); }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline px-1 shrink-0 whitespace-nowrap"
                >
                  Clear
                </button>
              )}

              <div className="w-px h-6 bg-slate-200 shrink-0"></div>

              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-xl flex items-center space-x-1.5 hover:bg-slate-100 whitespace-nowrap"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-1.5 space-y-0.5">
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg">
                      CSV
                    </button>
                    <button onClick={() => handleExport('excel')} className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 rounded-lg">
                      Excel
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowNewAppointment(!showNewAppointment)}
                  className="px-3 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-[11px] font-semibold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-all duration-500 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Appt.</span>
                </button>
                {showNewAppointment && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Create New Appointment</h4>
                    <div className="space-y-2">
                      <input placeholder="Student Name" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      <input placeholder="Company" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      <input type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      <input type="time" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button 
                        onClick={() => { setShowNewAppointment(false); showToast('Appointment created'); }}
                        className="flex-1 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-semibold rounded-lg transition-all duration-500 cursor-pointer"
                      >
                        Create
                      </button>
                      <button 
                        onClick={() => setShowNewAppointment(false)}
                        className="px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Grid View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Days */}
              <div className="grid grid-cols-8 border-b border-slate-200 pb-3 text-xs font-bold text-slate-500 text-center">
                <div className="text-left pl-2">Time</div>
                {days.map((d, i) => (
                  <div key={i} className={`flex flex-col items-center justify-center ${i === 1 ? 'text-blue-600' : ''}`}>
                    <span>{d.name.split(' ')[0]}</span>
                    <span className={`text-sm mt-0.5 ${i === 1 ? 'w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs' : 'text-slate-900 font-bold'}`}>
                      {d.date}
                    </span>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="divide-y divide-slate-100">
                {timeSlots.map((time, idx) => (
                  <div key={idx} className="grid grid-cols-8 py-3 text-xs items-stretch">
                    <span className="font-semibold text-slate-400 pt-2 pl-2">{time}</span>
                    {days.map((day, dayIdx) => {
                      const slotData = calendarData[time]?.[day.name];
                      const isSelectedAppt = slotData && slotData.name === selectedAppointment.student;
                      return (
                        <div key={dayIdx} className="p-1 min-h-[75px] flex flex-col justify-start">
                          {slotData && (
                            <div 
                              onClick={() => handleSelectAppointment(slotData)}
                              className={`p-2.5 rounded-xl border text-left w-full shadow-xs cursor-pointer transition hover:ring-2 hover:ring-blue-400 ${slotData.color} ${isSelectedAppt ? 'ring-2 ring-blue-600' : ''}`}
                            >
                              <p className="font-bold text-[11px] truncate">{slotData.name}</p>
                              <p className="text-[10px] truncate font-medium opacity-80 mt-0.5">{slotData.company}</p>
                              <p className={`text-[9px] font-bold mt-1 ${slotData.subColor}`}>{slotData.time}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span>No Show</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Rescheduled</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span>Cancelled</span>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl flex items-center space-x-2 transition shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Requests</span>
            </button>
          ) : <div />}
          {onNext && (
            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-xs font-semibold text-white rounded-xl flex items-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs"
            >
              <span>Continue to Internships</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Drawer / Detail Panel - Professional Mini Card */}
      {showDrawer && (
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 overflow-hidden">
        {/* Card Header with Gradient */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-5">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-white text-sm tracking-wide">{selectedAppointment.id}</h4>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-full border border-emerald-400/20 flex items-center space-x-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{selectedAppointment.status}</span>
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-1.5">{selectedAppointment.position}</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{selectedAppointment.date} • {selectedAppointment.time}</span>
              </p>
            </div>
            <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white transition mt-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student info */}
          <div className="relative mt-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0 border-2 border-white/20">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt={selectedAppointment.student} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-white text-xs">{selectedAppointment.student}</p>
              <p className="text-[10px] text-slate-400 font-mono">{selectedAppointment.studentId}</p>
              <p className="text-[10px] text-slate-300">{selectedAppointment.rto}</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="relative mt-3 space-y-1.5">
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
              <Mail className="w-3 h-3 text-slate-400" />
              <span className="truncate">{selectedAppointment.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{selectedAppointment.phone}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 text-[11px] font-semibold text-slate-500 space-x-5 bg-white">
          {['Overview', 'Details', 'Request', 'Notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 relative transition ${
                activeTab === tab ? 'text-blue-600 font-bold' : 'hover:text-slate-800'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Type</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAppointment.meetingType}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Interviewer</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{selectedAppointment.interviewer}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Company</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{selectedAppointment.company}</p>
            </div>
          </div>

          {/* Appointment Details Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-cyan-600 rounded-full"></span>
              <span>Appointment Details</span>
            </h5>
            <div className="space-y-2.5">
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedAppointment.date}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Time</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedAppointment.time}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedAppointment.company}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Interviewer</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedAppointment.interviewer}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location</span>
                </span>
                <span className="font-semibold text-slate-900 text-right max-w-[160px]">{selectedAppointment.location}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>Meeting Type</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedAppointment.meetingType}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400 flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Position</span>
                </span>
                <span className="font-semibold text-slate-900">{selectedAppointment.position}</span>
              </div>
            </div>
          </div>

          {/* Linked Request Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-purple-600 rounded-full"></span>
              <span>Linked Request</span>
            </h5>
            <div 
              onClick={() => showToast('Opening linked request...')}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-xs">{selectedAppointment.linkedReq}</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded-full">{selectedAppointment.linkedReqStatus}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedAppointment.linkedReqDate}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
              <span>Notes</span>
            </h5>
            <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed text-[11px]">
              {selectedAppointment.notes}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h5 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Actions</span>
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleReschedule}
                className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                <span>Reschedule</span>
              </button>
              <button 
                onClick={handleCancel}
                className="py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
            <button 
              onClick={handleMarkCompleted}
              className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-500 cursor-pointer shadow-xs text-[11px]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark as Completed</span>
              <ArrowUpRight className="w-3 h-3 text-blue-200" />
            </button>
          </div>

          {/* Footer Meta */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Appointment ID</span>
              <span className="text-slate-600 font-medium">{selectedAppointment.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Linked Request</span>
              <span className="text-slate-600 font-medium">{selectedAppointment.linkedReq}</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}