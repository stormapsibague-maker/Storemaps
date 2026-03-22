const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, index: true },
  
  category: {
    type: String,
    enum: ['calzado', 'ropa', 'comida', 'tecnologia', 'hogar', 'belleza', 'deporte'],
    required: true,
    index: true
  },
  
  targetAudience: {
    type: String,
    enum: ['bebe', 'ninos', 'adolescentes', 'adultos'],
    default: 'adultos',
    required: true,
    index: true
  },
  
  images: [{ type: String }],
  sizes: [{ type: String }],
  colors: [{ type: String }],
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: -1 },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, targetAudience: 1, isActive: 1 });
productSchema.index({ storeId: 1, isActive: 1, createdAt: -1 });
productSchema.index({ price: 1, isActive: 1 });

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
