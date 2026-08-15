import React, { useState } from 'react';
import RTOLayout from '../components/layout/RTOLayout';
import RtoDashboard from '../components/RTO/RtoDashboard';
import AddRtoWizard from '../components/RTO/AddRtoWizard';

export default function TheRTOPage() {
  // View states: 'dashboard' | 'add-wizard'
  const [currentView, setCurrentView] = useState('dashboard');

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
        <RtoDashboard onAddNewRto={() => setCurrentView('add-wizard')} />
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
          />
        </div>
      )}
    </RTOLayout>
  );
}