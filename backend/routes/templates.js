const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');
const { templateValidators } = require('../utils/validators');

router.get('/', auth, templateController.getTemplates);
router.post('/', auth, templateValidators.create, templateController.createTemplate);
router.put('/:id', auth, templateValidators.update, templateController.updateTemplate);
router.delete('/:id', auth, templateController.deleteTemplate);

module.exports = router;