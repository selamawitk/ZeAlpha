import Blessing from '../models/Blessing.js';
import Wedding from '../models/Wedding.js';
import { emitActivity } from '../services/socketService.js';

export const addBlessing = async (req, res) => {
  try {
    const { weddingId, message, guestName, isAnonymous } = req.body;

    if (!weddingId || !message) {
      return res.status(400).json({ message: 'weddingId and message are required' });
    }

    const wedding = await Wedding.findById(weddingId);
    if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

    const requiresApproval = wedding.privacySettings?.requireApproval;
    const blessing = await Blessing.create({
      weddingId,
      guestName: guestName || (req.user ? req.user.name : 'Guest'),
      message,
      isAnonymous: !!isAnonymous,
      status: requiresApproval ? 'pending' : 'approved',
    });

    emitActivity({
      weddingId: String(weddingId),
      title: `${blessing.isAnonymous ? 'Someone' : blessing.guestName} left a blessing`,
      message: blessing.message,
      type: 'blessing',
      timestamp: new Date(),
    });

    res.status(201).json(blessing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlessings = async (req, res) => {
  try {
    const { weddingId } = req.params;
    const filter = { weddingId };
    const wedding = await Wedding.findById(weddingId);
    const isCouple = wedding && req.user && String(wedding.couple) === String(req.user._id);
    if (!isCouple && req.user?.role !== 'admin') {
      filter.status = 'approved';
    }
    const blessings = await Blessing.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(blessings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveBlessing = async (req, res) => {
  try {
    const blessing = await Blessing.findById(req.params.id);
    if (!blessing) return res.status(404).json({ message: 'Blessing not found' });

    const wedding = await Wedding.findById(blessing.weddingId);
    const isCouple = wedding && String(wedding.couple) === String(req.user._id);
    if (!isCouple && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    blessing.status = req.body.status === 'rejected' ? 'rejected' : 'approved';
    await blessing.save();
    res.json(blessing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'emoji is required' });

    const blessing = await Blessing.findById(req.params.id);
    if (!blessing) return res.status(404).json({ message: 'Blessing not found' });

    const key = emoji;
    const current = blessing.reactions.get(key) || [];
    const guestName = req.body.guestName || 'Guest';
    const idx = current.indexOf(guestName);

    if (idx === -1) {
      current.push(guestName);
    } else {
      current.splice(idx, 1);
    }

    if (current.length === 0) {
      blessing.reactions.delete(key);
    } else {
      blessing.reactions.set(key, current);
    }

    await blessing.save();
    res.json(blessing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBlessing = async (req, res) => {
  try {
    const blessing = await Blessing.findById(req.params.id);
    if (!blessing) return res.status(404).json({ message: 'Blessing not found' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Blessing.deleteOne({ _id: blessing._id });
    res.json({ message: 'Blessing deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
