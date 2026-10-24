import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  User,
  Sparkles,
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  fetchAdminReviews,
  updateReviewStatus,
  deleteReview,
} from '../api/reviewApi';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Approved' | 'Rejected' | 'All'
  const [search, setSearch] = useState('');
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, reviewId: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminReviews({
        status: activeTab === 'All' ? undefined : activeTab,
        search,
      });
      if (res?.reviews) setReviews(res.reviews);
      if (res?.stats) setStats(res.stats);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      toast.error('Unable to load reviews for moderation.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await updateReviewStatus(id, { status: 'Approved' });
      toast.success('Review approved! It will now appear on the public website slider.');
      await loadReviews();
      window.dispatchEvent(new CustomEvent('reviews-changed'));
    } catch (err) {
      console.error('Failed to approve review:', err);
      toast.error('Failed to approve review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (id) => {
    setRejectionModal({ isOpen: true, reviewId: id, reason: '' });
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionModal.reviewId) return;

    try {
      setActionLoading(true);
      await updateReviewStatus(rejectionModal.reviewId, {
        status: 'Rejected',
        rejectionReason: rejectionModal.reason || 'Did not meet testimonial standards',
      });
      toast.info('Review rejected.');
      setRejectionModal({ isOpen: false, reviewId: null, reason: '' });
      await loadReviews();
      window.dispatchEvent(new CustomEvent('reviews-changed'));
    } catch (err) {
      console.error('Failed to reject review:', err);
      toast.error('Failed to reject review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      toast.success('Review deleted.');
      await loadReviews();
      window.dispatchEvent(new CustomEvent('reviews-changed'));
    } catch (err) {
      console.error('Failed to delete review:', err);
      toast.error('Failed to delete review.');
    }
  };

  const handleToggleFeature = async (review) => {
    try {
      await updateReviewStatus(review._id || review.id, {
        status: review.status,
        isFeatured: !review.isFeatured,
      });
      toast.success(review.isFeatured ? 'Review un-featured.' : 'Review highlighted as featured!');
      await loadReviews();
    } catch (err) {
      toast.error('Failed to toggle featured status.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col min-w-0">
        <Header
          title="Review & Rating Moderation"
          breadcrumbs={['Administration', 'Reviews & Feedback']}
        />

        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Scope Banner */}
          <div className="bg-gradient-to-r from-[#0147A6] via-[#0B6DC8] to-[#02AFA9] text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs">
                <Star className="w-6 h-6 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Partner & Student Reviews Approval Hub</h2>
                <p className="text-xs text-white/80">
                  Moderate submitted reviews from Students, RTOs, and Industry facilities before publishing to public home page
                </p>
              </div>
            </div>
          </div>

          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Feedback</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0147A6] flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Approval</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Approved & Live</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <p className="text-2xl font-black text-slate-900">{stats.averageRating}</p>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar & Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              {[
                { key: 'Pending', label: 'Pending Approval', count: stats.pending },
                { key: 'Approved', label: 'Approved (Live)', count: stats.approved },
                { key: 'Rejected', label: 'Rejected', count: stats.rejected },
                { key: 'All', label: 'All Reviews', count: stats.total },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === tab.key
                        ? 'bg-[#0147A6] text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews, reviewer, RTO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0147A6] transition"
              />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 font-semibold text-xs">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">No {activeTab} Reviews Found</h4>
                <p className="text-xs text-slate-400">
                  {search ? 'Try adjusting your search query.' : 'There are no reviews in this category.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reviews.map((rev) => {
                  const revId = rev._id || rev.id;
                  const isApproved = rev.status === 'Approved';
                  const isRejected = rev.status === 'Rejected';
                  const isPending = rev.status === 'Pending';

                  const roleBadgeColor =
                    rev.reviewerRole === 'RTO Manager' || rev.reviewerRole === 'RTO'
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : rev.reviewerRole === 'Industry' || rev.reviewerRole === 'Industry/Host'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-blue-50 text-[#0147A6] border-blue-200';

                  return (
                    <div
                      key={revId}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-4"
                    >
                      {/* Top Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0147A6] to-[#02AFA9] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                            {rev.reviewerName ? rev.reviewerName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-slate-900 text-sm">{rev.reviewerName}</h4>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadgeColor}`}>
                                {rev.reviewerRole}
                              </span>
                              {rev.isFeatured && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Featured on Home</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {rev.reviewerEmail || 'Verified User'} • Submitted on{' '}
                              {new Date(rev.createdAt).toLocaleDateString('en-AU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge & Rating */}
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-amber-800 ml-1">{rev.rating}.0</span>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {rev.status}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        {rev.title && (
                          <h5 className="font-bold text-slate-800 text-xs">{rev.title}</h5>
                        )}
                        <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                          "{rev.comment}"
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-200/60 mt-2">
                          <span className="font-semibold text-slate-500">Category: {rev.category || 'General'}</span>
                          {rev.rtoName && (
                            <span className="flex items-center space-x-1 text-slate-500">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Associated RTO: <strong>{rev.rtoName}</strong> (Blurred on public site)</span>
                            </span>
                          )}
                          {rev.facilityName && (
                            <span className="flex items-center space-x-1 text-slate-500">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Associated Facility: <strong>{rev.facilityName}</strong> (Blurred on public site)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rejection Note if any */}
                      {isRejected && rev.rejectionReason && (
                        <div className="bg-rose-50 text-rose-800 p-2.5 rounded-xl border border-rose-200 text-xs">
                          <strong>Admin Rejection Note:</strong> {rev.rejectionReason}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mantis Policy: Company names are automatically blurred on the public homepage slider.</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(revId)}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve for Home</span>
                              </button>
                              <button
                                onClick={() => handleOpenReject(revId)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <>
                              <button
                                onClick={() => handleToggleFeature(rev)}
                                className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${
                                  rev.isFeatured
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{rev.isFeatured ? 'Unfeature' : 'Feature on Top'}</span>
                              </button>
                              <button
                                onClick={() => handleOpenReject(revId)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Revoke Approval</span>
                              </button>
                            </>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(revId)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Re-Approve</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(revId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* REJECTION MODAL */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Reject Testimonial / Review</h3>
            <p className="text-xs text-slate-500">
              Provide an optional reason why this review is being rejected. The reviewer will be notified.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                  placeholder="e.g. Inappropriate language, policy compliance conflict, or incomplete details."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Confirm Rejection
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionModal({ isOpen: false, reviewId: null, reason: '' })}
                  className="px-4 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
