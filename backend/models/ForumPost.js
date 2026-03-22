const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const forumPostSchema = new mongoose.Schema({
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'authorModel'
  },
  authorModel: {
    type: String,
    enum: ['User', 'Company'],
    default: 'User'
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['general', 'pregunta', 'oferta', 'comida', 'tecnologia', 'hogar', 'belleza', 'deporte'],
    default: 'general'
  },
  type: { type: String, default: 'general' },
  price: { type: Number },
  originalPrice: { type: Number },
  images: [{ type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId }],
  comments: [commentSchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Dynamic populate: try User first, fallback to Company
forumPostSchema.pre('find', function() {
  this.populate({ path: 'authorId', select: 'displayName companyName photoURL type' });
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
