const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const { messageValidators, queryValidators } = require('../utils/validators');

router.get('/', auth, queryValidators.pagination, messageController.getMessages);
router.post('/send', auth, messageValidators.send, messageController.sendMessage);
router.post('/send-bulk', auth, messageValidators.bulkSend, messageController.sendBulkMessages);

module.exports = router;