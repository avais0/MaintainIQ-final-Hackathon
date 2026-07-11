const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate, requireRole, JWT_SECRET } = require('../middleware/auth');

// Register user (Open for simplicity during hackathon/testing)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const user = await User.create({ username, email, password, role });
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Get all technicians (Admin only, to assign issues)
router.get('/technicians', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician' },
      attributes: ['id', 'username', 'email']
    });
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
