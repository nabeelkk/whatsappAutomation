const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const whatsappService = require('./whatsappService');

exports.checkScheduledCampaigns = async () => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      status: 'scheduled',
      'schedule.startDate': { $lte: now }
    });

    for (const campaign of campaigns) {
      await exports.executeCampaign(campaign._id);
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
};

exports.executeCampaign = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId).populate('message.templateId');
    if (!campaign) return;

    campaign.status = 'running';
    await campaign.save();

    for (const target of campaign.targetContacts) {
      if (target.status !== 'pending') continue;

      try {
        const contact = await Contact.findById(target.contactId);
        if (!contact || !contact.optIn) {
          target.status = 'failed';
          target.error = 'Contact not available or opted out';
          continue;
        }

        let messageContent = {};
        
        if (campaign.message.type === 'template') {
          messageContent = {
            templateName: campaign.message.templateId.name,
            language: campaign.message.templateId.language,
            templateParams: campaign.message.content.params
          };
        } else {
          messageContent = campaign.message.content;
        }

        const result = await whatsappService.sendMessage(
          campaign.whatsappNumberId,
          contact.phoneNumber,
          campaign.message.type,
          messageContent
        );

        const message = new Message({
          userId: campaign.userId,
          whatsappNumberId: campaign.whatsappNumberId,
          contactId: contact._id,
          direction: 'outbound',
          type: campaign.message.type,
          content: messageContent,
          whatsappMessageId: result.messages[0].id,
          status: 'sent',
          campaignId: campaign._id
        });
        await message.save();

        target.status = 'sent';
        target.sentAt = new Date();
        campaign.stats.sent += 1;
      } catch (error) {
        target.status = 'failed';
        target.error = error.message;
        campaign.stats.failed += 1;
      }

      await campaign.save();

      // Add delay to avoid rate limits (adjust as needed)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    campaign.status = 'completed';
    await campaign.save();

    global.io.to(`user_${campaign.userId}`).emit('campaign_completed', campaign);
  } catch (error) {
    console.error('Campaign execution error:', error);
    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      campaign.status = 'failed';
      await campaign.save();
    }
  }
};