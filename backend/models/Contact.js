const mongoose = require("mongoose");


const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phoneNumber: { type: String, required: true },
  name: String,
  email: String,
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  optIn: { type: Boolean, default: true },
  optInDate: Date,
  optOutDate: Date,
  lastMessageDate: Date,
  source: { type: String, enum: ['manual', 'import', 'form', 'chat'], default: 'manual' },
  status: { type: String, enum: ['active', 'blocked', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

contactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
module.exports = mongoose.model('Contact', contactSchema);