const { Notification } = require('../models');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.json({ notifications });
  } catch (error) {
    console.error('Error in getMyNotifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ notification });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
};
