const express = require('express');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const validation = require('../middleware/validation');

const router = express.Router();

// ===== REGISTRATION & LOGIN =====

/**
 * @route   POST /api/auth/register/email
 * @desc    Register with email and password
 * @access  Public
 */
router.post('/register/email', validation.validateEmailRegistration, authController.registerWithEmail);

/**
 * @route   POST /api/auth/login/email  
 * @desc    Login with email and password (client-side auth required)
 * @access  Public
 */
router.post('/login/email', authController.loginWithEmail);

/**
 * @route   POST /api/auth/verify-login
 * @desc    Verify ID token and complete login (for all auth methods)
 * @access  Public
 */
router.post('/verify-login', authController.verifyAndLogin);

// ===== EMAIL VERIFICATION =====

/**
 * @route   POST /api/auth/send-email-verification
 * @desc    Send email verification link
 * @access  Public
 */
router.post('/send-email-verification', authController.sendEmailVerification);

// ===== PHONE AUTHENTICATION =====

/**
 * @route   POST /api/auth/phone/send-code
 * @desc    Send SMS verification code
 * @access  Public
 */
router.post('/phone/send-code', authController.sendPhoneVerification);

// ===== PASSWORD MANAGEMENT =====

/**
 * @route   POST /api/auth/reset-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', verifyToken, authController.changePassword);

// ===== TOKEN MANAGEMENT =====

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh authentication token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify if token is valid
 * @access  Private
 */
router.post('/verify-token', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: {
            uid: req.user.uid,
            email: req.user.email,
            emailVerified: req.user.emailVerified
        }
    });
});

// ===== LOGOUT =====

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke refresh tokens
 * @access  Private
 */
router.post('/logout', verifyToken, authController.logout);

// ===== USER PROFILE MANAGEMENT =====

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', verifyToken, authController.getCurrentUser);

/**
 * @route   POST /api/auth/profile
 * @desc    Create or update user profile after authentication
 * @access  Private
 */
router.post('/profile', verifyToken, userController.createOrUpdateProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', verifyToken, validation.validateUserProfile, userController.updateProfile);

/**
 * @route   PUT /api/auth/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', verifyToken, validation.validateUserPreferences, userController.updatePreferences);

/**
 * @route   PUT /api/auth/stats
 * @desc    Update user stats (internal use)
 * @access  Private
 */
router.put('/stats', verifyToken, userController.updateStats);

/**
 * @route   GET /api/auth/profile/:userId
 * @desc    Get public profile of a user
 * @access  Public
 */
router.get('/profile/:userId', userController.getPublicProfile);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', verifyToken, userController.deleteAccount);

// ===== SOCIAL AUTHENTICATION HELPERS =====

/**
 * @route   GET /api/auth/social/providers
 * @desc    Get available social authentication providers
 * @access  Public
 */
router.get('/social/providers', (req, res) => {
    res.json({
        success: true,
        providers: [
            {
                id: 'google.com',
                name: 'Google',
                enabled: true
            },
            {
                id: 'apple.com',
                name: 'Apple',
                enabled: true
            },
            {
                id: 'phone',
                name: 'Phone',
                enabled: true
            }
        ]
    });
});

module.exports = router; 