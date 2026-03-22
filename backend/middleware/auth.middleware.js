const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

// Middleware base de autenticación
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No hay token, autorización denegada' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token no válido' });
    }
    res.status(401).json({ message: 'Error de autenticación' });
  }
};

// Cualquier empresa puede operar (con manejo de errores) ✅
const companyAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No hay token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'company' && decoded.type !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso solo para tiendas' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};

// Solo empresas verificadas
const verifiedCompanyAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No hay token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'company' && decoded.type !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso solo para tiendas' });
    }
    
    const company = await Company.findById(decoded.userId);
    if (!company || company.verificationLevel === 'basic') {
      return res.status(403).json({ 
        message: 'Esta función requiere verificación de documentos',
        upgradeUrl: '/profile/verify'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};

// SUPER ADMIN - Solo superadmin
const superAdminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No hay token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'superadmin') {
      return res.status(403).json({ message: 'Acceso solo para super administradores' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};

module.exports = { 
  authMiddleware, 
  companyAuth, 
  verifiedCompanyAuth,
  superAdminAuth 
};