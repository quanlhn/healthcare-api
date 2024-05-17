const express = require('express')
const router = express.Router()

const CaloriesCalController = require('../controller/caloriesCalController')

router.get('/getFoods', CaloriesCalController.getAllFood)
router.get('/getDishes', CaloriesCalController.getAllDish)
router.post('/addFood', CaloriesCalController.addFoodCalories)
router.post('/addMultipleFood', CaloriesCalController.addMultipleFood)
router.post('/addDish', CaloriesCalController.addDishCalories)
router.post('/addMultipleDishes', CaloriesCalController.addMultipleDish)
router.post('/foodFilter', CaloriesCalController.foodFilter)
router.post('/dishFilter', CaloriesCalController.dishFilter)
router.get('/getDistinctFood', CaloriesCalController.getDistinctFood)
router.get('/getDistinctDish', CaloriesCalController.getDistinctDish)
router.get('/getDistinctDishUnit', CaloriesCalController.getDistinctDishUnit)
router.get('/getDistinctUnit', CaloriesCalController.getDistinctUnit)

module.exports = router