const mongoose = require("mongoose");


const chatbotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  triggerKeywords: [String],
  flows: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['start', 'message', 'question', 'condition', 'action', 'end'], required: true },
    position: { x: Number, y: Number },
    data: {
      message: String,
      messageType: { type: String, enum: ['text', 'button', 'list', 'media'] },
      buttons: [{ id: String, text: String, nextFlowId: String }],
      listItems: [{ id: String, title: String, description: String, nextFlowId: String }],
      questionType: { type: String, enum: ['text', 'number', 'email', 'phone'] },
      validation: mongoose.Schema.Types.Mixed,
      variableName: String,
      condition: {
        variable: String,
        operator: String,
        value: String,
        trueFlowId: String,
        falseFlowId: String
      },
      action: {
        type: { type: String, enum: ['addTag', 'removeTag', 'updateField', 'sendEmail', 'webhook'] },
        params: mongoose.Schema.Types.Mixed
      }
    },
    nextFlowId: String
  }],
  fallbackMessage: { type: String, default: "I didn't understand that. Please try again." },
  stats: {
    totalTriggers: { type: Number, default: 0 },
    completedFlows: { type: Number, default: 0 },
    droppedFlows: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chatbot', chatbotSchema);
