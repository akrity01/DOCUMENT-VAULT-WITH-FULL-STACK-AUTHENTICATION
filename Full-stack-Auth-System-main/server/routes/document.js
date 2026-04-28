const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const Document = require('../models/Document');
const { encrypt, decrypt } = require('../utils/encryption');
const { verifyToken } = require('../middleware/auth'); // your existing middleware

// multer: store in memory for small files, then encrypt
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png',
                     'text/plain', 'application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// POST /api/documents/text  — save a text note
router.post('/text', verifyToken, async (req, res) => {
  try {
    const { title, content, description, category, tags } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

    const encrypted = encrypt(content, req.user.id);
    const doc = await Document.create({
      userId: req.user.id,
      title,
      description,
      category,
      tags: tags || [],
      contentType: 'text',
      encryptedContent: encrypted,
      size: Buffer.byteLength(content, 'utf8'),
    });

    res.status(201).json({ message: 'Document saved', document: _safeDoc(doc) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/documents/file  — upload an encrypted file
router.post('/file', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { title, description, category, tags } = req.body;

    // Convert buffer to base64 and encrypt
    const base64 = req.file.buffer.toString('base64');
    const encrypted = encrypt(base64, req.user.id);

    const doc = await Document.create({
      userId: req.user.id,
      title: title || req.file.originalname,
      description,
      category,
      tags: tags ? JSON.parse(tags) : [],
      contentType: 'file',
      encryptedContent: encrypted,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    res.status(201).json({ message: 'File saved', document: _safeDoc(doc) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/documents  — list (no content, just metadata)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user.id };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const docs = await Document.find(query)
      .select('-encryptedContent')   // never send encrypted blob in list
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Document.countDocuments(query);
    res.json({ documents: docs, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/documents/:id  — decrypt and return content
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ message: 'Not found' });

    await Document.findByIdAndUpdate(doc._id, { lastAccessedAt: new Date() });
    const content = decrypt(doc.encryptedContent, req.user.id);

    if (doc.contentType === 'file') {
      const buffer = Buffer.from(content, 'base64');
      res.set('Content-Type', doc.mimeType);
      res.set('Content-Disposition', `inline; filename="${doc.originalName}"`);
      return res.send(buffer);
    }

    res.json({ document: _safeDoc(doc), content });
  } catch (err) {
    res.status(500).json({ message: 'Decryption failed' });
  }
});

// PATCH /api/documents/:id  — update metadata or content
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const { title, description, category, tags, isFavorite, content } = req.body;
    if (title)       doc.title = title;
    if (description !== undefined) doc.description = description;
    if (category)    doc.category = category;
    if (tags)        doc.tags = tags;
    if (isFavorite !== undefined) doc.isFavorite = isFavorite;
    if (content)     doc.encryptedContent = encrypt(content, req.user.id);

    await doc.save();
    res.json({ message: 'Updated', document: _safeDoc(doc) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Strip sensitive fields before sending
function _safeDoc(doc) {
  const o = doc.toObject();
  delete o.encryptedContent;
  return o;
}

module.exports = router;