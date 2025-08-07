const express = require('express');
const { getAuth } = require('../firebase/config');
const User = require('../models/User');

const router = express.Router();
const auth = getAuth();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userRecord = await auth.createUser({
      email,
      password
    });

    const user = await User.create({
      uid: userRecord.uid,
      email: userRecord.email
    });

    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    res.json({ message: 'Use Firebase client SDK for authentication' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;