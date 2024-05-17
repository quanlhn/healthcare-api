const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dishCaloriesSchema = new Schema({
    ten: {
        type: String
    },
    don_vi_tinh: {
        type: String
    },
    loai: {
        type: String
    },
    calo: {
        type: Number
    },
    protein: {
        type: Number
    },
    lipit: {
        type: Number
    },
    carbohydrat: {
        type: Number
    },
    fiber: {
        type: Number
    }
}, {timestamps: true})

const DishCalories = mongoose.model('DishCalories', dishCaloriesSchema)
module.exports = DishCalories