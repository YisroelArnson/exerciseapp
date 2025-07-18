const User = require('../models/User');
const { getAuth } = require('../firebase/config');

const userController = {
    /**
     * Get current user profile
     */
    async getCurrentUser(req, res) {
        try {
            const user = await User.getByUid(req.user.uid);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile does not exist'
                });
            }

            res.json({
                success: true,
                user: user.toJSON()
            });
        } catch (error) {
            console.error('Error getting current user:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve user profile'
            });
        }
    },

    /**
     * Create or update user profile (called after successful authentication)
     */
    async createOrUpdateProfile(req, res) {
        try {
            const { uid, email, displayName, photoURL, emailVerified } = req.user;

            // Check if user already exists
            let user = await User.getByUid(uid);

            if (user) {
                // Update existing user with latest auth info
                user = await user.update({
                    email,
                    displayName: displayName || user.displayName,
                    photoURL: photoURL || user.photoURL,
                    emailVerified
                });
            } else {
                // Create new user profile
                user = await User.create({
                    uid,
                    email,
                    displayName,
                    photoURL,
                    emailVerified
                });
            }

            res.status(201).json({
                success: true,
                message: 'Profile created/updated successfully',
                user: user.toJSON()
            });
        } catch (error) {
            console.error('Error creating/updating profile:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to create or update profile'
            });
        }
    },

    /**
     * Update user profile information
     */
    async updateProfile(req, res) {
        try {
            const user = await User.getByUid(req.user.uid);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile does not exist'
                });
            }

            const updates = {};
            const { displayName, profile } = req.body;

            if (displayName !== undefined) {
                updates.displayName = displayName;
            }

            if (profile) {
                const updatedUser = await user.updateProfile(profile);
                return res.json({
                    success: true,
                    message: 'Profile updated successfully',
                    user: updatedUser.toJSON()
                });
            }

            if (Object.keys(updates).length > 0) {
                const updatedUser = await user.update(updates);
                return res.json({
                    success: true,
                    message: 'Profile updated successfully',
                    user: updatedUser.toJSON()
                });
            }

            res.status(400).json({
                error: 'No valid updates provided',
                message: 'Please provide profile data to update'
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to update profile'
            });
        }
    },

    /**
     * Update user preferences
     */
    async updatePreferences(req, res) {
        try {
            const user = await User.getByUid(req.user.uid);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile does not exist'
                });
            }

            const updatedUser = await user.updatePreferences(req.body);

            res.json({
                success: true,
                message: 'Preferences updated successfully',
                user: updatedUser.toJSON()
            });
        } catch (error) {
            console.error('Error updating preferences:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to update preferences'
            });
        }
    },

    /**
     * Update user stats
     */
    async updateStats(req, res) {
        try {
            const user = await User.getByUid(req.user.uid);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile does not exist'
                });
            }

            const updatedUser = await user.updateStats(req.body);

            res.json({
                success: true,
                message: 'Stats updated successfully',
                user: updatedUser.toJSON()
            });
        } catch (error) {
            console.error('Error updating stats:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to update stats'
            });
        }
    },

    /**
     * Get public profile of a user
     */
    async getPublicProfile(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.getByUid(userId);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile does not exist'
                });
            }

            res.json({
                success: true,
                user: user.getPublicProfile()
            });
        } catch (error) {
            console.error('Error getting public profile:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve public profile'
            });
        }
    },

    /**
     * Delete user account
     */
    async deleteAccount(req, res) {
        try {
            const user = await User.getByUid(req.user.uid);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    message: 'User profile does not exist'
                });
            }

            // Soft delete the user profile
            await user.delete();

            // Optionally delete from Firebase Auth
            try {
                const auth = getAuth();
                await auth.deleteUser(req.user.uid);
            } catch (authError) {
                console.error('Error deleting from Firebase Auth:', authError);
                // Continue even if auth deletion fails
            }

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting account:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to delete account'
            });
        }
    }
};

module.exports = userController; 