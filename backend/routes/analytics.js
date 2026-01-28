const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');
const { queryValidators } = require('../utils/validators');

router.get('/dashboard', auth, queryValidators.dateRange, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const totalContacts = await Contact.countDocuments({ userId: req.userId, ...dateFilter });
    const activeContacts = await Contact.countDocuments({ userId: req.userId, status: 'active', optIn: true, ...dateFilter });
    
    const messageStats = await Message.aggregate([
      { $match: { userId: req.userId, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalMessages = messageStats.reduce((acc, stat) => acc + stat.count, 0);
    const deliveredMessages = messageStats.find(s => s._id === 'delivered')?.count || 0;
    const readMessages = messageStats.find(s => s._id === 'read')?.count || 0;

    const campaigns = await Campaign.find({ userId: req.userId, ...dateFilter });
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'running').length;

    const messagesByDay = await Message.aggregate([
      { $match: { userId: req.userId, ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: { $cond: [{ $eq: ['$direction', 'outbound'] }, 1, 0] } },
          received: { $sum: { $cond: [{ $eq: ['$direction', 'inbound'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: {
        totalContacts,
        activeContacts,
        totalMessages,
        deliveredMessages,
        readMessages,
        totalCampaigns,
        activeCampaigns
      },
      messagesByDay,
      deliveryRate: totalMessages > 0 ? (deliveredMessages / totalMessages * 100).toFixed(2) : 0,
      readRate: deliveredMessages > 0 ? (readMessages / deliveredMessages * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export', auth, queryValidators.dateRange, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    let data = [];
    
    switch (type) {
      case 'contacts':
        data = await Contact.find({ userId: req.userId, ...dateFilter }).lean();
        break;
      case 'messages':
        data = await Message.find({ userId: req.userId, ...dateFilter })
          .populate('contactId', 'name phoneNumber')
          .lean();
        break;
      case 'campaigns':
        data = await Campaign.find({ userId: req.userId, ...dateFilter }).lean();
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;