const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Video = require('../models/Video');
const Review = require('../models/Review');
const Report = require('../models/Report');
const { authMiddleware, superAdminAuth } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

// ==========================================
// REGISTRO Y LOGIN
// ==========================================

// Registro de Usuario
router.post('/register/user', async (req, res) => {
  try {
    const { email, password, displayName, googleId, photoURL } = req.body;

    // ✅ FIX GOOGLE LOGIN: Si viene googleId, buscar por googleId o email y hacer upsert
    if (googleId) {
      let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

      if (user) {
        // Usuario ya existe con Google o mismo email → actualizar y hacer login
        if (!user.googleId) user.googleId = googleId;
        if (photoURL && !user.photoURL) user.photoURL = photoURL;
        await user.save();

        if (user.isBlocked) {
          return res.status(403).json({ message: 'Cuenta bloqueada. Contacta soporte.' });
        }

        const token = jwt.sign(
          { userId: user._id, type: 'user' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            favorites: user.favorites || []
          }
        });
      }

      // No existe → crear nuevo usuario con Google
      const newUser = new User({
        email: email.toLowerCase(),
        displayName,
        googleId,
        photoURL
      });

      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id, type: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          displayName: newUser.displayName,
          photoURL: newUser.photoURL,
          favorites: []
        }
      });
    }

    // Registro normal (sin Google)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName,
      photoURL
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        email, 
        displayName, 
        photoURL,
        favorites: []
      } 
    });
  } catch (error) {
    console.error('Error registro usuario:', error);
    res.status(500).json({ message: error.message });
  }
});

