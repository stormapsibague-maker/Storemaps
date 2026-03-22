// models/Store.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: { type: String, required: true }
  },
  
  phone: { type: String },
  schedule: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  
  stats: {
    totalProducts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 }
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Índice geoespacial CRÍTICO para búsquedas por ubicación
storeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Store', storeSchema);