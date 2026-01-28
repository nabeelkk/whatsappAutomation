const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.userId })
      .populate('message.templateId')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    let contacts = [];

    if (req.body.filters) {
      const query = { userId: req.userId, optIn: true };
      
      if (req.body.filters.tags && req.body.filters.tags.length > 0) {
        query.tags = { $in: req.body.filters.tags };
      }

      contacts = await Contact.find(query);
    }

    const campaign = new Campaign({
      ...req.body,
      userId: req.userId,
      targetContacts: contacts.map(c => ({ contactId: c._id })),
      stats: { total: contacts.length }
    });

    await campaign.save();

    if (campaign.type === 'immediate' && campaign.status !== 'draft') {
      // Start campaign immediately
      require('../services/schedulerService').executeCampaign(campaign._id);
    }

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};