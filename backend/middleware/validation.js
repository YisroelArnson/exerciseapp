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

/**
 * Validation schema for user profile updates
 */
const userProfileSchema = Joi.object({
  displayName: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Display name must be at least 1 character long',
      'string.max': 'Display name cannot exceed 100 characters'
    }),
  profile: Joi.object({
    age: Joi.number()
      .integer()
      .min(13)
      .max(120)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Age must be at least 13',
        'number.max': 'Age cannot exceed 120'
      }),
    gender: Joi.string()
      .valid('male', 'female', 'other', 'prefer-not-to-say')
      .optional()
      .allow(null),
    height: Joi.number()
      .min(50)
      .max(300)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Height must be at least 50cm',
        'number.max': 'Height cannot exceed 300cm'
      }),
    weight: Joi.number()
      .min(20)
      .max(1000)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Weight must be at least 20kg',
        'number.max': 'Weight cannot exceed 1000kg'
      }),
    fitnessLevel: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .optional(),
    goals: Joi.array()
      .items(Joi.string().valid('weight-loss', 'muscle-gain', 'endurance', 'strength', 'flexibility', 'general-fitness'))
      .optional(),
    bio: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Bio cannot exceed 500 characters'
      })
  }).optional()
});

/**
 * Validation schema for user preferences
 */
const userPreferencesSchema = Joi.object({
  units: Joi.string()
    .valid('metric', 'imperial')
    .optional(),
  notifications: Joi.object({
    workoutReminders: Joi.boolean().optional(),
    achievements: Joi.boolean().optional(),
    social: Joi.boolean().optional()
  }).optional(),
  privacy: Joi.object({
    profileVisible: Joi.boolean().optional(),
    workoutsVisible: Joi.boolean().optional(),
    statsVisible: Joi.boolean().optional()
  }).optional()
});

/**
 * Middleware to validate user profile input
 */
function validateUserProfile(req, res, next) {
  const { error, value } = userProfileSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

/**
 * Middleware to validate user preferences input
 */
function validateUserPreferences(req, res, next) {
  const { error, value } = userPreferencesSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

/**
 * Validation schema for email registration
 */
const emailRegistrationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    }),
  displayName: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Display name must be at least 1 character long',
      'string.max': 'Display name cannot exceed 100 characters'
    })
});

/**
 * Validation schema for email login
 */
const emailLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Validation schema for ID token verification
 */
const tokenVerificationSchema = Joi.object({
  idToken: Joi.string()
    .required()
    .messages({
      'any.required': 'ID token is required'
    })
});

/**
 * Validation schema for phone number
 */
const phoneVerificationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)',
      'any.required': 'Phone number is required'
    })
});

/**
 * Validation schema for password reset
 */
const passwordResetSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

/**
 * Validation schema for password change
 */
const passwordChangeSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'any.required': 'New password is required'
    })
});

/**
 * Middleware to validate email registration input
 */
function validateEmailRegistration(req, res, next) {
  const { error, value } = emailRegistrationSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

/**
 * Middleware to validate email login input
 */
function validateEmailLogin(req, res, next) {
  const { error, value } = emailLoginSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

/**
 * Middleware to validate token verification input
 */
function validateTokenVerification(req, res, next) {
  const { error, value } = tokenVerificationSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

/**
 * Middleware to validate phone verification input
 */
function validatePhoneVerification(req, res, next) {
  const { error, value } = phoneVerificationSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

/**
 * Middleware to validate password reset input
 */
function validatePasswordReset(req, res, next) {
  const { error, value } = passwordResetSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

/**
 * Middleware to validate password change input
 */
function validatePasswordChange(req, res, next) {
  const { error, value } = passwordChangeSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessage
    });
  }

  req.body = value;
  next();
}

module.exports = {
  validateVoiceInput,
  validateExerciseInput,
  validateQueryParams,
  validateUserProfile,
  validateUserPreferences,
  validateEmailRegistration,
  validateEmailLogin,
  validateTokenVerification,
  validatePhoneVerification,
  validatePasswordReset,
  validatePasswordChange,
  commonQuerySchemas,
  voiceCommandSchema,
  exerciseSchema,
  userProfileSchema,
  userPreferencesSchema,
  emailRegistrationSchema,
  emailLoginSchema,
  tokenVerificationSchema,
  phoneVerificationSchema,
  passwordResetSchema,
  passwordChangeSchema
}; 