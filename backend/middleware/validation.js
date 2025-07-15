const Joi = require('joi');

/**
 * Validation schema for voice command processing
 */
const voiceCommandSchema = Joi.object({
  voiceCommand: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Voice command cannot be empty',
      'string.min': 'Voice command must be at least 1 character long',
      'string.max': 'Voice command cannot exceed 500 characters',
      'any.required': 'Voice command is required'
    }),
  userId: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .default('demo-user')
    .messages({
      'string.min': 'User ID must be at least 1 character long',
      'string.max': 'User ID cannot exceed 100 characters'
    })
});

/**
 * Validation schema for exercise creation
 */
const exerciseSchema = Joi.object({
  userId: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .default('demo-user'),
  exercise: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Exercise name cannot be empty',
      'string.min': 'Exercise name must be at least 1 character long',
      'string.max': 'Exercise name cannot exceed 100 characters',
      'any.required': 'Exercise name is required'
    }),
  reps: Joi.number()
    .integer()
    .min(0)
    .max(10000)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Reps must be a number',
      'number.integer': 'Reps must be a whole number',
      'number.min': 'Reps cannot be negative',
      'number.max': 'Reps cannot exceed 10000'
    }),
  sets: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Sets must be a number',
      'number.integer': 'Sets must be a whole number',
      'number.min': 'Sets cannot be negative',
      'number.max': 'Sets cannot exceed 1000'
    }),
  weight: Joi.number()
    .min(0)
    .max(10000)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Weight must be a number',
      'number.min': 'Weight cannot be negative',
      'number.max': 'Weight cannot exceed 10000'
    }),
  duration: Joi.number()
    .integer()
    .min(0)
    .max(1440)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be a whole number',
      'number.min': 'Duration cannot be negative',
      'number.max': 'Duration cannot exceed 1440 minutes (24 hours)'
    }),
  muscleGroups: Joi.array()
    .items(Joi.string().min(1).max(50))
    .optional()
    .default([])
    .messages({
      'array.base': 'Muscle groups must be an array',
      'string.min': 'Muscle group name must be at least 1 character long',
      'string.max': 'Muscle group name cannot exceed 50 characters'
    })
});

/**
 * Middleware to validate voice command input
 */
function validateVoiceInput(req, res, next) {
  const { error, value } = voiceCommandSchema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }
  
  // Replace request body with validated data
  req.body = value;
  next();
}

/**
 * Middleware to validate exercise input
 */
function validateExerciseInput(req, res, next) {
  const { error, value } = exerciseSchema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }
  
  // Replace request body with validated data
  req.body = value;
  next();
}

/**
 * Middleware to validate query parameters
 */
function validateQueryParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: errorMessage
      });
    }
    
    // Replace query with validated data
    req.query = value;
    next();
  };
}

/**
 * Common query parameter schemas
 */
const commonQuerySchemas = {
  userId: Joi.object({
    userId: Joi.string().min(1).max(100).optional().default('demo-user'),
    limit: Joi.number().integer().min(1).max(100).optional().default(10)
  }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10)
  })
};

module.exports = {
  validateVoiceInput,
  validateExerciseInput,
  validateQueryParams,
  commonQuerySchemas,
  voiceCommandSchema,
  exerciseSchema
}; 