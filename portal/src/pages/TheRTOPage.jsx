import React, { useState, useEffect, useCallback } from 'react';
import RTOLayout from '../components/layout/RTOLayout';
import RtoDashboard from '../components/RTO/RtoDashboard';
import AddRtoWizard from '../components/RTO/AddRtoWizard';
import { fetchRtos, createRto, fetchRtoStats, deleteRto } from '../api/rtoApi';

export default function TheRTOPage() {
  // View states: 'dashboard' | 'add-wizard'
  const [currentView, setCurrentView] = useState('dashboard');
  const [rtos, setRtos] = useState([]);
  const [stats, setStats] = useState({
    totalRtos: 0,
    activeRtos: 0,
    inactiveRtos: 0,
    totalStudents: 0,
    newThisMonth: 0
  });

  const loadData = useCallback(async (filters = {}) => {
    try {
      const [rtoList, rtoStats] = await Promise.all([
        fetchRtos(filters),
        fetchRtoStats()
      ]);
      if (rtoList.success && rtoList.data) {
        setRtos(rtoList.data);
      }
      if (rtoStats.success && rtoStats.data) {
        setStats(rtoStats.data);
      }
    } catch (err) {
      console.error('Failed to load RTO data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRto = useCallback(async (formData) => {
    try {
      await createRto(formData);
      await loadData();
    } catch (err) {
      console.error('Failed to create RTO:', err);
      throw err;
    }
  }, [loadData]);

  const handleDeleteRto = useCallback(async (id) => {
    try {
      await deleteRto(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete RTO:', err);
    }
  }, [loadData]);

  return (
    <RTOLayout
      title={currentView === 'dashboard' ? 'RTOs' : 'Add New RTO'}
      breadcrumbs={
        currentView === 'dashboard'
          ? ['Dashboard', 'Partners', 'RTOs']
          : ['Dashboard', 'Partners', 'RTOs', 'Add New RTO']
      }
    >
      {currentView === 'dashboard' ? (
        <RtoDashboard 
          onAddNewRto={() => setCurrentView('add-wizard')} 
          rtos={rtos} 
          stats={stats} 
          onFilterChange={loadData}
          onDeleteRto={handleDeleteRto}
        />
      ) : (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-8 pt-4">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-semibold text-blue-600 hover:underline mb-2 flex items-center space-x-1"
            >
              ← Back to RTO List
            </button>
          </div>
          <AddRtoWizard 
            onCancel={() => setCurrentView('dashboard')} 
            onComplete={() => setCurrentView('dashboard')} 
            onCreateRto={handleCreateRto}
          />
        </div>
      )}
    </RTOLayout>
  );
}