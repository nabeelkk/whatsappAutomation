const Chatbot = require('../models/Chatbot');

exports.getChatbots = async (req, res) => {
  try {
    const chatbots = await Chatbot.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(chatbots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createChatbot = async (req, res) => {
  try {
    const chatbot = new Chatbot({ ...req.body, userId: req.userId });
    await chatbot.save();
    res.status(201).json(chatbot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }
    
    res.json(chatbot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }
    
    res.json({ message: 'Chatbot deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};