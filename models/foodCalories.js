const mongoose = require('mongoose')
const Schema = mongoose.Schema

const foodCaloriesSchema = new Schema({
    ten: {
        type: String
    },
    loai: {
        type: String
    },
    don_vi_tinh: {
        type: String
    },
    calo: {
        type: Number
    },
    carbohydrat: {
        type: Number
    },
    fiber: {
        type: Number
    },
    lipit: {
        type: Number
    },
    protein: {
        type: Number
    },
    coefficient: {
        type: Number
    }
}, {timestamps: true})

const FoodCalories = mongoose.model('FoodCalories', foodCaloriesSchema)
module.exports = FoodCalories