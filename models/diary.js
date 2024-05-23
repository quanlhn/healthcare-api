const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Exercises = require('../models/exercises')

const diarySchema = new Schema(({
    days: [{
        date: {
            type: Date,
            required: true
        },
        mealPlan: [],
        workoutExercises: [{ 
            name: {
                type: String
            },
            type: {
                type: String
            },
            description: {
                type: String
            },
            muscleGroups: {
                type: String
            },
            difficultyLevel: {
                type: String
            },
            duration: {
                type: Number
            },
            reps: {
                type: Number
            },
            imageUrl: {
                type: String
            },
            videoUrl: {
                type: String
            },
            category: {
                type: String
            },
            met: {
                type: Number
            }
        }],
        workoutCalories: {
            type: Number
        },
        calo: {
            type: Number
        },
        carbohydrat: {
            type: Number
        },
        lipit: {
            type: Number
        },
        protein: {
            type: Number
        },
        fiber: {
            type: Number
        },

    }],
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {type: String}
}))

const Diary = mongoose.model('Diary', diarySchema)
module.exports = Diary