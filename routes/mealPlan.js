const express = require('express')
const router = express.Router()

const MealPlanController = require('../controller/mealPlanController')

router.post('/getMealPlan', MealPlanController.getMealPlan)


module.exports = router