const express = require('express')
const router = express.Router()

const WorkoutController = require('../controller/workoutController')

router.post('/addExercise', WorkoutController.addExercise)
router.post('/addMultipleExercises', WorkoutController.addMultipleExercises)


module.exports = router