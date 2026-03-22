const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const { authMiddleware, companyAuth, superAdminAuth } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

router.get('/', async (req, res) => {
  try {
    const {
      category,
      targetAudience,
      minPrice,
      maxPrice,
      search,
      lat,
      lng,
      radius = 5000,
      page = 1,
      limit = 20
    } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (targetAudience) query.targetAudience = targetAudience;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Busqueda por regex: funciona sin indice $text, busca en nombre, descripcion y tienda
    if (search) {
      try {
        const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const matchingStores = await Store.find({ name: searchRegex }).select('_id').lean();
        const matchingStoreIds = matchingStores.map(s => s._id);
        const orClauses = [
          { name: searchRegex },
          { description: searchRegex }
        ];
        if (matchingStoreIds.length > 0) {
          orClauses.push({ storeId: { $in: matchingStoreIds } });
        }
        query.$or = orClauses;
      } catch(searchErr) {
        console.error('Error en busqueda regex:', searchErr.message);
        // Continuar sin filtro de busqueda antes que romper todo
      }
    }

    // Geolocalización desactivada: se muestran TODOS los productos sin importar distancia

    const [products, count] = await Promise.all([
      Product.find(query)
        .populate('storeId', 'name location.coordinates location.address images phone')
        .sort({ createdAt: -1 })
        .limit(Math.min(parseInt(limit) || 20, 50))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),
      
      Product.countDocuments(query)
    ]);

    const formattedProducts = products.map(p => ({
      ...p,
      storeLat: p.storeId?.location?.coordinates?.[1],
      storeLng: p.storeId?.location?.coordinates?.[0]
    }));

    res.json({
      products: formattedProducts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/batch', async (req, res) => {
  try {
    const ids = req.query.ids?.split(',');
    
    if (!ids || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere array de IDs' });
    }

    const limitedIds = ids.slice(0, 100);
    
    const products = await Product.find({
      _id: { $in: limitedIds },
      isActive: true
    })
    .populate('storeId', 'name location.coordinates location.address phone')
    .lean();

    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const orderedProducts = limitedIds
      .map(id => productMap.get(id))
      .filter(Boolean);

    res.json({ products: orderedProducts });
  } catch (error) {
    console.error('Error batch products:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// RUTAS DE SUPERADMIN
// ==========================================

router.get('/admin/count', superAdminAuth, async (req, res) => {
  try {
    const count = await Product.countDocuments({ isActive: true });
    res.json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/admin/flagged', superAdminAuth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('storeId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/admin/:id/approve', superAdminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { reports: [] } },
      { new: true }
    );
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/admin/:id', superAdminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// RUTAS DE EMPRESA
// ==========================================

// ✅ Obtener mis productos (empresa autenticada)
// IMPORTANTE: debe ir ANTES de /:id para que Express no lo confunda con un ID
router.get('/my-products', companyAuth, async (req, res) => {
  try {
    const store = await Store.findOne({ companyId: req.user.userId });
    if (!store) {
      return res.json({ products: [], total: 0 });
    }

    const products = await Product.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ products, total: products.length });
  } catch (error) {
    console.error('Error obteniendo mis productos:', error);
    res.status(500).json({ message: error.message });
  }
});

// Multer condicional: solo aplica si el request trae archivos (multipart)
const conditionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.array('images', 5)(req, res, next);
  } else {
    req.files = [];
    next();
  }
};

// Ruta de producto individual — va DESPUÉS de /my-products, /batch y /admin/*
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('storeId', 'name location.coordinates location.address phone schedule images')
      .populate('companyId', 'companyName verificationLevel');
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    const similar = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
      price: { 
        $gte: product.price * 0.7, 
        $lte: product.price * 1.3 
      }
    })
    .limit(8)
    .populate('storeId', 'name location.coordinates')
    .lean();

    res.json({ 
      product: {
        ...product.toObject(),
        storeLat: product.storeId?.location?.coordinates?.[1],
        storeLng: product.storeId?.location?.coordinates?.[0]
      }, 
      similar 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', companyAuth, conditionalUpload, async (req, res) => {
  try {
    let productData;

    // Si viene como FormData con campo 'data'
    if (req.body && typeof req.body.data === 'string') {
      productData = JSON.parse(req.body.data);
    // Si viene como JSON puro
    } else if (req.body && typeof req.body === 'object') {
      productData = req.body;
    } else {
      return res.status(400).json({ message: 'Datos del producto no válidos' });
    }

    const images = req.files?.map(file => file.path) || [];

    const store = await Store.findOne({ companyId: req.user.userId });
    if (!store) {
      return res.status(404).json({ message: 'No tienes una tienda registrada. Primero registra tu tienda en el mapa.' });
    }

    if (!productData.targetAudience) productData.targetAudience = 'adultos';

    const finalImages = images.length > 0
      ? images
      : (productData.images?.filter(Boolean).length > 0
          ? productData.images
          : ['https://via.placeholder.com/400x400?text=Sin+Imagen']);

    const product = new Product({
      ...productData,
      storeId: store._id,
      companyId: req.user.userId,
      images: finalImages
    });

    await product.save();

    await Store.findByIdAndUpdate(store._id, {
      $inc: { 'stats.totalProducts': 1 }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', companyAuth, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      companyId: req.user.userId
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const updates = JSON.parse(req.body.data);
    
    if (req.files?.length > 0) {
      const newImages = req.files.map(file => file.path);
      if (updates.keepExistingImages) {
        updates.images = [...product.images, ...newImages].slice(0, 5);
      } else {
        updates.images = newImages;
      }
    }

    Object.assign(product, updates);
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', companyAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      companyId: req.user.userId
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    product.isActive = false;
    await product.save();

    await Store.findByIdAndUpdate(product.storeId, {
      $inc: { 'stats.totalProducts': -1 }
    });

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;