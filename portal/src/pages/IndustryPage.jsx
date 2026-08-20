import React, { useState, useEffect, useCallback } from 'react';
import IndustryLayout from '../components/layout/IndustryLayout';
import IndustriesDashboard from '../components/industry/IndustriesDashboard';
import AddNewIndustryWizard from '../components/industry/AddNewIndustryWizard';
import { fetchIndustries, createIndustry, fetchIndustryStats, deleteIndustry } from '../api/industryApi';

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
      await loadData();
    } catch (err) {
      console.error('Failed to create Industry:', err);
      throw err;
    }
  }, [loadData]);

  const handleDeleteIndustry = useCallback(async (id) => {
    try {
      await deleteIndustry(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete Industry:', err);
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