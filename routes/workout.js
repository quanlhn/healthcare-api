const express = require('express')
const router = express.Router()

const WorkoutController = require('../controller/workoutController')

router.post('/addExercise', WorkoutController.addExercise)
router.post('/addMultipleExercises', WorkoutController.addMultipleExercises)
router.post('/getWorkoutExercises', WorkoutController.getWorkoutExercises)
router.post('/getExercises', WorkoutController.getExercises)
router.post('/getExercisesByTypes', WorkoutController.getExercisesByTypes)


module.exports = router