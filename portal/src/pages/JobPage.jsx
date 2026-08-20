import React, { useState, useEffect, useCallback } from 'react';
import JobLayout from '../components/layout/JobLayout';
import JobsPageApp from '../components/job/JobsPageApp';
import { fetchJobs, fetchJobStats, createJob, deleteJob } from '../api/jobApi';

export default function JobPage() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    filledJobs: 0,
    expiredJobs: 0,
    newThisMonth: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(async (filters = {}) => {
    try {
      const [jobList, jobStats] = await Promise.all([
        fetchJobs(filters),
        fetchJobStats()
      ]);
      if (jobList.success && jobList.data) setJobs(jobList.data);
      if (jobStats.success && jobStats.data) setStats(jobStats.data);
    } catch (err) {
      console.error('Failed to load Job data:', err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateJob = useCallback(async (formData) => {
    try {
      await createJob(formData);
      await loadData();
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create Job:', err);
      throw err;
    }
  }, [loadData]);

  const handleDeleteJob = useCallback(async (id) => {
    try {
      await deleteJob(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete Job:', err);
    }
  }, [loadData]);

  return (
    <JobLayout title="Jobs" breadcrumbs={['Dashboard', 'Operations', 'Jobs']}>
      <JobsPageApp
        jobs={jobs}
        stats={stats}
        onFilterChange={loadData}
        onDeleteJob={handleDeleteJob}
        onAddJob={() => setShowAddModal(true)}
        showAddModal={showAddModal}
        onCloseAddModal={() => setShowAddModal(false)}
        onCreateJob={handleCreateJob}
      />
    </JobLayout>
  );
}