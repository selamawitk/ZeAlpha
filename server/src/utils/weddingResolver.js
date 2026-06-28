import mongoose from 'mongoose';
import Wedding from '../models/Wedding.js';

export const resolveWedding = async (weddingId) => {
  if (!weddingId) return null;
  if (mongoose.Types.ObjectId.isValid(weddingId)) {
    const wedding = await Wedding.findById(weddingId);
    if (wedding) return wedding;
  }
  return Wedding.findOne({
    $or: [{ slug: weddingId }, { weddingCode: weddingId }]
  });
};
