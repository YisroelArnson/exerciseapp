const databaseService = require('../services/databaseService');

class Exercise {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.exercise = data.exercise;
        this.reps = data.reps;
        this.sets = data.sets;
        this.weight = data.weight;
        this.duration = data.duration;
        this.muscleGroups = data.muscleGroups || [];
        this.notes = data.notes || '';
        this.date = data.date;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create a new exercise entry
     */
    static async create(exerciseData) {
        try {
            const exercise = await databaseService.create('exercises', {
                ...exerciseData,
                date: exerciseData.date || new Date()
            });

            return new Exercise(exercise);
        } catch (error) {
            console.error('Error creating exercise:', error);
            throw error;
        }
    }

    /**
     * Get exercise by ID
     */
    static async getById(exerciseId) {
        try {
            const exerciseData = await databaseService.getById('exercises', exerciseId);
            return exerciseData ? new Exercise(exerciseData) : null;
        } catch (error) {
            console.error('Error getting exercise:', error);
            throw error;
        }
    }

    /**
     * Get all exercises for a user
     */
    static async getByUserId(userId, options = {}) {
        try {
            const exercises = await databaseService.getByUserId('exercises', userId, {
                orderBy: 'date',
                direction: 'desc',
                ...options
            });

            return exercises.map(exercise => new Exercise(exercise));
        } catch (error) {
            console.error('Error getting user exercises:', error);
            throw error;
        }
    }

    /**
     * Get paginated exercises for a user
     */
    static async getPaginated(userId, { limit = 10, startAfter = null, orderBy = 'date', direction = 'desc' } = {}) {
        try {
            let query = {
                limit,
                orderBy,
                direction
            };

            if (startAfter) {
                query.startAfter = startAfter;
            }

            // First filter by userId, then apply pagination
            const exercises = await databaseService.getByUserId('exercises', userId, query);

            return {
                exercises: exercises.map(exercise => new Exercise(exercise)),
                hasMore: exercises.length === limit,
                lastDoc: exercises.length > 0 ? exercises[exercises.length - 1].id : null
            };
        } catch (error) {
            console.error('Error getting paginated exercises:', error);
            throw error;
        }
    }

    /**
     * Get exercise statistics for a user
     */
    static async getStats(userId) {
        try {
            const exercises = await this.getByUserId(userId);

            if (exercises.length === 0) {
                return {
                    totalWorkouts: 0,
                    totalExercises: 0,
                    totalReps: 0,
                    totalSets: 0,
                    totalWeight: 0,
                    totalDuration: 0,
                    favoriteExercise: null,
                    muscleGroupsWorked: [],
                    lastWorkout: null,
                    streak: 0
                };
            }

            // Calculate basic stats
            const totalExercises = exercises.length;
            const totalReps = exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
            const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
            const totalWeight = exercises.reduce((sum, ex) => sum + (ex.weight || 0), 0);
            const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);

            // Find favorite exercise (most frequent)
            const exerciseCounts = {};
            exercises.forEach(ex => {
                exerciseCounts[ex.exercise] = (exerciseCounts[ex.exercise] || 0) + 1;
            });

            const favoriteExercise = Object.entries(exerciseCounts)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

            // Get unique muscle groups
            const muscleGroupsSet = new Set();
            exercises.forEach(ex => {
                ex.muscleGroups.forEach(group => muscleGroupsSet.add(group));
            });
            const muscleGroupsWorked = Array.from(muscleGroupsSet);

            // Calculate workout days (group by date)
            const workoutDates = [...new Set(exercises.map(ex =>
                new Date(ex.date).toDateString()
            ))];
            const totalWorkouts = workoutDates.length;

            // Calculate current streak
            const streak = this.calculateStreak(exercises);

            return {
                totalWorkouts,
                totalExercises,
                totalReps,
                totalSets,
                totalWeight,
                totalDuration,
                favoriteExercise,
                muscleGroupsWorked,
                lastWorkout: exercises[0]?.date || null,
                streak
            };
        } catch (error) {
            console.error('Error calculating exercise stats:', error);
            throw error;
        }
    }

    /**
     * Calculate current workout streak
     */
    static calculateStreak(exercises) {
        if (exercises.length === 0) return 0;

        // Sort exercises by date (newest first)
        const sortedExercises = exercises.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Get unique workout dates
        const workoutDates = [...new Set(sortedExercises.map(ex =>
            new Date(ex.date).toDateString()
        ))].map(dateStr => new Date(dateStr));

        // Sort dates (newest first)
        workoutDates.sort((a, b) => b - a);

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < workoutDates.length; i++) {
            const workoutDate = new Date(workoutDates[i]);
            workoutDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));

            if (i === 0 && daysDiff <= 1) {
                // First workout date should be today or yesterday
                streak = 1;
            } else if (i > 0) {
                const prevWorkoutDate = new Date(workoutDates[i - 1]);
                prevWorkoutDate.setHours(0, 0, 0, 0);
                const daysBetween = Math.floor((prevWorkoutDate - workoutDate) / (1000 * 60 * 60 * 24));

                if (daysBetween === 1) {
                    // Consecutive day
                    streak++;
                } else {
                    // Streak broken
                    break;
                }
            } else {
                // First workout but too old
                break;
            }
        }

        return streak;
    }

    /**
     * Search exercises by name
     */
    static async search(userId, searchTerm) {
        try {
            // Get all user exercises and filter client-side for now
            // In production, you'd want to use Firestore's text search capabilities
            const exercises = await this.getByUserId(userId);

            const filtered = exercises.filter(exercise =>
                exercise.exercise.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return filtered;
        } catch (error) {
            console.error('Error searching exercises:', error);
            throw error;
        }
    }

    /**
     * Update an exercise
     */
    async update(updates) {
        try {
            const updatedData = await databaseService.update('exercises', this.id, updates);
            Object.assign(this, updatedData);
            return this;
        } catch (error) {
            console.error('Error updating exercise:', error);
            throw error;
        }
    }

    /**
     * Delete an exercise
     */
    async delete() {
        try {
            return await databaseService.delete('exercises', this.id);
        } catch (error) {
            console.error('Error deleting exercise:', error);
            throw error;
        }
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            exercise: this.exercise,
            reps: this.reps,
            sets: this.sets,
            weight: this.weight,
            duration: this.duration,
            muscleGroups: this.muscleGroups,
            notes: this.notes,
            date: this.date,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Exercise; 