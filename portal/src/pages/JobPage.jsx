import React from 'react';
import JobLayout from '../components/layout/JobLayout';
import JobsPageApp from '../components/job/JobsPageApp';

export default function JobPage() {
  return (
    <JobLayout
      title="Jobs"
      breadcrumbs={['Dashboard', 'Operations', 'Jobs']}
    >
      <JobsPageApp />
    </JobLayout>
  );
}