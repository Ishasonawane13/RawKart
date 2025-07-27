const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, 'YOUR_JWT_SECRET', { expiresIn: '1d' }); // Replace with a secret from .env file
};

// @route   POST /api/users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, mobile, password, role } = req.body;

  try {
    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: 'User with this mobile number already exists' });
    }

    const user = await User.create({ name, mobile, password, role });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await User.findOne({ mobile });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid mobile number or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
