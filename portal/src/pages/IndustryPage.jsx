import React, { useState } from 'react';
import IndustryLayout from '../components/layout/IndustryLayout';
import IndustriesDashboard from '../components/industry/IndustriesDashboard';
import AddNewIndustryWizard from '../components/industry/AddNewIndustryWizard';

export default function IndustryPage() {
  // View states: 'dashboard' | 'add-wizard'
  const [currentView, setCurrentView] = useState('dashboard');

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
        <IndustriesDashboard onAddNewIndustry={() => setCurrentView('add-wizard')} />
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
          />
        </div>
      )}
    </IndustryLayout>
  );
}