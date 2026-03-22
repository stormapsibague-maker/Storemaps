const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

dotenv.config();

// Verificar JWT_SECRET crítico
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR CRÍTICO: JWT_SECRET no está definido');
  process.exit(1);
}

const app = express();

// Conectar DB
connectDB();

// Helmet configurado para CORS global
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Desactivar CSP para APIs
}));

// CORS configurado correctamente para producción
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://storemaps-wed.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Permitir cualquier subdominio de onrender.com (Render.com deployments)
    const isRender = origin && origin.includes('.onrender.com');
    const isLocalhost = origin && origin.includes('localhost');
    
    if (allowedOrigins.includes(origin) || isRender || isLocalhost || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('⚠️ CORS bloqueado para:', origin);
      callback(null, true); // Temporalmente permitir todo para no bloquear usuarios
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate Limiting específico para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Aumentado para evitar bloqueos
  message: { message: 'Demasiados intentos, por favor intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check mejorado
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.2',
    env: process.env.NODE_ENV || 'development',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rutas
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/stores', require('./routes/stores.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));
app.use('/api/videos', require('./routes/videos.routes'));
app.use('/api/forum', require('./routes/forum.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Storemaps API v2.0.2 🚀',
    status: 'running',
    health: '/health',
    endpoints: {
      auth: '/auth',
      products: '/products',
      stores: '/stores',
      reviews: '/reviews',
      videos: '/videos',
      forum: '/forum',
      reports: '/reports'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Error Handler Global mejorado
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Manejo específico de errores de MongoDB
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Error de validación',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'ID inválido',
      field: err.path
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(isDev && { stack: err.stack }),
    ...(isDev && { details: err.errors })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔒 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ Faltante'}`);
});