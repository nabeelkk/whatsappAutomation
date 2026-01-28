const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const auth = require('../middleware/auth');
const { chatbotValidators } = require('../utils/validators');

router.get('/', auth, chatbotController.getChatbots);
router.post('/', auth, chatbotValidators.create, chatbotController.createChatbot);
router.put('/:id', auth, chatbotValidators.update, chatbotController.updateChatbot);
router.delete('/:id', auth, chatbotController.deleteChatbot);

module.exports = router;