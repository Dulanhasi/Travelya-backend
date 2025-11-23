const db = require('../config/database');

/**
 * Create a review
 * POST /api/reviews
 */
exports.createReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reviewType, targetId, rating, comment, images } = req.body;

    if (!reviewType || !targetId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Review type, target ID, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if target exists
    if (reviewType === 'location') {
      const [locations] = await db.query(
        'SELECT locationId FROM locations WHERE locationId = ?',
        [targetId]
      );
      if (locations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
    } else if (reviewType === 'service_provider') {
      const [providers] = await db.query(
        'SELECT providerId FROM service_providers WHERE providerId = ?',
        [targetId]
      );
      if (providers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found'
        });
      }
    }

    // Check if user already reviewed this target
    const [existing] = await db.query(
      'SELECT reviewId FROM reviews WHERE reviewerId = ? AND reviewType = ? AND targetId = ?',
      [userId, reviewType, targetId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this item. Use update instead.'
      });
    }

    // Insert review
    const [result] = await db.query(
      `INSERT INTO reviews (reviewerId, reviewType, targetId, rating, comment, images)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, reviewType, targetId, rating, comment, JSON.stringify(images || [])]
    );

    // Update average rating and count
    await updateTargetRating(reviewType, targetId);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: {
        reviewId: result.insertId
      }
    });
  } catch (error) {
    console.error('Create review error:', error);
    next(error);
  }
};

/**
 * Get reviews for a target (location or service provider)
 * GET /api/reviews/:reviewType/:targetId
 */
exports.getReviewsByTarget = async (req, res, next) => {
  try {
    const { reviewType, targetId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const [reviews] = await db.query(
      `SELECT
        r.reviewId,
        r.rating,
        r.comment,
        r.images,
        r.isVerified,
        r.createdAt,
        u.userId,
        u.firstName,
        u.lastName,
        u.profileImage
      FROM reviews r
      JOIN users u ON r.reviewerId = u.userId
      WHERE r.reviewType = ? AND r.targetId = ?
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?`,
      [reviewType, targetId, parseInt(limit), parseInt(offset)]
    );

    // Parse JSON fields
    reviews.forEach(review => {
      if (review.images) review.images = JSON.parse(review.images);
    });

    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('Get reviews by target error:', error);
    next(error);
  }
};

/**
 * Get my reviews
 * GET /api/reviews/my-reviews
 */
exports.getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [reviews] = await db.query(
      `SELECT
        r.reviewId,
        r.reviewType,
        r.targetId,
        r.rating,
        r.comment,
        r.images,
        r.createdAt,
        CASE
          WHEN r.reviewType = 'location' THEN l.name
          WHEN r.reviewType = 'service_provider' THEN sp.businessName
        END as targetName
      FROM reviews r
      LEFT JOIN locations l ON r.reviewType = 'location' AND r.targetId = l.locationId
      LEFT JOIN service_providers sp ON r.reviewType = 'service_provider' AND r.targetId = sp.providerId
      WHERE r.reviewerId = ?
      ORDER BY r.createdAt DESC`,
      [userId]
    );

    // Parse JSON fields
    reviews.forEach(review => {
      if (review.images) review.images = JSON.parse(review.images);
    });

    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    next(error);
  }
};

/**
 * Update a review
 * PATCH /api/reviews/:reviewId
 */
exports.updateReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

    // Check ownership
    const [reviews] = await db.query(
      'SELECT reviewType, targetId FROM reviews WHERE reviewId = ? AND reviewerId = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    const updateFields = [];
    const params = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      updateFields.push('rating = ?');
      params.push(rating);
    }

    if (comment !== undefined) {
      updateFields.push('comment = ?');
      params.push(comment);
    }

    if (images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(images));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(reviewId);

    await db.query(
      `UPDATE reviews SET ${updateFields.join(', ')} WHERE reviewId = ?`,
      params
    );

    // Update average rating if rating changed
    if (rating !== undefined) {
      await updateTargetRating(reviews[0].reviewType, reviews[0].targetId);
    }

    res.json({
      success: true,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    next(error);
  }
};

/**
 * Delete a review
 * DELETE /api/reviews/:reviewId
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    // Check ownership
    const [reviews] = await db.query(
      'SELECT reviewType, targetId FROM reviews WHERE reviewId = ? AND reviewerId = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    const { reviewType, targetId } = reviews[0];

    await db.query('DELETE FROM reviews WHERE reviewId = ?', [reviewId]);

    // Update average rating
    await updateTargetRating(reviewType, targetId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    next(error);
  }
};

/**
 * Get review statistics for a target
 * GET /api/reviews/stats/:reviewType/:targetId
 */
exports.getReviewStats = async (req, res, next) => {
  try {
    const { reviewType, targetId } = req.params;

    const [stats] = await db.query(
      `SELECT
        COUNT(*) as totalReviews,
        AVG(rating) as averageRating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as fiveStars,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as fourStars,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as threeStars,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as twoStars,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as oneStar
      FROM reviews
      WHERE reviewType = ? AND targetId = ?`,
      [reviewType, targetId]
    );

    const result = stats[0];
    result.averageRating = parseFloat(result.averageRating || 0).toFixed(2);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    next(error);
  }
};

/**
 * Helper function to update target rating
 */
async function updateTargetRating(reviewType, targetId) {
  const [stats] = await db.query(
    `SELECT COUNT(*) as total, AVG(rating) as avgRating
    FROM reviews
    WHERE reviewType = ? AND targetId = ?`,
    [reviewType, targetId]
  );

  const { total, avgRating } = stats[0];

  if (reviewType === 'location') {
    await db.query(
      'UPDATE locations SET ratings = ?, totalReviews = ? WHERE locationId = ?',
      [avgRating || 0, total, targetId]
    );
  } else if (reviewType === 'service_provider') {
    await db.query(
      'UPDATE service_providers SET overallRating = ?, totalReviews = ? WHERE providerId = ?',
      [avgRating || 0, total, targetId]
    );
  }
}
