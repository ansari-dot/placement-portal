import React, { useState, useEffect, useCallback } from 'react';
import JobLayout from '../components/layout/JobLayout';
import UsersPageApp from '../components/user/UsersPageApp';
import { fetchUsers, fetchUserStats, createUser, updateUser, deleteUser, fetchPendingUsers, approveUser, rejectUser } from '../api/userApi';
import { toast } from 'react-toastify';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    coordinatorUsers: 0,
    rtoManagerUsers: 0,
    staffUsers: 0,
    industryUsers: 0,
    inactiveUsers: 0,
    pendingUsers: 0,
    newThisMonth: 0
  });

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const loadData = useCallback(async (filters = {}) => {
    try {
      const [userList, userStats, pendingList] = await Promise.all([
        fetchUsers(filters),
        fetchUserStats(),
        fetchPendingUsers()
      ]);
      if (userList.success && userList.data) setUsers(userList.data);
      if (userStats.success && userStats.data) setStats(userStats.data);
      if (pendingList.success && pendingList.data) setPendingUsers(pendingList.data);
    } catch (err) {
      console.error('Failed to load User data:', err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateUser = useCallback(async (formData) => {
    try {
      await createUser(formData);
      await loadData();
      setShowModal(false);
      setEditingUser(null);
      toast.success(`User account for "${formData.name}" created successfully!`);
    } catch (err) {
      console.error('Failed to create User:', err);
      const msg = err?.response?.data?.message || 'Failed to create user account.';
      toast.error(msg);
      throw err;
    }
  }, [loadData]);

  const handleUpdateUser = useCallback(async (id, formData) => {
    try {
      await updateUser(id, formData);
      await loadData();
      setShowModal(false);
      setEditingUser(null);
      toast.success(`User account "${formData.name}" updated successfully!`);
    } catch (err) {
      console.error('Failed to update User:', err);
      const msg = err?.response?.data?.message || 'Failed to update user account.';
      toast.error(msg);
      throw err;
    }
  }, [loadData]);

  const handleDeleteUser = useCallback(async (id, userName = 'this user') => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await deleteUser(id);
      await loadData();
      toast.success(res?.message || 'User deleted successfully.');
    } catch (err) {
      console.error('Failed to delete User:', err);
      const msg = err?.response?.data?.message || 'Failed to delete user account.';
      toast.error(msg);
    }
  }, [loadData]);

  const handleApproveUser = useCallback(async (id, userName = 'user') => {
    try {
      await approveUser(id);
      await loadData();
      toast.success(`${userName}'s account has been approved.`);
    } catch (err) {
      console.error('Failed to approve user:', err);
      const msg = err?.response?.data?.message || 'Failed to approve user.';
      toast.error(msg);
    }
  }, [loadData]);

  const handleRejectUser = useCallback(async (id, userName = 'user') => {
    if (!window.confirm(`Are you sure you want to reject ${userName}'s registration request?`)) {
      return;
    }
    try {
      await rejectUser(id);
      await loadData();
      toast.success(`${userName}'s registration request has been rejected.`);
    } catch (err) {
      console.error('Failed to reject user:', err);
      const msg = err?.response?.data?.message || 'Failed to reject user.';
      toast.error(msg);
    }
  }, [loadData]);

  const handleOpenAddModal = (user = null) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  return (
    <JobLayout title="Users Management" breadcrumbs={['Dashboard', 'Administration', 'Users']}>
      <UsersPageApp
        users={users}
        pendingUsers={pendingUsers}
        stats={stats}
        onFilterChange={loadData}
        onDeleteUser={handleDeleteUser}
        onAddUser={handleOpenAddModal}
        showAddModal={showModal}
        onCloseAddModal={handleCloseModal}
        onCreateUser={handleCreateUser}
        editingUser={editingUser}
        onUpdateUser={handleUpdateUser}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
      />
    </JobLayout>
  );
}
