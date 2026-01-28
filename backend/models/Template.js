const mongoose = require("mongoose");



const templateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], required: true },
  language: { type: String, default: 'en' },
  status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'PENDING' },
  components: [{
    type: { type: String, enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'] },
    format: String,
    text: String,
    example: Array,
    buttons: [{
      type: { type: String, enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'] },
      text: String,
      url: String,
      phoneNumber: String
    }]
  }],
  whatsappTemplateId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', templateSchema);