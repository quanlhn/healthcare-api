const { response, query } = require('express')
const Food = require('../models/foodCalories')
const Dish = require('../models/dishCalories')

const getAllFood = (req, res, next) => {
    Food.find()
    .then(response => {
        res.json({
            response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occurred!'
        })
    })
}

const getAllDish = (req, res, next) => {
    Dish.find()
    .then(response => {
        res.json({
            response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occurred!'
        })
    })
}

const getDistinctDish = (req, res, next) => {
    Dish.distinct("loai")
    .then(response => {
        res.json({
            response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occured!'
        })
    })
}

const getDistinctFood = (req, res, next) => {
    Food.distinct("loai")
    .then(response => {
        res.json({
            response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occured!'
        })
    })
}

const getDistinctDishUnit = (req, res, next) => {
    Dish.distinct("don_vi_tinh")
    .then(response => {
        res.json({
            response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occured!'
        })
    })
}

const getDistinctUnit = (req, res, next) => {
    Food.distinct("don_vi_tinh")
    .then(response => {
        res.json({
            response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occured!'
        })
    })
}

const foodFilter = (req, res, next) => {
    const search = req.body.search
    // console.log(search)
    const query = [
        {
          $search: {
            index: "default",
            text: {
              query: search,
              path: "loai"
            }
          }
        }
      ]
    Food.aggregate(query)
    .then(response => {
        res.json({
            filtedFood: response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occured!'
        })
    })
}

const dishFilter = (req, res, next) => {
    const search = req.body.search
    console.log(search)
    // const query = [
    //     {
    //       $search: {
    //         index: "default",
    //         text: {
    //           query: search,
    //           path: "loai"
    //         }
    //       }
    //     }
    //   ]
    Dish.aggregate([
        {
          $search: {
            index: "default",
            text: {
              query: search,
              path: "loai"
            }
          }
        }, 
    ])
    .then(response => {
        res.json({
            filteredDish: response
        })
    })
    .catch(err => {
        res.json({
            message: 'An error occured!'
        })
    })
}

const addFoodCalories = (req, res, next) => {
    const { loai, ten, don_vi_tinh, calo, carbohydrat, lipit, protein, fiber } = req.body
    let food = new Food({
        loai,
        ten,
        don_vi_tinh,
        calo, carbohydrat, lipit, protein, fiber
    })
    food.save()
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

const addMultipleFood = (req, res, next) => {
    const foodArray  = req.body
    for (let food of foodArray) {
        // console.log(food)
        const newFood = new Food({
            loai: food.loai, 
            ten: food.ten, 
            don_vi_tinh: food.don_vi_tinh, 
            calo: food.calo,
            carbohydrat: food.carbohydrat,
            fiber: food.fiber,
            protein: food.protein,
            lipit: food.lipit,
        })
        newFood.save()
        .catch(err => {
            res.json({
                message: err.toString()
            })
        })
    }
    res.json({
        message: 'foods added successfully!'
    })
}

const addDishCalories = (req, res, next) => {
    const { ten, don_vi_tinh, calo, loai, protein, lipit, carbohydrat, fiber } = req.body
    let dish = new Dish({
        ten,
        don_vi_tinh,
        calo, protein, lipit, carbohydrat, fiber, loai
    })
    dish.save()
    .then(response => {
        res.json({
            message: 'dish added successfully!'
        })
    })
    .catch(err => {
        res.json({
            message: err.toString()
        })
    })
}

const addMultipleDish = (req, res, next) => {
    const dishArray  = req.body
    for (let dish of dishArray) {
        const newDish = new Dish({
            ten: dish.ten, 
            loai: dish.loai,
            don_vi_tinh: dish.don_vi_tinh, 
            calo: dish.calo,
            protein: dish.protein,
            lipit: dish.lipit,
            carbohydrat: dish.carbohydrat,
            fiber: dish.fiber,
        })
        newDish.save()
        .catch(err => {
            res.json({
                message: err.toString()
            })
        })
    }
    res.json({
        message: 'dishes added successfully!'
    })
}

const getDishById = (req, res, next) => {
    Dish.find({_id: req.body.dishId})
    .then(dish => {
        res.json({
            dish
        })
    })
    .catch((err) => {
        console.log('getSchedule failed')
    })
}

// const setFoodUnit = () => {
//     Food.updateMany(
//         {don_vi_tinh: "1 cái"}
//     )
// }

module.exports = {
    addFoodCalories, 
    addMultipleFood, 
    addDishCalories, 
    addMultipleDish, 
    getAllDish, 
    getAllFood, 
    foodFilter, 
    dishFilter, 
    getDistinctFood,
    getDistinctUnit,
    getDistinctDish,
    getDistinctDishUnit,
    getDishById
}