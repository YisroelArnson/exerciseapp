const { getAuth } = require('../firebase/config');
const User = require('../models/User');

const authController = {
    /**
     * Email/Password Registration
     */
    async registerWithEmail(req, res) {
        try {
            const { email, password, displayName } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            const auth = getAuth();

            // Create user in Firebase Auth
            const userRecord = await auth.createUser({
                email,
                password,
                displayName,
                emailVerified: false
            });

            // Generate email verification link
            const verificationLink = await auth.generateEmailVerificationLink(email);

            // Create user profile in Firestore
            const user = await User.create({
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: displayName || '',
                photoURL: '',
                emailVerified: false
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please verify your email.',
                user: user.toJSON(),
                verificationLink, // In production, send this via email service
                uid: userRecord.uid
            });

        } catch (error) {
            console.error('Email registration error:', error);

            if (error.code === 'auth/email-already-exists') {
                return res.status(409).json({
                    success: false,
                    error: 'Email already exists',
                    message: 'An account with this email already exists'
                });
            }

            if (error.code === 'auth/invalid-email') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email',
                    message: 'Please provide a valid email address'
                });
            }

            if (error.code === 'auth/weak-password') {
                return res.status(400).json({
                    success: false,
                    error: 'Weak password',
                    message: 'Password should be at least 6 characters'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Registration failed',
                message: 'Failed to register user'
            });
        }
    },

    /**
     * Email/Password Login
     */
    async loginWithEmail(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            // Note: Firebase Admin SDK doesn't have signInWithEmailAndPassword
            // This endpoint expects the client to authenticate and send the ID token
            // We'll verify the token and return user data

            res.status(400).json({
                success: false,
                error: 'Client-side authentication required',
                message: 'Please authenticate on the client side and send the ID token'
            });

        } catch (error) {
            console.error('Email login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed',
                message: 'Failed to authenticate user'
            });
        }
    },

    /**
     * Verify ID Token and return user data (for all auth methods)
     */
    async verifyAndLogin(req, res) {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                return res.status(400).json({
                    success: false,
                    error: 'ID token is required'
                });
            }

            const auth = getAuth();
            const decodedToken = await auth.verifyIdToken(idToken);

            // Get or create user profile
            let user = await User.getByUid(decodedToken.uid);

            if (!user) {
                // Create new user profile
                user = await User.create({
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    displayName: decodedToken.name || '',
                    photoURL: decodedToken.picture || '',
                    emailVerified: decodedToken.email_verified || false
                });
            } else {
                // Update existing user with latest auth info
                await user.update({
                    email: decodedToken.email,
                    displayName: decodedToken.name || user.displayName,
                    photoURL: decodedToken.picture || user.photoURL,
                    emailVerified: decodedToken.email_verified || user.emailVerified
                });
            }

            res.json({
                success: true,
                message: 'Authentication successful',
                user: user.toJSON(),
                token: {
                    idToken,
                    expiresIn: decodedToken.exp - Math.floor(Date.now() / 1000)
                }
            });

        } catch (error) {
            console.error('Token verification error:', error);

            if (error.code === 'auth/id-token-expired') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired',
                    message: 'Please sign in again'
                });
            }

            res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'Authentication failed'
            });
        }
    },

    /**
     * Send Email Verification
     */
    async sendEmailVerification(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
            }

            const auth = getAuth();
            const verificationLink = await auth.generateEmailVerificationLink(email);

            // In production, send this via your email service (SendGrid, etc.)

            res.json({
                success: true,
                message: 'Verification email sent',
                verificationLink // Remove this in production
            });

        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send verification email'
            });
        }
    },

    /**
     * Send Phone Verification Code
     */
    async sendPhoneVerification(req, res) {
        try {
            const { phoneNumber } = req.body;

            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Phone number is required'
                });
            }

            // Note: Phone verification is typically handled on the client side
            // This is a placeholder for server-side phone verification if needed

            res.json({
                success: true,
                message: 'Please use client-side phone verification',
                phoneNumber
            });

        } catch (error) {
            console.error('Phone verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send verification code'
            });
        }
    },

    /**
     * Refresh Token
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token is required'
                });
            }

            // Note: Token refresh is typically handled on the client side with Firebase
            // This endpoint can be used for custom token logic if needed

            res.json({
                success: true,
                message: 'Please use client-side token refresh with Firebase SDK'
            });

        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to refresh token'
            });
        }
    },

    /**
     * Logout User
     */
    async logout(req, res) {
        try {
            const { uid } = req.user;

            // Revoke all refresh tokens for the user
            const auth = getAuth();
            await auth.revokeRefreshTokens(uid);

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to logout'
            });
        }
    },

    /**
     * Reset Password
     */
    async resetPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
            }

            const auth = getAuth();
            const resetLink = await auth.generatePasswordResetLink(email);

            // In production, send this via your email service

            res.json({
                success: true,
                message: 'Password reset email sent',
                resetLink // Remove this in production
            });

        } catch (error) {
            console.error('Password reset error:', error);

            if (error.code === 'auth/user-not-found') {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                    message: 'No account found with this email'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to send password reset email'
            });
        }
    },

    /**
     * Change Password
     */
    async changePassword(req, res) {
        try {
            const { newPassword } = req.body;
            const { uid } = req.user;

            if (!newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'New password is required'
                });
            }

            const auth = getAuth();
            await auth.updateUser(uid, {
                password: newPassword
            });

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);

            if (error.code === 'auth/weak-password') {
                return res.status(400).json({
                    success: false,
                    error: 'Weak password',
                    message: 'Password should be at least 6 characters'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to change password'
            });
        }
    },

    /**
     * Get Current User (already exists in userController, but included for completeness)
     */
    async getCurrentUser(req, res) {
        try {
            const user = await User.getByUid(req.user.uid);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                user: user.toJSON()
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user'
            });
        }
    }
};

module.exports = authController; 