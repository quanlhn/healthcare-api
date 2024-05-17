const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
    days: [{
        date: {
            type: Date,
            required: true
        },
        mealPlan: {
            type: Schema.Types.ObjectId,
            ref: 'MealPlan'
        },
        workoutExercises: {
            type: Schema.Types.ObjectId,
            ref: 'WorkoutExercises'
        },
        calories: {
            type: Number
        }
    }],
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    process: String,
    goalsLv1: String,
    goalsLv2: String,
    goalsLv3: String,
    barriers: [String],
    wishes: [String],
    height: Number,
    weightUpdated: Number,
    weight: Number,
    goalWeight: Number,
    weeklyGoal: Number,
    baseActivity: Number,
    levelExercise: String,
    daysPerWeek: Number,
    periods: Number,
    availableExercises: [String]

}, { timestamps: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;