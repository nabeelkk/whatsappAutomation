const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Chatbot = require('../models/Chatbot');
const WhatsAppNumber = require('../models/WhatsappNumber');

async function processIncomingMessage(data, userId, whatsappNumberId) {
  const message = data.messages[0];
  const from = message.from;

  // Find or create contact
  let contact = await Contact.findOne({ userId, phoneNumber: from });
  if (!contact) {
    contact = new Contact({
      userId,
      phoneNumber: from,
      name: data.contacts[0]?.profile?.name || from,
      source: 'chat',
      optIn: true
    });
    await contact.save();
  }

  // Save incoming message
  const incomingMessage = new Message({
    userId,
    whatsappNumberId,
    contactId: contact._id,
    direction: 'inbound',
    type: message.type,
    content: {
      text: message.text?.body || '',
      mediaUrl: message.image?.link || message.video?.link || message.audio?.link || message.document?.link,
      caption: message.image?.caption || message.video?.caption
    },
    whatsappMessageId: message.id,
    status: 'delivered'
  });
  await incomingMessage.save();

  // Emit socket event
  global.io.to(`user_${userId}`).emit('new_message', incomingMessage);

  // Check for chatbot triggers
  const chatbots = await Chatbot.find({ userId, isActive: true });
  
  for (const chatbot of chatbots) {
    if (message.type === 'text') {
      const messageText = message.text.body.toLowerCase();
      const triggered = chatbot.triggerKeywords.some(keyword => 
        messageText.includes(keyword.toLowerCase())
      );

      if (triggered) {
        await processChatbotFlow(chatbot, contact, whatsappNumberId, userId);
        break;
      }
    }
  }
}

async function processChatbotFlow(chatbot, contact, whatsappNumberId, userId) {
  const startFlow = chatbot.flows.find(f => f.type === 'start');
  if (!startFlow) return;

  let currentFlow = startFlow;
  const variables = {};

  while (currentFlow) {
    switch (currentFlow.type) {
      case 'message':
        const whatsappService = require('./whatsappService');
        await whatsappService.sendMessage(
          whatsappNumberId,
          contact.phoneNumber,
          currentFlow.data.messageType || 'text',
          { text: currentFlow.data.message, ...currentFlow.data }
        );
        break;

      case 'action':
        if (currentFlow.data.action.type === 'addTag') {
          contact.tags.push(...currentFlow.data.action.params.tags);
          await contact.save();
        } else if (currentFlow.data.action.type === 'updateField') {
          contact.customFields = {
            ...contact.customFields,
            ...currentFlow.data.action.params
          };
          await contact.save();
        }
        break;
    }

    currentFlow = chatbot.flows.find(f => f.id === currentFlow.nextFlowId);
  }

  chatbot.stats.totalTriggers += 1;
  chatbot.stats.completedFlows += 1;
  await chatbot.save();
}

module.exports = async (req, res) => {
  try {
    const data = req.body;

    if (data.entry && data.entry[0].changes) {
      const change = data.entry[0].changes[0];
      const value = change.value;

      if (value.messages) {
        const phoneNumberId = value.metadata.phone_number_id;
        const number = await WhatsAppNumber.findOne({ phoneNumberId });

        if (number) {
          await processIncomingMessage(value, number.userId, number._id);
        }
      }

      if (value.statuses) {
        const status = value.statuses[0];
        const message = await Message.findOne({ whatsappMessageId: status.id });

        if (message) {
          message.status = status.status;
          if (status.status === 'delivered') message.deliveredAt = new Date(status.timestamp * 1000);
          if (status.status === 'read') message.readAt = new Date(status.timestamp * 1000);
          await message.save();

          global.io.to(`user_${message.userId}`).emit('message_status_update', message);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
};
