import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../utils/imageUpload.js';

const router = express.Router();

// Upload image endpoint (authenticated)
router.post('/image', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max 5MB allowed.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const filename = req.file.filename;
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${proto}://${host}`;
    res.json({ url: `${baseUrl}/uploads/${filename}` });
  });
});

export default router;