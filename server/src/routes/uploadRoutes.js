import express from 'express';
import { optionalProtect } from '../middleware/authMiddleware.js';
import { upload, useCloudinary } from '../utils/imageUpload.js';

const router = express.Router();

const handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  if (useCloudinary) {
    res.json({ url: req.file.path });
  } else {
    const filename = req.file.filename;
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${proto}://${host}`;
    res.json({ url: `${baseUrl}/uploads/${filename}` });
  }
};

const handleUploadError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Max 5MB allowed.' });
  }
  res.status(400).json({ message: err.message });
};

router.post('/image', optionalProtect, upload.single('image'), handleUpload, handleUploadError);

export default router;
