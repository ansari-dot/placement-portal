import React from 'react';
import IndustryLayout from '../components/layout/IndustryLayout';
import ScoreTab from '../components/user/ScoreTab';

// Standalone Score page - opened from its own sidebar entry (below "Industry").
// Same layout wrapper as IndustryPage so the sidebar/header stay identical.
export default function ScorePage() {
  return (
    <IndustryLayout
      title="Score"
      breadcrumbs={['Dashboard', 'Partners', 'Score']}
    >
      <div className="p-6 max-w-[1600px] mx-auto w-full">
        <ScoreTab />
      </div>
    </IndustryLayout>
  );
}