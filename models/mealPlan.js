const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mealPlanSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    meals: [
        {
            name: {
                type: String,
                required: true
            },
            dishes: [
                {
                    id: {
                        type: Schema.Types.ObjectId,
                        ref: 'DishCalories',
                    },
                    amount: {
                        type: Number
                    }
                }
            ],
            foodIds: [
                {
                    id: {
                        type: [Schema.Types.ObjectId],
                        ref: 'FoodCalories',
                    },
                    amount: {
                        type: Number
                    }
                }
            ]

        }
    ],
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
    },    

}, { timestamps: true });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
module.exports = MealPlan;

// foodIds: {
//     type: [Schema.Types.ObjectId], 
//     ref: 'Food',
//     required: true
// }