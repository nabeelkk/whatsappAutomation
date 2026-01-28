const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authValidators } = require('../utils/validators');

router.post('/register', authValidators.register, authController.register);
router.post('/login', authValidators.login, authController.login);
router.get('/profile', auth, authController.getProfile);

module.exports = router;