import express from 'express';
import { upload } from '../utils/imageUpload.js';

const router = express.Router();

// Upload image endpoint
router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const filename = req.file.filename;
  res.json({ url: `/uploads/${filename}` });
});

export default router;