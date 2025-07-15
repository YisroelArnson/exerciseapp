const express = require('express');
const router = express.Router();
const { processCommand } = require('../services/voiceService');
const { validateVoiceInput } = require('../middleware/validation');

/**
 * @route POST /api/voice/process
 * @desc Process voice command and log exercise
 * @access Public (for now, will add auth later)
 */
router.post('/process', validateVoiceInput, async (req, res, next) => {
  try {
    const { voiceCommand } = req.body;

    console.log(`Processing command: "${voiceCommand}"`);

    const result = await processCommand(voiceCommand);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Voice command processed successfully'
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    next(error);
  }
});

module.exports = router; 