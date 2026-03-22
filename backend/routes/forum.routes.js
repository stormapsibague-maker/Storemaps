const express = require('express');
const router = express.Router();
const ForumPost = require('../models/ForumPost');
const { authMiddleware } = require('../middleware/auth.middleware');

// GET all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await ForumPost.find({ isActive: { $ne: false } })
      .populate('authorId', 'displayName companyName photoURL type')
      .populate('comments.userId', 'displayName companyName')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create post
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { title, content, category, type, price, originalPrice } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Título y contenido son obligatorios' });
    }
    const post = new ForumPost({
      authorId: req.user.userId,
      title,
      content,
      category: category || 'general',
      type: type || 'general',
      price: price ? Number(price) : undefined,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
    });
    await post.save();
    await post.populate('authorId', 'displayName companyName photoURL type');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST like/unlike
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post no encontrado' });
    const userId = req.user.userId;
    const idx = post.likes.findIndex(id => id.toString() === userId.toString());
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: idx < 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add comment
router.post('/posts/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comentario vacío' });
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post no encontrado' });
    post.comments.push({ userId: req.user.userId, text, createdAt: new Date() });
    await post.save();
    await post.populate('comments.userId', 'displayName companyName');
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE post (owner or superadmin)
router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post no encontrado' });
    const userId = req.user.userId.toString();
    const authorId = post.authorId.toString();
    const userType = req.user.type || req.user.userType;
    if (userId !== authorId && userType !== 'superadmin') {
      return res.status(403).json({ message: 'Sin permiso' });
    }
    await post.deleteOne();
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE post (admin route)
router.delete('/posts/admin/:id', authMiddleware, async (req, res) => {
  try {
    await ForumPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado por admin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
