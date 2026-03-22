const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth.middleware');

// Crear reseña
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { targetId, targetType, rating, comment, images } = req.body;

    const review = new Review({
      userId: req.user.userId,
      targetId,
      targetType,
      rating,
      comment,
      images
    });

    await review.save();

    // Actualizar rating promedio
    const reviews = await Review.find({ targetId, targetType });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    if (targetType === 'store') {
      await Store.findByIdAndUpdate(targetId, {
        rating: avgRating,
        reviewsCount: reviews.length
      });
    } else {
      await Product.findByIdAndUpdate(targetId, {
        rating: avgRating,
        reviewsCount: reviews.length
      });
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener reseñas
router.get('/:targetType/:targetId', async (req, res) => {
  try {
    const reviews = await Review.find({
      targetId: req.params.targetId,
      targetType: req.params.targetType
    })
    .populate('userId', 'displayName photoURL')
    .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;