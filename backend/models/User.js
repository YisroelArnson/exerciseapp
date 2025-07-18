const databaseService = require('../services/databaseService');

class User {
    constructor(data) {
        this.uid = data.uid;
        this.email = data.email;
        this.displayName = data.displayName;
        this.photoURL = data.photoURL;
        this.emailVerified = data.emailVerified;
        this.preferences = data.preferences || {};
        this.profile = data.profile || {};
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create a new user profile in Firestore
     */
    static async create(userData) {
        try {
            const userProfile = {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName || '',
                photoURL: userData.photoURL || '',
                emailVerified: userData.emailVerified || false,
                preferences: {
                    units: 'metric', // metric or imperial
                    notifications: {
                        workoutReminders: true,
                        achievements: true,
                        social: true
                    },
                    privacy: {
                        profileVisible: true,
                        workoutsVisible: false,
                        statsVisible: false
                    }
                },
                profile: {
                    age: null,
                    gender: null,
                    height: null,
                    weight: null,
                    fitnessLevel: 'beginner', // beginner, intermediate, advanced
                    goals: [],
                    bio: ''
                },
                stats: {
                    totalWorkouts: 0,
                    totalDuration: 0,
                    streak: 0,
                    longestStreak: 0,
                    favoriteExercise: null
                }
            };

            const user = await databaseService.create('users', userProfile, userData.uid);
            return new User(user);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Get user by UID
     */
    static async getByUid(uid) {
        try {
            const userData = await databaseService.getById('users', uid);
            return userData ? new User(userData) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async update(updates) {
        try {
            const updatedData = await databaseService.update('users', this.uid, updates);

            // Update this instance with new data
            Object.assign(this, updatedData);

            return this;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update user preferences
     */
    async updatePreferences(preferences) {
        try {
            const updates = {
                preferences: {
                    ...this.preferences,
                    ...preferences
                }
            };

            return await this.update(updates);
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        try {
            const updates = {
                profile: {
                    ...this.profile,
                    ...profileData
                }
            };

            return await this.update(updates);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Update user stats
     */
    async updateStats(statsUpdate) {
        try {
            const updates = {
                stats: {
                    ...this.stats,
                    ...statsUpdate
                }
            };

            return await this.update(updates);
        } catch (error) {
            console.error('Error updating user stats:', error);
            throw error;
        }
    }

    /**
     * Delete user (soft delete by marking as deleted)
     */
    async delete() {
        try {
            await this.update({
                deleted: true,
                deletedAt: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Get user's public profile (filtered data for public viewing)
     */
    getPublicProfile() {
        return {
            uid: this.uid,
            displayName: this.displayName,
            photoURL: this.photoURL,
            profile: this.preferences?.privacy?.profileVisible ? {
                bio: this.profile?.bio,
                fitnessLevel: this.profile?.fitnessLevel,
                goals: this.profile?.goals
            } : {},
            stats: this.preferences?.privacy?.statsVisible ? this.stats : {}
        };
    }

    /**
     * Convert to JSON (removes sensitive data)
     */
    toJSON() {
        return {
            uid: this.uid,
            email: this.email,
            displayName: this.displayName,
            photoURL: this.photoURL,
            emailVerified: this.emailVerified,
            preferences: this.preferences,
            profile: this.profile,
            stats: this.stats,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = User; 