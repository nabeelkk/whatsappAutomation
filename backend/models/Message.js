const mongoose = require("mongoose");



const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  whatsappNumberId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppNumber', required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  type: { type: String, enum: ['text', 'image', 'video', 'audio', 'document', 'button', 'list', 'interactive', 'template', 'carousel'], required: true },
  content: {
    text: String,
    mediaUrl: String,
    mediaId: String,
    caption: String,
    buttons: Array,
    listItems: Array,
    templateName: String,
    templateParams: Array,
    carouselCards: Array
  },
  status: { type: String, enum: ['sent', 'delivered', 'read', 'failed', 'pending'], default: 'pending' },
  whatsappMessageId: String,
  error: String,
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  chatbotFlowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot' },
  createdAt: { type: Date, default: Date.now },
  deliveredAt: Date,
  readAt: Date
});

messageSchema.index({ userId: 1, contactId: 1, createdAt: -1 });
module.exports = mongoose.model('Message', messageSchema);