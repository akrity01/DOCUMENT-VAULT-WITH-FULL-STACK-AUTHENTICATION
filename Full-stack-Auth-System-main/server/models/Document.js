const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['identity', 'finance', 'medical', 'legal', 'personal', 'other'],
    default: 'other'
  },
  // Encrypted content stored directly in Mongo (good for text/small files)
  encryptedContent: { type: String },   // base64 AES-encrypted
  contentType: { type: String },        // 'text' | 'file'
  mimeType: { type: String },           // e.g. 'application/pdf'
  originalName: { type: String },       // original filename
  size: { type: Number },               // bytes
  // For GridFS / disk storage: store the file ID reference instead
  fileId: { type: String },
  tags: [String],
  isFavorite: { type: Boolean, default: false },
  lastAccessedAt: { type: Date },
}, { timestamps: true });

// Never return encryptedContent in listings
documentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);