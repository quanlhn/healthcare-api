const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackingSchema = new Schema({
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
    

}, { timestamps: true });

const Tracking = mongoose.model('Tracking', trackingSchema);
module.exports = Tracking;