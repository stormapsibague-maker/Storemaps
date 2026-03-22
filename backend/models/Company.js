const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  nit: { type: String, sparse: true, unique: true },
  legalRep: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },

  photoURL: { type: String, default: '' },   // foto de perfil de la empresa
  coverURL: { type: String, default: '' },    // foto de portada del perfil

  type: { 
    type: String, 
    enum: ['company', 'superadmin'], 
    default: 'company' 
  },
  
  credentials: {
    chamberCommerce: { type: String, default: null },
    rut: { type: String, default: null },
    bankAccount: { type: String, default: null }
  },
  
  verificationLevel: { 
    type: String, 
    enum: ['basic', 'verified', 'premium'], 
    default: 'basic' 
  },
  
  storeVerified: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }, // ✅ AGREGADO
  
  stats: {
    totalProducts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalFavorites: { type: Number, default: 0 }
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);