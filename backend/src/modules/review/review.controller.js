import { ReviewService } from './review.service.js';

export const createReviewController = async (req, res, next) => {
  try {
    const review = await ReviewService.createReview(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It will appear publicly once approved by an administrator.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReviewsController = async (req, res, next) => {
  try {
    const reviews = await ReviewService.getMyReviews(req.user);
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsAdminController = async (req, res, next) => {
  try {
    const result = await ReviewService.getAllReviewsAdmin(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatusController = async (req, res, next) => {
  try {
    const updated = await ReviewService.updateReviewStatus(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: `Review ${updated.status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewController = async (req, res, next) => {
  try {
    await ReviewService.deleteReview(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicApprovedReviewsController = async (req, res, next) => {
  try {
    const reviews = await ReviewService.getPublicApprovedReviews();
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
