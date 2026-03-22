const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: { type: String, sparse: true, index: true }, // ✅ índice para login con Google
  displayName: { type: String, required: true },
  photoURL: { type: String, default: '' },
  phone: { type: String },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  location: {
    lat: { type: Number, default: 4.4447 },
    lng: { type: Number, default: -75.2424 }
  },
  isCompany: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);