const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const Product = require('../models/Product');
const Video = require('../models/Video');
const Review = require('../models/Review');
const Company = require('../models/Company');
const { authMiddleware, companyAuth, superAdminAuth } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    
    let query = { isActive: true };
    
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    const stores = await Store.find(query)
      .populate('companyId', 'companyName verificationLevel')
      .select('-__v')
      .limit(50);

    const formattedStores = stores.map(store => ({
      ...store.toObject(),
      lat: store.location.coordinates[1],
      lng: store.location.coordinates[0]
    }));

    res.json(formattedStores);
  } catch (error) {
    console.error('Error obteniendo tiendas:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// RUTAS DE EMPRESA
// ==========================================

router.get('/my/store', companyAuth, async (req, res) => {
  try {
    const store = await Store.findOne({ companyId: req.user.userId })
      .populate('companyId', 'companyName verificationLevel');
    
    if (!store) {
      return res.status(404).json({ message: 'No tienes una tienda registrada' });
    }

    const productsCount = await Product.countDocuments({ storeId: store._id, isActive: true });
    const videosCount = await Video.countDocuments({ storeId: store._id });

    res.json({
      ...store.toObject(),
      lat: store.location.coordinates[1],
      lng: store.location.coordinates[0],
      productsCount,
      videosCount
    });
  } catch (error) {
    console.error('Error obteniendo mi tienda:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('companyId', 'companyName phone verificationLevel');

    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    await Store.findByIdAndUpdate(req.params.id, { $inc: { 'stats.totalViews': 1 } });

    const products = await Product.find({ storeId: store._id, isActive: true })
      .sort({ createdAt: -1 }).limit(20);
    const videos = await Video.find({ storeId: store._id })
      .sort({ createdAt: -1 }).limit(10);
    const reviews = await Review.find({ targetId: store._id, targetType: 'store' })
      .populate('userId', 'displayName photoURL')
      .sort({ createdAt: -1 }).limit(20);

    res.json({
      store: { ...store.toObject(), lat: store.location.coordinates[1], lng: store.location.coordinates[0] },
      products, videos, reviews
    });
  } catch (error) {
    console.error('Error obteniendo tienda:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', companyAuth, upload.array('images', 5), async (req, res) => {
  try {
    const storeData = JSON.parse(req.body.data);
    const images = req.files?.map(file => file.path) || [];

    const existingStore = await Store.findOne({ companyId: req.user.userId });
    if (existingStore) {
      return res.status(400).json({ message: 'Ya tienes una tienda registrada' });
    }

    if (!storeData.location?.coordinates || storeData.location.coordinates.length !== 2) {
      return res.status(400).json({ 
        message: 'Coordenadas inválidas. Se requiere [longitude, latitude]' 
      });
    }

    const store = new Store({
      ...storeData,
      companyId: req.user.userId,
      images: images.length > 0 ? images : ['https://via.placeholder.com/400x300?text=Sin+Imagen']
    });

    await store.save();
    
    await Company.findByIdAndUpdate(req.user.userId, {
      $set: { 'stats.storeCreated': true }
    });

    res.status(201).json(store);
  } catch (error) {
    console.error('Error creando tienda:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', companyAuth, upload.array('images', 5), async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: req.params.id,
      companyId: req.user.userId
    });

    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    // Accept both JSON body and FormData with 'data' field
    let updates;
    if (req.body.data) {
      updates = JSON.parse(req.body.data);
    } else {
      updates = req.body;
    }

    if (req.files?.length > 0) {
      const newImages = req.files.map(file => file.path);
      updates.images = updates.keepExistingImages
        ? [...(store.images || []), ...newImages].slice(0, 5)
        : newImages;
    }

    if (updates.location?.coordinates) {
      store.location.coordinates = updates.location.coordinates;
    }
    if (updates.location?.address) {
      store.location.address = updates.location.address;
    }

    ['name', 'description', 'category', 'phone', 'schedule', 'images'].forEach(field => {
      if (updates[field] !== undefined) store[field] = updates[field];
    });

    await store.save();

    res.json({
      ...store.toObject(),
      lat: store.location.coordinates[1],
      lng: store.location.coordinates[0]
    });
  } catch (error) {
    console.error('Error actualizando tienda:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// RUTAS DE SUPERADMIN (prefijo /admin)
// ==========================================

// Todas las tiendas
router.get('/admin/all', superAdminAuth, async (req, res) => {
  try {
    const stores = await Store.find()
      .populate('companyId', 'companyName email')
      .lean();
    
    for (let store of stores) {
      store.productsCount = await Product.countDocuments({ storeId: store._id });
    }
    
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Conteo de tiendas
router.get('/admin/count', superAdminAuth, async (req, res) => {
  try {
    const count = await Store.countDocuments();
    res.json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tiendas recientes
router.get('/admin/recent', superAdminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const stores = await Store.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name createdAt');
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tiendas pendientes
router.get('/admin/pending', superAdminAuth, async (req, res) => {
  try {
    const stores = await Store.find({ isActive: false })
      .populate('companyId', 'companyName');
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aprobar tienda
router.put('/admin/:id/approve', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rechazar/eliminar tienda
router.delete('/admin/:id/reject', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Tienda no encontrada' });
    
    await Product.deleteMany({ storeId: store._id });
    await Video.deleteMany({ storeId: store._id });
    await Store.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Tienda rechazada y eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Activar tienda desactivada
router.put('/admin/:id/activate', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
