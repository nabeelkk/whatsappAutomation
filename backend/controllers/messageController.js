const Message = require('../models/Message');
const Contact = require('../models/Contact');
const WhatsAppNumber = require('../models/WhatsAppNumber');
const whatsappService = require('../services/whatsappService');

exports.getMessages = async (req, res) => {
  try {
    const { contactId, page = 1, limit = 50 } = req.query;
    const query = { userId: req.userId };

    if (contactId) {
      query.contactId = contactId;
    }

    const messages = await Message.find(query)
      .populate('contactId', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Message.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { contactId, whatsappNumberId, type, content } = req.body;

    console.log('Send message request:', { contactId, whatsappNumberId, type, userId: req.userId });

    // Validate required fields
    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    if (!whatsappNumberId) {
      return res.status(400).json({ error: 'WhatsApp number ID is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Message type is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Find contact
    const contact = await Contact.findOne({ _id: contactId, userId: req.userId });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check opt-in status
    if (!contact.optIn) {
      return res.status(400).json({ error: 'Contact has opted out of messages' });
    }

    // Find WhatsApp number
    const whatsappNumber = await WhatsAppNumber.findOne({ 
      _id: whatsappNumberId, 
      userId: req.userId 
    });

    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    if (!whatsappNumber.isActive) {
      return res.status(400).json({ error: 'WhatsApp number is not active' });
    }

    // Check daily limit
    if (whatsappNumber.currentDailyCount >= whatsappNumber.dailyLimit) {
      return res.status(429).json({ error: 'Daily message limit reached for this WhatsApp number' });
    }

    // Create message record
    const message = new Message({
      userId: req.userId,
      whatsappNumberId,
      contactId,
      direction: 'outbound',
      type,
      content,
      status: 'pending'
    });

    try {
      // Send via WhatsApp API
      console.log('Sending to WhatsApp API:', { 
        phone: contact.phoneNumber, 
        type, 
        hasContent: !!content 
      });

      const result = await whatsappService.sendMessage(
        whatsappNumber, 
        contact.phoneNumber, 
        type, 
        content
      );

      console.log('WhatsApp API response:', result);

      // Update message with result
      if (result && result.messages && result.messages[0]) {
        message.whatsappMessageId = result.messages[0].id;
        message.status = 'sent';
      } else {
        message.status = 'sent'; // Still mark as sent even if no message ID
      }

      await message.save();

      // Update contact last message date
      contact.lastMessageDate = new Date();
      await contact.save();

      // Emit socket event
      if (global.io) {
        global.io.to(`user_${req.userId}`).emit('message_sent', message);
      }

      // Populate contact info before sending response
      await message.populate('contactId', 'name phoneNumber');

      res.status(201).json(message);
    } catch (whatsappError) {
      console.error('WhatsApp API error:', whatsappError);
      
      // Save message with failed status
      message.status = 'failed';
      message.error = whatsappError.message || 'Failed to send via WhatsApp API';
      await message.save();

      return res.status(500).json({ 
        error: 'Failed to send message via WhatsApp',
        details: whatsappError.message,
        message: message
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      error: 'Internal server error while sending message',
      details: error.message 
    });
  }
};

exports.sendBulkMessages = async (req, res) => {
  try {
    const { contactIds, whatsappNumberId, type, content } = req.body;

    if (!contactIds || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs are required' });
    }

    if (!whatsappNumberId) {
      return res.status(400).json({ error: 'WhatsApp number ID is required' });
    }

    // Find WhatsApp number
    const whatsappNumber = await WhatsAppNumber.findOne({ 
      _id: whatsappNumberId, 
      userId: req.userId 
    });

    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    const contacts = await Contact.find({ 
      _id: { $in: contactIds }, 
      userId: req.userId, 
      optIn: true 
    });

    const results = [];

    for (const contact of contacts) {
      try {
        const message = new Message({
          userId: req.userId,
          whatsappNumberId,
          contactId: contact._id,
          direction: 'outbound',
          type,
          content,
          status: 'pending'
        });

        const result = await whatsappService.sendMessage(
          whatsappNumber, 
          contact.phoneNumber, 
          type, 
          content
        );
        
        if (result && result.messages && result.messages[0]) {
          message.whatsappMessageId = result.messages[0].id;
        }
        message.status = 'sent';
        await message.save();

        results.push({ contactId: contact._id, status: 'sent', messageId: message._id });
      } catch (error) {
        console.error('Bulk send error for contact:', contact._id, error);
        results.push({ contactId: contact._id, status: 'failed', error: error.message });
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.json({ results, total: contacts.length, sent: results.filter(r => r.status === 'sent').length });
  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({ error: error.message });
  }
};