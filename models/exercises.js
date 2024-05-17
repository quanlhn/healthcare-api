const mongoose = require('mongoose')
const Schema = mongoose.Schema

const exercisesSchema = new Schema({
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
}, {timestamps: true})

const Exercises = mongoose.model('Exercises', exercisesSchema)
module.exports = Exercises