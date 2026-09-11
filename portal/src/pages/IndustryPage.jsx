import React, { useState, useEffect, useCallback } from 'react';
import IndustryLayout from '../components/layout/IndustryLayout';
import IndustriesDashboard from '../components/industry/IndustriesDashboard';
import AddNewIndustryWizard from '../components/industry/AddNewIndustryWizard';
import { fetchIndustries, createIndustry, updateIndustry, fetchIndustryStats, deleteIndustry } from '../api/industryApi';
import { toast } from 'react-toastify';

export default function IndustryPage() {
  // View states: 'dashboard' | 'add-wizard'
  const [currentView, setCurrentView] = useState('dashboard');
  const [industries, setIndustries] = useState([]);
  const [stats, setStats] = useState({
    totalIndustries: 0,
    activeIndustries: 0,
    inactiveIndustries: 0,
    totalStudents: 0,
    totalJobs: 0
  });

  const loadData = useCallback(async (filters = {}) => {
    try {
      const [indList, indStats] = await Promise.all([
        fetchIndustries(filters),
        fetchIndustryStats()
      ]);
      if (indList.success && indList.data) {
        setIndustries(indList.data);
      }
      if (indStats.success && indStats.data) {
        setStats(indStats.data);
      }
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

  return (
    <IndustryLayout
      title={currentView === 'dashboard' ? 'Industries' : 'Add New Industry'}
      breadcrumbs={
        currentView === 'dashboard'
          ? ['Dashboard', 'Partners', 'Industries']
          : ['Dashboard', 'Partners', 'Industries', 'Add New Industry']
      }
    >
      {currentView === 'dashboard' ? (
        <IndustriesDashboard 
          onAddNewIndustry={() => setCurrentView('add-wizard')} 
          industries={industries} 
          stats={stats} 
          onFilterChange={loadData}
          onDeleteIndustry={handleDeleteIndustry}
          onUpdateIndustry={handleUpdateIndustry}
        />
      ) : (
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
      )}
    </IndustryLayout>
  );
}