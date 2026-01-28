const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const auth = require('../middleware/auth');
const { campaignValidators } = require('../utils/validators');

router.get('/', auth, campaignController.getCampaigns);
router.post('/', auth, campaignValidators.create, campaignController.createCampaign);
router.put('/:id', auth, campaignValidators.update, campaignController.updateCampaign);
router.delete('/:id', auth, campaignController.deleteCampaign);

module.exports = router;