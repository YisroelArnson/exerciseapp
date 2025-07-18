const express = require('express');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateExerciseInput, validateQueryParams, commonQuerySchemas } = require('../middleware/validation');
const Exercise = require('../models/Exercise');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   GET /api/exercises
 * @desc    Get all exercises for the authenticated user
 * @access  Private
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 10, startAfter } = req.query;

    const result = await Exercise.getPaginated(req.user.uid, {
      limit: parseInt(limit),
      startAfter: startAfter || null
    });

    res.json({
      success: true,
      data: result.exercises.map(exercise => exercise.toJSON()),
      pagination: {
        hasMore: result.hasMore,
        lastDoc: result.lastDoc
      },
      message: 'Exercises retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting exercises:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve exercises'
    });
  }
});

/**
 * @route   GET /api/exercises/history
 * @desc    Get exercise history for the authenticated user
 * @access  Private
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const exercises = await Exercise.getByUserId(req.user.uid, {
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: exercises.map(exercise => exercise.toJSON()),
      message: 'Exercise history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting exercise history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve exercise history'
    });
  }
});

/**
 * @route   POST /api/exercises
 * @desc    Create a new exercise entry
 * @access  Private
 */
router.post('/', verifyToken, validateExerciseInput, async (req, res) => {
  try {
    const exerciseData = {
      ...req.body,
      userId: req.user.uid
    };

    // Remove userId from body since it should come from auth
    delete exerciseData.userId;
    exerciseData.userId = req.user.uid;

    const exercise = await Exercise.create(exerciseData);

    // Update user stats after creating exercise
    try {
      const stats = await Exercise.getStats(req.user.uid);
      const user = await User.getByUid(req.user.uid);
      if (user) {
        await user.updateStats({
          totalWorkouts: stats.totalWorkouts,
          totalDuration: stats.totalDuration,
          streak: stats.streak,
          longestStreak: Math.max(user.stats?.longestStreak || 0, stats.streak),
          favoriteExercise: stats.favoriteExercise
        });
      }
    } catch (statsError) {
      console.error('Error updating user stats:', statsError);
      // Don't fail the request if stats update fails
    }

    res.status(201).json({
      success: true,
      data: exercise.toJSON(),
      message: 'Exercise logged successfully'
    });
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to log exercise'
    });
  }
});

/**
 * @route   GET /api/exercises/stats
 * @desc    Get exercise statistics for the authenticated user
 * @access  Private
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await Exercise.getStats(req.user.uid);

    res.json({
      success: true,
      data: stats,
      message: 'Exercise statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting exercise stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve exercise statistics'
    });
  }
});

/**
 * @route   GET /api/exercises/search
 * @desc    Search exercises by name
 * @access  Private
 */
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q: searchTerm, limit = 10 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Missing search term',
        message: 'Please provide a search term (q parameter)'
      });
    }

    const exercises = await Exercise.search(req.user.uid, searchTerm);

    res.json({
      success: true,
      data: exercises.slice(0, parseInt(limit)).map(exercise => exercise.toJSON()),
      message: 'Exercise search completed successfully'
    });
  } catch (error) {
    console.error('Error searching exercises:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to search exercises'
    });
  }
});

/**
 * @route   GET /api/exercises/:id
 * @desc    Get a specific exercise by ID
 * @access  Private
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const exercise = await Exercise.getById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found',
        message: 'The requested exercise does not exist'
      });
    }

    // Check if the exercise belongs to the authenticated user
    if (exercise.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own exercises'
      });
    }

    res.json({
      success: true,
      data: exercise.toJSON(),
      message: 'Exercise retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting exercise:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve exercise'
    });
  }
});

/**
 * @route   PUT /api/exercises/:id
 * @desc    Update an exercise
 * @access  Private
 */
router.put('/:id', verifyToken, validateExerciseInput, async (req, res) => {
  try {
    const exercise = await Exercise.getById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found',
        message: 'The requested exercise does not exist'
      });
    }

    // Check if the exercise belongs to the authenticated user
    if (exercise.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own exercises'
      });
    }

    // Remove userId from update data
    const updateData = { ...req.body };
    delete updateData.userId;

    const updatedExercise = await exercise.update(updateData);

    res.json({
      success: true,
      data: updatedExercise.toJSON(),
      message: 'Exercise updated successfully'
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update exercise'
    });
  }
});

/**
 * @route   DELETE /api/exercises/:id
 * @desc    Delete an exercise
 * @access  Private
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const exercise = await Exercise.getById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found',
        message: 'The requested exercise does not exist'
      });
    }

    // Check if the exercise belongs to the authenticated user
    if (exercise.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own exercises'
      });
    }

    await exercise.delete();

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete exercise'
    });
  }
});

module.exports = router; 