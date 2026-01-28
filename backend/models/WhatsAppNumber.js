const mongoose = require("mongoose");



const whatsappNumberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phoneNumber: { type: String, required: true, unique: true },
  displayName: String,
  phoneNumberId: { type: String, required: true },
  businessAccountId: String,
  accessToken: { type: String, required: true },
  webhookUrl: String,
  isActive: { type: Boolean, default: true },
  dailyLimit: { type: Number, default: 1000 },
  currentDailyCount: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
  settings: {
    autoResponder: { type: Boolean, default: false },
    businessHours: {
      enabled: { type: Boolean, default: false },
      schedule: mongoose.Schema.Types.Mixed
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports =
  mongoose.models.WhatsAppNumber ||
  mongoose.model("WhatsAppNumber", whatsappNumberSchema);
