const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WhatsAppNumber = require('../models/WhatsappNumber');
const User = require('../models/User');
const { whatsappNumberValidators } = require('../utils/validators');

router.get('/', auth, async (req, res) => {
  try {
    const numbers = await WhatsAppNumber.find({ userId: req.userId });
    res.json(numbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, whatsappNumberValidators.create, async (req, res) => {
  try {
    const number = new WhatsAppNumber({ ...req.body, userId: req.userId });
    await number.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { whatsappNumbers: number._id }
    });

    res.status(201).json(number);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, whatsappNumberValidators.update, async (req, res) => {
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

router.delete('/:id', auth, async (req, res) => {
  try {
    await WhatsAppNumber.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    await User.findByIdAndUpdate(req.userId, {
      $pull: { whatsappNumbers: req.params.id }
    });
    res.json({ message: 'Number deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;