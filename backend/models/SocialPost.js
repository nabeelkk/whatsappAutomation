const mongoose = require("mongoose");

const socialPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platforms: [{ type: String, enum: ['facebook', 'instagram', 'twitter', 'linkedin'] }],
  content: {
    text: String,
    mediaUrls: [String],
    hashtags: [String]
  },
  status: { type: String, enum: ['draft', 'scheduled', 'posted', 'failed'], default: 'draft' },
  scheduledDate: Date,
  postedDate: Date,
  platformPostIds: mongoose.Schema.Types.Mixed,
  error: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SocialPost', socialPostSchema);