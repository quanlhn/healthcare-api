const express = require('express')
const router = express.Router()

const DiaryController = require('../controller/diaryController')

router.post('/addWorkoutToDiary', DiaryController.addWorkoutToDiary)
router.post('/addMealToDiary', DiaryController.addMealToDiary)
router.post('/getDairyWorkout', DiaryController.getDairyWorkout)
router.post('/getDairyMeal', DiaryController.getDairyMeal)



module.exports = router