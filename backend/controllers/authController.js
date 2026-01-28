const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(req.body);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password').populate('whatsappNumbers');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, email, settings } = req.body;
    
//     const user = await User.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     user.name = name || user.name;
//     user.email = email || user.email;
//     user.settings = { ...user.settings, ...settings };

//     await user.save();

//     res.json({ message: 'Profile updated successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
