const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, requireStaffOrOwner } = require('../middleware/auth');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/rooms');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `room-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/upload - Upload multiple images (staff/owner only)
router.post('/', authenticate, requireStaffOrOwner, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Generate URLs for the uploaded files
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = req.files.map(file => 
      `${baseUrl}/uploads/rooms/${file.filename}`
    );

    res.json({ 
      message: `${req.files.length} file(s) uploaded successfully`,
      urls 
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /api/upload/:filename - Delete an uploaded image
router.delete('/:filename', authenticate, requireStaffOrOwner, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;