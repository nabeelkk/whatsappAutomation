const mongoose = require("mongoose");


const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['immediate', 'scheduled', 'recurring'], default: 'immediate' },
  status: { type: String, enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed'], default: 'draft' },
  whatsappNumberId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppNumber', required: true },
  targetContacts: [{
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sentAt: Date,
    error: String
  }],
  filters: {
    tags: [String],
    optInOnly: { type: Boolean, default: true },
    customFilters: mongoose.Schema.Types.Mixed
  },
  message: {
    type: { type: String, enum: ['text', 'template', 'button', 'list', 'media'], required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    content: mongoose.Schema.Types.Mixed
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    recurring: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      interval: Number,
      daysOfWeek: [Number],
      time: String
    }
  },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campaign', campaignSchema);