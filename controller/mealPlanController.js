const { response, query } = require('express')
const MealPlan = require('../models/mealPlan')

const getMealPlan = (req, res, next) => {
    MealPlan.find({_id: req.body.mealsId})
    .then(meals => {
        res.json({
            meals
        })
    })
    .catch((err) => {
        console.log('getSchedule failed')
    })
}

module.exports = {
    getMealPlan
}