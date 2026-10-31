import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Star, X, CheckCircle2, ShieldCheck, AlertCircle, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { createReview, fetchMyReviews } from '../../api/reviewApi';

const RATING_LABELS = {
  1: '1 Star — Needs Improvement',
  2: '2 Stars — Fair Experience',
  3: '3 Stars — Good & Reliable',
  4: '4 Stars — Very Good & Supportive',
  5: '5 Stars — Outstanding & Exceptional',
};

export default function ReviewSubmitModal({ isOpen, onClose, onSuccess }) {
  const authUser = useSelector((state) => state.auth?.user);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('Platform Experience');
  const [submitting, setSubmitting] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isOpen && authUser) {
      loadMyReviews();
    }
  }, [isOpen, authUser]);

  const loadMyReviews = async () => {
    try {
      const data = await fetchMyReviews();
      setMyReviews(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      toast.error('Please enter a review of at least 5 characters.');
      return;
    }

    try {
      setSubmitting(true);
      await createReview({
        rating,
        title: title.trim(),
        comment: comment.trim(),
        category,
      });

      toast.success('Your review has been submitted for administrator approval!');
      setTitle('');
      setComment('');
      setRating(5);
      await loadMyReviews();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentRoleLabel =
    authUser?.role === 'RTO Manager' || authUser?.role === 'RTO'
      ? 'Registered Training Organisation (RTO)'
      : authUser?.role === 'Industry' || authUser?.role === 'Industry/Host'
      ? 'Industry / Host Facility Partner'
      : authUser?.role === 'Student'
      ? 'Student'
      : authUser?.role || 'User';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0147A6] via-[#0B6DC8] to-[#02AFA9] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-snug">Share Your Feedback & Rating</h3>
              <p className="text-xs text-white/80 font-medium">Review your Mantis Placements experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Reviewer Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Reviewing As</span>
              <span className="font-bold text-slate-800">{authUser?.name || 'Verified User'}</span>
              <span className="text-slate-500 ml-1.5 font-medium">({currentRoleLabel})</span>
            </div>
            <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Account</span>
            </div>
          </div>

          {myReviews.length > 0 ? (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-extrabold text-emerald-900">Review Already Submitted</h4>
                <p className="text-xs text-emerald-700 font-medium">
                  You have already submitted your review. Thank you for sharing your experience!
                </p>
              </div>

              {myReviews.map((rev) => (
                <div key={rev._id || rev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                      ))}
                      <span className="text-slate-600 text-xs font-bold ml-1.5">{rev.rating} / 5</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rev.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rev.status || 'Pending Approval'}
                    </span>
                  </div>
                  {rev.title && <p className="font-bold text-slate-800 text-xs">{rev.title}</p>}
                  <p className="text-slate-600 text-xs leading-relaxed">"{rev.comment}"</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Category: {rev.category || 'Platform Experience'}</span>
                    <span>Submitted: {new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Star Rating Selector */}
              <div className="text-center p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Overall Rating *
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const isFilled = (hoverRating || rating) >= starNum;
                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        onMouseEnter={() => setHoverRating(starNum)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-bold text-amber-800">
                  {RATING_LABELS[hoverRating || rating]}
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Feedback Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0147A6] bg-white font-semibold text-slate-700 shadow-xs cursor-pointer"
                >
                  <option value="Platform Experience">Platform & Portal Experience</option>
                  <option value="Placement Support">Placement Coordination & Support</option>
                  <option value="Compliance & Tracking">Compliance & Attendance Tracking</option>
                  <option value="Host Facility Experience">Host Facility Partnership</option>
                  <option value="General">General Feedback & Testimonial</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Headline / Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Great placement support and smooth coordination"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0147A6] font-medium text-slate-800 shadow-xs"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Your Review / Testimonial *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your experience working with Mantis Placements. What did you like best?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0147A6] font-medium text-slate-800 shadow-xs resize-none"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                  {comment.length}/2000 characters
                </span>
              </div>

              {/* Privacy Policy Callout */}
              <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3 flex items-start space-x-2.5 text-[11px] text-blue-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#0147A6] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#0147A6] block">Data Privacy Guarantee:</span>
                  <p className="text-[10px] text-blue-800/90 leading-relaxed">
                    In compliance with our business privacy policy, RTO and Host Facility names are strictly masked and blurred on public testimonial displays to protect company identities.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="flex-1 py-3 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-extrabold rounded-xl shadow-xs transition-all duration-500 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting for Review...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Submit Review for Admin Approval</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Past reviews accordion/history */}
          {myReviews.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs font-bold text-[#0147A6] hover:underline flex items-center space-x-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Your Previous Submissions ({myReviews.length})</span>
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2.5 max-h-40 overflow-y-auto">
                  {myReviews.map((rev) => (
                    <div key={rev._id || rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            rev.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rev.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rev.status}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium text-[11px] line-clamp-2">
                        "{rev.comment}"
                      </p>
                      <span className="text-[9px] text-slate-400 block">
                        Submitted: {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
