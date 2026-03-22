const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Store = require('../models/Store');
const { authMiddleware, companyAuth, superAdminAuth } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

// Obtener videos para el feed - trae TODOS los videos siempre
router.get('/feed', async (req, res) => {
  try {
    const videos = await Video.find({})
      .populate('storeId', 'name')
      .populate('productId', 'name price')
      .populate('comments.userId', 'displayName photoURL')
      .populate('comments.replies.userId', 'displayName photoURL')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(videos);
  } catch (error) {
    console.error('Error obteniendo videos:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// RUTAS DE EMPRESA
// ==========================================

// Obtener mis videos
router.get('/my-videos', companyAuth, async (req, res) => {
  try {
    const videos = await Video.find({ companyId: req.user.userId })
      .populate('productId', 'name price')
      .sort({ createdAt: -1 });
    
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Subir video
router.post('/', companyAuth, upload.single('video'), async (req, res) => {
  try {
    const { caption, productId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo de video' });
    }

    const store = await Store.findOne({ companyId: req.user.userId });
    if (!store) {
      return res.status(404).json({ message: 'No tienes una tienda registrada' });
    }

    const video = new Video({
      storeId: store._id,
      companyId: req.user.userId,
      url: req.file.path,
      thumbnail: req.file.path.replace(/\.[^/.]+$/, '.jpg'),
      caption,
      productId: productId || null,
      location: {
        lat: store.location.coordinates[1],
        lng: store.location.coordinates[0]
      }
    });

    await video.save();
    
    await video.populate('storeId', 'name');
    if (productId) await video.populate('productId', 'name price');

    res.status(201).json(video);
  } catch (error) {
    console.error('Error subiendo video:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// RUTAS DE SUPERADMIN — DEBEN IR ANTES DE /:id
// ==========================================

router.get('/admin/flagged', superAdminAuth, async (req, res) => {
  try {
    const videos = await Video.find({}).populate('storeId', 'name').limit(20);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/admin/count', superAdminAuth, async (req, res) => {
  try {
    const count = await Video.countDocuments();
    res.json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/admin/:id/approve', superAdminAuth, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { $set: { reports: [] } }, { new: true });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/admin/:id', superAdminAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar video propio (empresa)
router.delete('/:id', companyAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });
    if (video.companyId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este video' });
    }
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dar like a video
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });
    
    video.likes = (video.likes || 0) + 1;
    await video.save();
    
    res.json({ likes: video.likes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Comentar en video
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });
    
    video.comments.push({
      userId: req.user.userId,
      text
    });
    
    await video.save();

    // Popular userId para devolver nombre e imagen
    await video.populate('comments.userId', 'displayName photoURL');
    res.json(video.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Responder a un comentario de video
router.post('/:id/comment/:commentId/reply', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Respuesta vacía' });

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });

    const comment = video.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });

    comment.replies.push({
      userId: req.user.userId,
      text
    });

    await video.save();
    await video.populate('comments.userId', 'displayName photoURL');
    await video.populate('comments.replies.userId', 'displayName photoURL');
    res.json(video.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
module.exports = router;
// Eliminar comentario de video (superadmin)
router.delete('/:videoId/comment/:commentId', superAdminAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });

    const commentIndex = video.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );
    if (commentIndex === -1) return res.status(404).json({ message: 'Comentario no encontrado' });

    video.comments.splice(commentIndex, 1);
    await video.save();

    res.json({ message: 'Comentario eliminado', comments: video.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Editar comentario de video (superadmin)
router.put('/:videoId/comment/:commentId', superAdminAuth, async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: 'Video no encontrado' });

    const comment = video.comments.find(
      c => c._id.toString() === req.params.commentId
    );
    if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });

    comment.text = text;
    await video.save();

    res.json({ message: 'Comentario actualizado', comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});