// Registro de Empresa (NIT seguro con optional chaining)
router.post('/register/company', async (req, res) => {
  try {
    const {
      email, password, companyName, nit, legalRep,
      phone, address
    } = req.body;

    if (!email || !password || !companyName || !legalRep || !phone || !address) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const existingCompany = await Company.findOne({ email: email.toLowerCase() });
    if (existingCompany) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    let finalNit = nit;
    // ✅ USANDO OPTIONAL CHAINING Y NULLISH COALESCING
    if (nit?.trim()) {
      const existingNit = await Company.findOne({ nit: nit.trim() });
      if (existingNit) {
        return res.status(400).json({ message: 'El NIT ya está registrado' });
      }
    } else {
      finalNit = `PENDING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = new Company({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      companyName: companyName.trim(),
      nit: finalNit,
      legalRep: legalRep.trim(),
      phone: phone.trim(),
      address: address.trim(),
      credentials: {
        chamberCommerce: null,
        rut: null,
        bankAccount: null
      },
      verificationLevel: 'basic',
      verified: false,
      isBlocked: false
    });

    await company.save();

    const token = jwt.sign(
      { userId: company._id, type: 'company' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token, 
      company: { 
        id: company._id, 
        email: company.email, 
        companyName: company.companyName,
        verificationLevel: 'basic',
        verified: company.verified,
        message: '¡Tienda registrada! Puedes empezar a publicar inmediatamente.'
      } 
    });
  } catch (error) {
    console.error('Error registro empresa:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login Usuario (con verificación de bloqueo) ✅
router.post('/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // ✅ VERIFICAR SI ESTÁ BLOQUEADO
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Cuenta bloqueada. Contacta soporte.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user._id, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        displayName: user.displayName,
        photoURL: user.photoURL,
        favorites: user.favorites || []
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login Empresa (con verificación de bloqueo y tipo) ✅
router.post('/login/company', async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email: email.toLowerCase() });
    if (!company) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // ✅ VERIFICAR SI ESTÁ BLOQUEADO
    if (company.isBlocked) {
      return res.status(403).json({ message: 'Cuenta bloqueada. Contacta soporte.' });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const userType = company.type === 'superadmin' ? 'superadmin' : 'company';

    const token = jwt.sign(
      { userId: company._id, type: userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      userType: userType,
      company: { 
        id: company._id, 
        email: company.email, 
        companyName: company.companyName,
        type: userType,
        verificationLevel: company.verificationLevel,
        verified: company.verified
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verificar token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    let user;
    if (req.user.type === 'company' || req.user.type === 'superadmin') {
      user = await Company.findById(req.user.userId).select('-password');
    } else {
      user = await User.findById(req.user.userId).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ user, type: req.user.type });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// FAVORITOS
// ==========================================

router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('favorites');
    res.json(user.favorites || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/favorites/batch', authMiddleware, async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Se requiere array de IDs' });
    }

    const limitedIds = productIds.slice(0, 100);
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const currentFavorites = new Set(user.favorites.map(id => id.toString()));
    limitedIds.forEach(id => currentFavorites.add(id));
    
    user.favorites = Array.from(currentFavorites);
    await user.save();

    res.json({ 
      favorites: user.favorites,
      count: user.favorites.length 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/favorites', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/favorites/:productId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.favorites = user.favorites.filter(id => id.toString() !== req.params.productId);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// PERFIL
// ==========================================

router.put('/user/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'user') {
      return res.status(403).json({ message: 'Solo para usuarios' });
    }
    
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/company/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.type !== 'company' && req.user.type !== 'superadmin') {
      return res.status(403).json({ message: 'Solo para empresas' });
    }
    
    const updates = req.body;
    const company = await Company.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    ).select('-password');
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, password } = req.body;
    
    const Model = req.user.type === 'company' || req.user.type === 'superadmin' ? Company : User;
    const user = await Model.findById(req.user.userId);
    
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }
    }
    
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();
    
    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const Model = req.user.type === 'company' || req.user.type === 'superadmin' ? Company : User;
    await Model.findByIdAndDelete(req.user.userId);
    res.json({ message: 'Cuenta eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// SUBIDA DE FOTOS DE PERFIL Y PORTADA
// ==========================================

// Subir foto de perfil (usuario o empresa)
router.post('/upload/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }
    const photoURL = req.file.path;
    const isCompany = req.user.type === 'company' || req.user.type === 'superadmin';
    const Model = isCompany ? Company : User;
    const updated = await Model.findByIdAndUpdate(
      req.user.userId,
      { $set: { photoURL } },
      { new: true }
    ).select('-password');
    res.json({ photoURL, user: updated });
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    res.status(500).json({ message: error.message });
  }
});

// Subir foto de portada (solo empresas)
router.post('/upload/cover', authMiddleware, upload.single('cover'), async (req, res) => {
  try {
    if (req.user.type !== 'company' && req.user.type !== 'superadmin') {
      return res.status(403).json({ message: 'Solo para empresas' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }
    const coverURL = req.file.path;
    const updated = await Company.findByIdAndUpdate(
      req.user.userId,
      { $set: { coverURL } },
      { new: true }
    ).select('-password');
    res.json({ coverURL, company: updated });
  } catch (error) {
    console.error('Error subiendo foto de portada:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// RUTAS DE SUPERADMIN
// ==========================================

router.get('/users', superAdminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const companies = await Company.find().select('-password');
    
    const allUsers = [
      ...users.map(u => ({ ...u.toObject(), type: 'user' })),
      ...companies.map(c => ({ ...c.toObject(), type: c.type === 'superadmin' ? 'superadmin' : 'company' }))
    ];
    
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users/count', superAdminAuth, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/companies/count', superAdminAuth, async (req, res) => {
  try {
    const count = await Company.countDocuments();
    res.json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/recent', superAdminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('displayName createdAt');
      
    const companies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('companyName createdAt');
    
    const all = [
      ...users.map(u => ({ ...u.toObject(), type: 'user' })),
      ...companies.map(c => ({ ...c.toObject(), displayName: c.companyName, type: c.type === 'superadmin' ? 'superadmin' : 'company' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    
    res.json(all);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id/block', superAdminAuth, async (req, res) => {
  try {
    const { blocked } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: blocked }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/companies/:id/block', superAdminAuth, async (req, res) => {
  try {
    const { blocked } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isBlocked: blocked },
      { new: true }
    );
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', superAdminAuth, async (req, res) => {
  try {
    await Review.deleteMany({ userId: req.params.id });
    await Report.deleteMany({ reporterId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/companies/:id', superAdminAuth, async (req, res) => {
  try {
    const store = await Store.findOne({ companyId: req.params.id });
    if (store) {
      await Product.deleteMany({ storeId: store._id });
      await Video.deleteMany({ storeId: store._id });
      await Review.deleteMany({ targetId: store._id });
      await Store.findByIdAndDelete(store._id);
    }
    
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Empresa y todos sus datos eliminados permanentemente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;