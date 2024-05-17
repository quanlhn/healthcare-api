const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workoutExerciseSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    exerciseID: {
        type: [Schema.Types.ObjectId],
        ref: 'Exercises',
        required: true
    },
    totalDuration: {
        type: Number,
        required: true
    },
    calorieBurned: {
        type: Number,
        required: true
    },
    restTime: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const WorkoutExercises = mongoose.model('WorkoutExercises', workoutExerciseSchema);
module.exports = WorkoutExercises;