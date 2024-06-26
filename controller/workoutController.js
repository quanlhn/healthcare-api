const { response, query } = require('express')
const WorkoutExercises = require('../models/workoutExercises')
const Exercises = require('../models/exercises')

const addExercise = (req, res, next) => {
    const { name, type, discription, muscleGroups, difficultyLevel, duration, imageUrl, videoUrl, category, reps, met  } = req.body
    const exercise = new Exercises({name, type, discription, muscleGroups, difficultyLevel, duration, imageUrl, videoUrl, category, reps, met})
    exercise.save()
    .then(response => {
        res.json({
            message: 'food added successfully!'
        })
    })
    .catch(err => {
        res.json({
            message: err.toString()
        })
    })
}

const addMultipleExercises = (req, res, next) => {
    const exercises  = req.body
    for (let exercise of exercises) {
        // console.log(food)
        const newExercise = new Exercises({
            name: exercise.name, 
            type: exercise.type, 
            discription: exercise.discription, 
            muscleGroups: exercise.muscleGroups, 
            difficultyLevel: exercise.difficultyLevel, 
            duration: exercise.duration, 
            imageUrl: exercise.imageUrl, 
            videoUrl: exercise.videoUrl, 
            category: exercise.category, 
            reps: exercise.reps, 
            met: exercise.met
        })
        newExercise.save()
        .catch(err => {
            res.json({
                message: err.toString()
            })
        })
    }
    res.json({
        message: 'exercises added successfully!'
    })
}



const getExercises = (req, res, next) => {
    Exercises.find({_id: req.body.exerciseId})
    .then(exercise => {
        res.json({
            exercise
        })
    })
    .catch((err) => {
        console.log('getWorkoutExercises failed')
    })
}

const getWorkoutExercises = (req, res, next) => {
    WorkoutExercises.find({_id: req.body.workoutId})
    .then(workouts => {
        res.json({
            workouts
        })
    })
    .catch((err) => {
        console.log('getWorkoutExercises failed')
    })
}

const getExercisesByTypes = (req, res, next) => {
    const types = req.body.types
    const query= types.map((type) => ({type: type}))
    Exercises.find({$or: query})
    .then(exercises => {
        res.json({
            exercises
        })
    })
    .catch((err) => {
        console.log(err)
    })

}

module.exports = {
    addExercise,
    addMultipleExercises,
    getWorkoutExercises,
    getExercises,
    getExercisesByTypes
}
