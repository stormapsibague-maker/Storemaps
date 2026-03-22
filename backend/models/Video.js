const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  url: { type: String, required: true },
  thumbnail: { type: String },
  caption: { type: String },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now },
    replies: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);