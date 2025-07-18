const express = require('express');
const router = express.Router();
const { processCommand } = require('../services/voiceService');
const { validateVoiceInput } = require('../middleware/validation');
const { optionalAuth } = require('../middleware/auth');

/**
 * @route POST /api/voice/process
 * @desc Process voice command and log exercise
 * @access Public (optionally authenticated for better user experience)
 */
router.post('/process', optionalAuth, validateVoiceInput, async (req, res, next) => {
  try {
    const { voiceCommand } = req.body;
    const userId = req.user?.uid || 'demo-user'; // Use authenticated user ID or fallback

    console.log(`Processing command: "${voiceCommand}" for user: ${userId}`);

    const result = await processCommand(voiceCommand, userId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Voice command processed successfully',
      ...(req.user ? { userId: req.user.uid } : {})
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    next(error);
  }
});

module.exports = router; 