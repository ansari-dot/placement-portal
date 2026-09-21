import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import IndustryLayout from '../components/layout/IndustryLayout';
import IndustriesDashboard from '../components/industry/IndustriesDashboard';
import AddNewIndustryWizard from '../components/industry/AddNewIndustryWizard';
import MyIndustriesTab from '../components/industry/MyIndustriesTab';
// CHANGED: ScoreTab import and Trophy icon removed - Score now lives on its own page (ScorePage.jsx)
import { fetchIndustries, createIndustry, updateIndustry, fetchIndustryStats, deleteIndustry } from '../api/industryApi';
import { toast } from 'react-toastify';
import { Building2, User } from 'lucide-react';

export default function IndustryPage() {
  const authUser = useSelector(state => state.auth?.user);
  const isAdmin = authUser?.role === 'Administrator';

  // View: 'dashboard' | 'add-wizard'
  const [currentView, setCurrentView] = useState('dashboard');
  // Tab bar: 'all' | 'my'   (CHANGED: 'score' removed)
  const [activeTab, setActiveTab] = useState('all');

  const [industries, setIndustries] = useState([]);
  const [stats, setStats] = useState({
    totalIndustries: 0,
    activeIndustries: 0,
    inactiveIndustries: 0,
    totalStudents: 0,
    totalJobs: 0,
  });

  const loadData = useCallback(async (filters = {}) => {
    try {
      const [indList, indStats] = await Promise.all([
        fetchIndustries(filters),
        fetchIndustryStats(),
      ]);
      if (indList.success && indList.data) setIndustries(indList.data);
      if (indStats.success && indStats.data) setStats(indStats.data);
    } catch (err) {
      console.error('Failed to load Industry data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateIndustry = useCallback(async (formData) => {
    try {
      await createIndustry(formData);
      toast.success('Industry created successfully');
      await loadData();
    } catch (err) {
      console.error('Failed to create Industry:', err);
      toast.error(err?.response?.data?.message || 'Failed to create Industry');
      throw err;
    }
  }, [loadData]);

  const handleUpdateIndustry = useCallback(async (id, updateData) => {
    try {
      const res = await updateIndustry(id, updateData);
      toast.success(res?.message || 'Industry updated successfully');
      await loadData();
    } catch (err) {
      console.error('Failed to update Industry:', err);
      toast.error(err?.response?.data?.message || 'Failed to update Industry');
      throw err;
    }
  }, [loadData]);

  const handleDeleteIndustry = useCallback(async (id, name) => {
    try {
      const res = await deleteIndustry(id);
      toast.success(res?.message || `${name || 'Industry'} deleted successfully`);
      await loadData();
    } catch (err) {
      console.error('Failed to delete Industry:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete Industry');
    }
  }, [loadData]);

  const handleAddNewIndustry = () => {
    setActiveTab('all');
    setCurrentView('add-wizard');
  };

  const tabClass = (tab) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
    }`;

  return (
    <IndustryLayout
      title={currentView === 'dashboard' ? 'Industries' : 'Add New Industry'}
      breadcrumbs={
        currentView === 'dashboard'
          ? ['Dashboard', 'Partners', 'Industries']
          : ['Dashboard', 'Partners', 'Industries', 'Add New Industry']
      }
    >
      {currentView === 'add-wizard' ? (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-2 pt-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-semibold text-blue-600 hover:underline mb-1 flex items-center space-x-1"
            >
              ← Back to Industry List
            </button>
          </div>
          <AddNewIndustryWizard
            onCancel={() => setCurrentView('dashboard')}
            onComplete={() => setCurrentView('dashboard')}
            onCreateIndustry={handleCreateIndustry}
          />
        </div>
      ) : (
        <div className="flex flex-col">

          {/* ── Tab bar: All Industries | My Industries ── */}
          <div className="px-6 pt-1 bg-white border-b border-slate-200">
            <div className="flex items-center gap-1 max-w-[1600px] mx-auto">
              <button onClick={() => setActiveTab('all')} className={tabClass('all')}>
                <Building2 className="w-4 h-4" />
                All Industries
              </button>
              <button onClick={() => setActiveTab('my')} className={tabClass('my')}>
                <User className="w-4 h-4" />
                {isAdmin ? 'My Industries (All)' : 'My Industries'}
              </button>
            </div>
          </div>

          {/* ── Tab content ── */}
          {activeTab === 'all' && (
            <IndustriesDashboard
              onAddNewIndustry={handleAddNewIndustry}
              industries={industries}
              stats={stats}
              onFilterChange={loadData}
              onDeleteIndustry={handleDeleteIndustry}
              onUpdateIndustry={handleUpdateIndustry}
            />
          )}

          {activeTab === 'my' && (
            <div className="p-6 max-w-[1600px] mx-auto w-full">
              <MyIndustriesTab onAddNewIndustry={handleAddNewIndustry} />
            </div>
          )}

        </div>
      )}
    </IndustryLayout>
  );
}