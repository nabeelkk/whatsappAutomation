const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WhatsAppNumber = require('../models/WhatsappNumber');
const { whatsappNumberValidators } = require('../utils/validators');

router.get('/numbers', auth, async (req, res) => {
  try {
    const numbers = await WhatsAppNumber.find({ userId: req.userId });
    res.json(numbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/numbers', auth, whatsappNumberValidators.create, async (req, res) => {
  try {
    const number = new WhatsAppNumber({ ...req.body, userId: req.userId });
    await number.save();
    res.status(201).json(number);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/numbers/:id', auth, whatsappNumberValidators.update, async (req, res) => {
  try {
    const number = await WhatsAppNumber.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    res.json(number);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/numbers/:id', auth, async (req, res) => {
  try {
    await WhatsAppNumber.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Number deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
