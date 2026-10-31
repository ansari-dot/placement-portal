import ReviewModel from './review.model.js';
import UserModel from '../user/user.model.js';
import StudentModel from '../student/student.model.js';
import NotificationModel from '../notification/notification.model.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/AppError.js';

/**
 * Privacy helper to mask sensitive organization and facility names on public displays.
 * Example: "Sydney International College" -> "S•••••• College (RTO Protected)"
 */
const maskNameForPolicy = (name, type = 'Partner') => {
  if (!name || typeof name !== 'string') return `[${type} Protected]`;
  const clean = name.trim();
  if (!clean) return `[${type} Protected]`;

  const words = clean.split(/\s+/);
  if (words.length === 1) {
    return clean[0] + '••••••';
  }
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  return `${firstWord[0]}•••••• ${lastWord}`;
};

export class ReviewService {
  /**
   * Submit a review publicly from the webmantis-placement website.
   * Stored with status 'Pending' for Admin moderation in placement portal.
   */
  static async createPublicReview(data) {
    const {
      reviewerName,
      reviewerRole = 'Student',
      reviewerEmail = '',
      rating,
      comment,
      title = '',
      category = 'Platform Experience',
      rtoName = '',
      facilityName = '',
    } = data;

    if (!reviewerName || reviewerName.trim().length < 2) {
      throw new BadRequestError('Reviewer name is required (at least 2 characters)');
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5');
    }

    if (!comment || comment.trim().length < 5) {
      throw new BadRequestError('Review comment must be at least 5 characters');
    }

    const numRating = Math.round(Number(rating));

    let canonicalRole = (reviewerRole || 'Student').trim();
    if (canonicalRole.toLowerCase().includes('rto')) canonicalRole = 'RTO Manager';
    else if (canonicalRole.toLowerCase().includes('industry') || canonicalRole.toLowerCase().includes('host') || canonicalRole.toLowerCase().includes('facility')) canonicalRole = 'Industry';
    else if (canonicalRole.toLowerCase().includes('student')) canonicalRole = 'Student';

    const review = await ReviewModel.create({
      reviewer: null,
      reviewerName: reviewerName.trim(),
      reviewerRole: canonicalRole,
      reviewerEmail: (reviewerEmail || '').toLowerCase().trim(),
      reviewerAvatar: '',
      rating: numRating,
      title: (title || '').trim(),
      comment: comment.trim(),
      category: category || 'Platform Experience',
      rtoName: (rtoName || '').trim(),
      facilityName: (facilityName || '').trim(),
      status: 'Pending',
    });

    // Notify active administrators of the new review needing approval
    try {
      const admins = await UserModel.find({
        role: { $in: ['Administrator', 'Admin'] },
        status: 'Active',
        isDeleted: false,
      }).select('_id');

      for (const admin of admins) {
        await NotificationModel.create({
          title: 'New Website Review Pending Approval',
          desc: `${reviewerName.trim()} (${canonicalRole}) submitted a ${numRating}-star review: "${title || comment.substring(0, 40)}..."`,
          type: 'system',
          link: '/reviews',
          recipient: admin._id,
          targetRoles: ['Administrator', 'Admin'],
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins of new review:', notifErr.message);
    }

    return review;
  }

  /**
   * Submit a new review and rating.
   * Accessible by Student, RTO Manager, and Industry partner users.
   */
  static async createReview(data, user) {
    if (!user || !user._id) {
      return await this.createPublicReview(data);
    }

    const { rating, comment, title = '', category = 'Platform Experience' } = data;

    const userEmail = (user.email || '').toLowerCase().trim();
    const existing = await ReviewModel.findOne({
      $or: [
        { reviewer: user._id },
        ...(userEmail ? [{ reviewerEmail: userEmail }] : []),
      ],
      isDeleted: false,
    });
    if (existing) {
      throw new BadRequestError('You have already submitted a review. Thank you for your feedback!');
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5');
    }

    if (!comment || comment.trim().length < 5) {
      throw new BadRequestError('Review comment must be at least 5 characters');
    }

    const numRating = Math.round(Number(rating));

    // Determine canonical role
    let canonicalRole = user.role;
    if (canonicalRole === 'RTO') canonicalRole = 'RTO Manager';
    if (canonicalRole === 'Industry/Host') canonicalRole = 'Industry';

    // Auto-resolve associated RTO and Facility name from user profile or student profile
    let associatedRto = user.rtoName || user.requestedOrgName || '';
    let associatedFacility = user.facilityName || user.requestedFacilityName || '';

    if (canonicalRole === 'Student') {
      try {
        const studentDoc = await StudentModel.findOne({
          $or: [
            { emailAddress: (user.email || '').toLowerCase().trim() },
            { _id: user.studentIdRef || user._id },
          ],
        }).lean();

        if (studentDoc) {
          if (!associatedRto) associatedRto = studentDoc.assignedRto || studentDoc.institute || '';
          if (!associatedFacility && Array.isArray(studentDoc.placementSite) && studentDoc.placementSite.length > 0) {
            associatedFacility = studentDoc.placementSite[0];
          }
        }
      } catch (_) {}
    }

    const review = await ReviewModel.create({
      reviewer: user._id,
      reviewerName: user.name || 'Anonymous User',
      reviewerRole: canonicalRole,
      reviewerEmail: (user.email || '').toLowerCase().trim(),
      reviewerAvatar: user.avatar || '',
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      category,
      rtoName: associatedRto.trim(),
      facilityName: associatedFacility.trim(),
      status: 'Pending', // All reviews require Admin approval before public visibility
    });

    // Notify active administrators of the new review needing approval
    try {
      const admins = await UserModel.find({
        role: { $in: ['Administrator', 'Admin'] },
        status: 'Active',
        isDeleted: false,
      }).select('_id');

      for (const admin of admins) {
        await NotificationModel.create({
          title: 'New Review Pending Approval',
          desc: `${user.name} (${canonicalRole}) submitted a ${numRating}-star review: "${title || comment.substring(0, 40)}..."`,
          type: 'system',
          link: '/reviews',
          recipient: admin._id,
          targetRoles: ['Administrator', 'Admin'],
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins of new review:', notifErr.message);
    }

    return review;
  }

  /**
   * Retrieves all reviews submitted by the authenticated user.
   */
  static async getMyReviews(user) {
    if (!user || !user._id) return [];
    const userEmail = (user.email || '').toLowerCase().trim();
    return await ReviewModel.find({
      $or: [
        { reviewer: user._id },
        ...(userEmail ? [{ reviewerEmail: userEmail }] : []),
      ],
      isDeleted: false,
    }).sort({ createdAt: -1 });
  }

  /**
   * Admin: List all reviews with filtering, pagination, and KPI stats.
   */
  static async getAllReviewsAdmin({ status, search, page = 1, limit = 20 }) {
    const query = { isDeleted: false };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { reviewerName: { $regex: s, $options: 'i' } },
        { comment: { $regex: s, $options: 'i' } },
        { title: { $regex: s, $options: 'i' } },
        { rtoName: { $regex: s, $options: 'i' } },
        { facilityName: { $regex: s, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const [reviews, total, totalCount, pendingCount, approvedCount, rejectedCount, avgRatingResult] = await Promise.all([
      ReviewModel.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      ReviewModel.countDocuments(query),
      ReviewModel.countDocuments({ isDeleted: false }),
      ReviewModel.countDocuments({ status: 'Pending', isDeleted: false }),
      ReviewModel.countDocuments({ status: 'Approved', isDeleted: false }),
      ReviewModel.countDocuments({ status: 'Rejected', isDeleted: false }),
      ReviewModel.aggregate([
        { $match: { isDeleted: false, status: 'Approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
    ]);

    const averageRating = avgRatingResult.length > 0 && avgRatingResult[0].avg
      ? Number(avgRatingResult[0].avg.toFixed(1))
      : 5.0;

    return {
      reviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        averageRating,
      },
    };
  }

  /**
   * Admin: Approve or reject a review.
   */
  static async updateReviewStatus(id, { status, rejectionReason = '', isFeatured }, adminUser) {
    const review = await ReviewModel.findById(id);
    if (!review || review.isDeleted) {
      throw new NotFoundError('Review not found');
    }

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      throw new BadRequestError('Invalid status. Must be Approved, Rejected, or Pending.');
    }

    review.status = status;

    if (status === 'Approved') {
      review.approvedAt = new Date();
      review.approvedBy = adminUser?._id || null;
      review.rejectedAt = null;
      review.rejectedBy = null;
      review.rejectionReason = '';
    } else if (status === 'Rejected') {
      review.rejectedAt = new Date();
      review.rejectedBy = adminUser?._id || null;
      review.rejectionReason = rejectionReason.trim() || 'Review rejected by administrator';
      review.approvedAt = null;
      review.approvedBy = null;
    }

    if (typeof isFeatured === 'boolean') {
      review.isFeatured = isFeatured;
    }

    await review.save();

    // Notify reviewer of decision if authenticated user
    if (review.reviewer) {
      try {
        await NotificationModel.create({
          title: status === 'Approved' ? 'Review Approved' : 'Review Status Update',
          desc: status === 'Approved'
            ? 'Your review has been approved and published to the Mantis testimonials section!'
            : `Your review could not be approved: ${rejectionReason || 'Does not meet publication guidelines.'}`,
          type: 'system',
          link: '/',
          recipient: review.reviewer,
        });
      } catch (_) {}
    }

    return review;
  }

  /**
   * Admin: Soft-delete review.
   */
  static async deleteReview(id, adminUser) {
    const review = await ReviewModel.findById(id);
    if (!review || review.isDeleted) {
      throw new NotFoundError('Review not found');
    }

    review.isDeleted = true;
    review.deletedAt = new Date();
    review.deletedBy = adminUser?._id || null;
    await review.save();

    return true;
  }

  /**
   * Public: Get approved reviews for homepage slider with RTO/Industry names
   * blurred / masked per privacy policy.
   */
  static async getPublicApprovedReviews() {
    const reviews = await ReviewModel.find({
      status: 'Approved',
      isDeleted: false,
    })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(20)
      .lean();

    return reviews.map((r) => {
      const rawRto = (r.rtoName || '').trim();
      const rawFacility = (r.facilityName || '').trim();

      return {
        _id: r._id,
        id: r._id,
        reviewerName: r.reviewerName,
        reviewerRole: r.reviewerRole,
        reviewerAvatar: r.reviewerAvatar,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        category: r.category,
        // Privacy enforcement: mask names directly in response
        blurredRtoName: rawRto ? maskNameForPolicy(rawRto, 'RTO Partner') : '',
        blurredFacilityName: rawFacility ? maskNameForPolicy(rawFacility, 'Host Facility') : '',
        hasRto: Boolean(rawRto),
        hasFacility: Boolean(rawFacility),
        isFeatured: Boolean(r.isFeatured),
        createdAt: r.createdAt,
      };
    });
  }
}
