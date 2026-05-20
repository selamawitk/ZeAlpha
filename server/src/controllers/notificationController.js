import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
};

export const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });

  if (notification.recipient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  notification.isRead = true;
  await notification.save();
  res.json(notification);
};

export const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ message: 'All notifications marked as read' });
};

export const deleteNotification = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });

  if (notification.recipient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await notification.remove();
  res.json({ message: 'Notification deleted' });
};