import React from 'react';
import { 
  Building2, CheckCircle2, PauseCircle, Briefcase, GraduationCap, 
  Search, SlidersHorizontal, Plus, ChevronDown, Download, 
  MoreHorizontal, Eye, Edit2, ChevronLeft, ChevronRight, 
  MapPin, ArrowUpRight
} from 'lucide-react';

export default function IndustriesDashboard({ onAddNewIndustry }) {
  return (
    <div className="flex-1 bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Main Content Area */}
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">

        {/* Top Metrics Cards Grid */}
        <div className="grid grid-cols-5 gap-4">
          
          {/* Card 1 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Industries</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">128</h3>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
                +12 this month <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Active Industries</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">102</h3>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                79.7% <span className="text-slate-500 font-normal ml-1">of total</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Inactive Industries</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">26</h3>
              <span className="inline-flex items-center text-xs font-semibold text-amber-600">
                20.3% <span className="text-slate-500 font-normal ml-1">of total</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PauseCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Job Listings</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">432</h3>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
                +18 this month <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Students Placed</p>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">1,265</h3>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
                +85 this month <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Layout Grid: Main Table Section (left) & Analytics/Widgets (right) */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Table & Filters */}
          <div className="col-span-9 space-y-4">
            
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search industries by name, sector, or contact..." 
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 shadow-sm"
                  />
                </div>

                <div className="relative">
                  <select className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 font-medium outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
                    <option>All Sectors</option>
                    <option>Information Technology</option>
                    <option>Healthcare</option>
                    <option>Construction</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm text-slate-700 font-medium outline-none focus:border-indigo-500 shadow-sm cursor-pointer">
                    <option>Status: All</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <button className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg shadow-sm transition-colors">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  <span>More Filters</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

              </div>

              <button
                onClick={onAddNewIndustry}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Industry</span>
              </button>
            </div>

            {/* Table Counter & Export Actions */}
            <div className="flex items-center justify-between text-sm text-slate-500 px-1">
              <span>Showing 1 to 10 of 128 industries</span>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                </button>
                <div className="relative">
                  <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors">
                    <span>Bulk Actions</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 flex items-center gap-1 cursor-pointer hover:text-slate-700">
                      Industry / Company <ChevronDown className="w-3.5 h-3.5" />
                    </th>
                    <th className="py-3.5 px-4">Sector</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Students</th>
                    <th className="py-3.5 px-4">Jobs</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  
                  {/* Row 1 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          Tech
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">AI Global Solutions Pty Ltd</div>
                          <div className="text-xs text-slate-500">ABN: 12 345 678 901</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-100">
                        Information Technology
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Melbourne, VIC
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">125</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">28</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          HP
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">HealthPlus Australia</div>
                          <div className="text-xs text-slate-500">ABN: 98 765 432 109</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100">
                        Healthcare
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Sydney, NSW
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">98</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">22</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          BR
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">BuildRight Construction</div>
                          <div className="text-xs text-slate-500">ABN: 45 678 912 345</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-100">
                        Construction
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Brisbane, QLD
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">76</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">18</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          FS
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">FinServe Financial Group</div>
                          <div className="text-xs text-slate-500">ABN: 33 111 222 333</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full border border-purple-100">
                        Finance
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Perth, WA
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200">
                        Inactive <PauseCircle className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">34</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">6</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 5 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          EI
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">EduTech Innovations</div>
                          <div className="text-xs text-slate-500">ABN: 66 444 555 666</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-100">
                        Education
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Adelaide, SA
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">64</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">14</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 6 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          GF
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Green Future Solutions</div>
                          <div className="text-xs text-slate-500">ABN: 77 888 999 000</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100">
                        Environment
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Melbourne, VIC
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">52</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">11</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 7 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          RD
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Retail Dynamics Pty Ltd</div>
                          <div className="text-xs text-slate-500">ABN: 22 333 444 555</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-rose-50 text-rose-700 text-xs font-medium px-2.5 py-1 rounded-full border border-rose-100">
                        Retail
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Sydney, NSW
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200">
                        Inactive <PauseCircle className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">18</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">3</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 8 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          MX
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">ManufactureX Industries</div>
                          <div className="text-xs text-slate-500">ABN: 55 666 777 888</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-100">
                        Manufacturing
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Geelong, VIC
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">87</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">19</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 9 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          TT
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Travel & Tourism Co.</div>
                          <div className="text-xs text-slate-500">ABN: 11 222 333 444</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-pink-50 text-pink-700 text-xs font-medium px-2.5 py-1 rounded-full border border-pink-100">
                        Tourism
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Gold Coast, QLD
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">39</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">7</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 10 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          CS
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">CyberSecure Australia</div>
                          <div className="text-xs text-slate-500">ABN: 44 555 666 777</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full border border-teal-100">
                        Cyber Security
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Canberra, ACT
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        Active <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">71</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">16</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>

              {/* Table Footer Pagination */}
              <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">1</button>
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors">2</button>
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors">3</button>
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors">4</button>
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors">5</button>
                  <span className="text-slate-400 px-1">...</span>
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors">13</button>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>10 / page</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Widgets / Analytics Cards */}
          <div className="col-span-3 space-y-6">
            
            {/* Industry Overview Chart/Stats Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Industry Overview</h2>
              
              {/* Circular Graphic Simulation */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="w-36 h-36 rounded-full border-[10px] border-slate-100 border-t-amber-500 border-r-indigo-600 border-b-sky-500 flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-2xl font-bold text-slate-900">128</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 font-medium">Active (102)</span>
                  </div>
                  <span className="font-semibold text-slate-900">79.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 font-medium">Inactive (26)</span>
                  </div>
                  <span className="font-semibold text-slate-900">20.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="text-slate-600 font-medium">New This Month (12)</span>
                  </div>
                  <span className="font-semibold text-slate-900">--</span>
                </div>
              </div>
            </div>

            {/* Top Sectors by Students Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Top Sectors by Students</h2>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Information Technology</span>
                    <span className="font-semibold text-slate-900">412</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Healthcare</span>
                    <span className="font-semibold text-slate-900">298</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Construction</span>
                    <span className="font-semibold text-slate-900">187</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Education</span>
                    <span className="font-semibold text-slate-900">156</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1 text-slate-700">
                    <span>Finance</span>
                    <span className="font-semibold text-slate-900">98</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Added Industries Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Recent Added Industries</h2>
                <a href="#view-all" className="text-xs font-semibold text-indigo-600 hover:underline">View All</a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">Smart Energy Solutions</h4>
                    <p className="text-[11px] text-slate-400">Added on 18 Jul 2025</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">AgriTech Australia</h4>
                    <p className="text-[11px] text-slate-400">Added on 16 Jul 2025</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">LogiChain Logistics</h4>
                    <p className="text-[11px] text-slate-400">Added on 14 Jul 2025</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">Creative Digital Agency</h4>
                    <p className="text-[11px] text-slate-400">Added on 12 Jul 2025</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Promotional/Partner Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl p-4 text-white shadow-sm flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Partner with more industries</h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">Expand opportunities for your students</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-200 flex-shrink-0" />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}