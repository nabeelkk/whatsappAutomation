const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { contactValidators, queryValidators } = require('../utils/validators');

router.get('/', auth, queryValidators.pagination, queryValidators.search, contactController.getContacts);
router.post('/', auth, contactValidators.create, contactController.createContact);
router.put('/:id', auth, contactValidators.update, contactController.updateContact);
router.delete('/:id', auth, contactController.deleteContact);
router.post('/import', auth, upload.single('file'), contactController.importContacts);
router.post('/bulk-action', auth, contactValidators.bulkAction, contactController.bulkAction);

module.exports = router;