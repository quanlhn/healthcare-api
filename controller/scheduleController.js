const { response, query } = require('express')
const WorkoutExercises = require('../models/workoutExercises')
const Exercises = require('../models/exercises')
const Schedule = require('../models/schedule')
const Dish = require('../models/dishCalories')
const MealPlan = require('../models/mealPlan')

const generateSchedule = async (req, res, next) => {
    const {
        name,
        phoneNumber,
        email,
        gender, 
        birth,
        goalsLv1,
        goalsLv2,
        goalsLv3,
        barriersLv,
        wishes,
        baseActivity,
        stepsPerDay,
        height,
        weight,
        goalWeight,
        weeklyGoal,
        levelExercise,
        daysPerWeek,
        periods,
        availableExercises,
    } = req.body
    // Tính TDEE => calo chênh lệnh từng ngày
    // tdee + calo đốt cháy khi tập  - calo hấp thụ = calo chênh lệch từng ngày
    // Lọc exercises: availableEx => goalsLv2 => wishes & barriers => 
    // giảm cân >> gain-muscle | gain-flexibility >> 


    const currentDate = new Date()
    const dateOfBirth = new Date(birth)
    const age = currentDate.getUTCFullYear() - dateOfBirth.getUTCFullYear()
    const amr = getAMR(gender, height, weight, age, baseActivity)

    const weekActive = Math.floor(Math.abs((weight - goalWeight) / weeklyGoal))
    

    //lọc exercises

    const exercisesLv1 = await getAvailableExercises(availableExercises)
    const workoutSchedule = goalsLv1 == "lose-weight" 
                            ? await loseWeightExSchedule(goalsLv2, daysPerWeek, periods, exercisesLv1, levelExercise, weekActive, weight, amr, weeklyGoal, goalsLv1)
                            : await dailyExercises(goalsLv2, daysPerWeek, periods, exercisesLv1, levelExercise, weekActive, weight)

    res.json({
        amr,
        workoutSchedule
    })

    console.log('hihi')


}

 const loseWeightExSchedule =  async (goalsLv2, daysPerWeek, periods, exercisesLv1, levelExercise, weekActive, weight, amr, weeklyGoal, goalsLv1) => {
    if ((goalsLv2 != 'gain-muscle' && goalsLv2 != 'gain-flexibility') || daysPerWeek < 4) {
        const canUseEx = []
         exercisesLv1.forEach((ex) => {
            if (ex.type == 'football' || ex.type == "badminton" || ex.type == "basketball") {
                canUseEx.push(ex)
            } else {
                if (ex.category == "endurance" && ex.difficultyLevel == levelExercise) {
                    canUseEx.push(ex)
                }
            }
        })
        let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
        let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
        const daysSchedule = []


        for (const [index, day] of daysPractice.entries()) {
            if (day) {
                const currentEx = getRandomElement(canUseEx);
                const calorieBurned = weight * currentEx.met * periods;
                const workoutExercises = new WorkoutExercises({
                    date: getDateAfterDays(index),
                    exerciseID: currentEx._id,
                    totalDuration: periods * 60,
                    calorieBurned,
                    restTime: 0
                });

                // tính calorie intake luôn tại đây
                const caloNeededToday = originCaloSchedule[index] + calorieBurned
                const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
    
                try {
                    const workout = await workoutExercises.save();
                    const meal = await mealPlan.save()
                    daysSchedule.push({
                        date: getDateAfterDays(index),
                        mealPlan: meal._id,
                        workoutExercises: workout._id,
                        calories: meal.calo - (amr + calorieBurned)
                    });
                } catch (err) {
                    console.log(err);
                }
            } else {
                const caloNeededToday = originCaloSchedule[index]
                const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                try{
                    const meal = await mealPlan.save()
                    daysSchedule.push({
                        date: getDateAfterDays(index),
                        mealPlan: meal._id,
                        calories: meal.calo - amr
                    });
                } catch (err) {
                    console.log(err);
                }
                // console.log(caloNeededToday)
            }
        }

        return daysSchedule

    } else if (goalsLv2 == 'gain-muscle'){
        if (periods <= 0.5) {
            // full strength
            const canUseEx = []
            exercisesLv1.forEach((ex) => {
                if (ex.category == "strength") {
                    canUseEx.push(ex)
                }
            })

            let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
            let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()

            const daysSchedule = []
            let i = 0;
            for (const [index, day] of daysPractice.entries()) {
                if (day) {
                    const muscleGroupEx = []
                    const todayWorkoutGroup = getTodayWorkoutGroup(i)
                    if (todayWorkoutGroup == "arm") {
                        canUseEx.forEach((ex) => {
                            if (ex.muscleGroups == 'back-arm' || ex.muscleGroups == 'front-arm') {
                                muscleGroupEx.push(ex)
                            }
                        })
                    } else {
                        canUseEx.forEach((ex) => {
                            if (ex.muscleGroups == todayWorkoutGroup) {
                                muscleGroupEx.push(ex)
                            }
                        })
                    }

                    const todayWorkoutExs = getRandom5El(muscleGroupEx)

                    const workoutExercises = new WorkoutExercises({
                        date: getDateAfterDays(index),
                        exerciseID: todayWorkoutExs.map((ex) => ex._id),
                        totalDuration: getStrengthDurations(todayWorkoutExs),
                        calorieBurned: getStrengthCalorie(todayWorkoutExs, weight),
                        restTime: 2
                    });

                    const caloNeededToday = originCaloSchedule[index] + calorieBurned
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
        
                    try {
                        const workout = await workoutExercises.save();
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            workoutExercises: workout._id,
                            calories: meal.calo - (amr + calorieBurned)
                        });
                    } catch (err) {
                        console.log(err);
                    }
                    
                    i++

                } else {
                    const caloNeededToday = originCaloSchedule[index]
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                    try{
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            calories: meal.calo - amr
                        });
                    } catch (err) {
                        console.log(err);
                    }
                } 
            }
    
            return daysSchedule
        } else {
            // strength + endurance
            const canUseEx = []
            exercisesLv1.forEach((ex) => {
                if (ex.category == "strength" || ex.category == "endurance") {
                    canUseEx.push(ex)
                }
            })

            let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
            let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
            const daysSchedule = []
            let i = 0;
            for (const [index, day] of daysPractice.entries()) {
                if (day) {
                    const muscleGroupEx = []
                    const todayWorkoutGroup = getTodayWorkoutGroup(i)
                    if (todayWorkoutGroup == "arm") {
                        canUseEx.forEach((ex) => {
                            if (ex.muscleGroups == 'back-arm' || ex.muscleGroups == 'front-arm') {
                                muscleGroupEx.push(ex)
                            }
                        })
                    } else {
                        canUseEx.forEach((ex) => {
                            if (ex.muscleGroups == todayWorkoutGroup) {
                                muscleGroupEx.push(ex)
                            }
                        })
                    }

                    const afterStrengthEx = getRandomElement(canUseEx.filter((ex) => ex.category == 'endurance'));
                    const todayWorkoutExs = getRandom5El(muscleGroupEx)
                    const exerciseIDs = todayWorkoutExs.map((ex) => ex._id)
                    exerciseIDs.push(afterStrengthEx._id)
                    const strengWorkout = {
                        date: getDateAfterDays(index),
                        exerciseID: exerciseIDs,
                        totalDuration: getStrengthDurations(todayWorkoutExs) + 20,
                        calorieBurned: getStrengthCalorie(todayWorkoutExs, weight) + afterStrengthEx.met * weight * 20 / 60,
                        restTime: 2
                    }



                    const workoutExercises = new WorkoutExercises(strengWorkout);
                    const caloNeededToday = originCaloSchedule[index] + calorieBurned
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index)) 

                    try {
                        const workout = await workoutExercises.save();
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            workoutExercises: workout._id,
                            calories: meal.calo - (amr + calorieBurned)
                    });
                    } catch (err) {
                        console.log(err);
                    }
                    
                    i++

                } else {
                    const caloNeededToday = originCaloSchedule[index]
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                    try{
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            calories: meal.calo - amr
                        });
                    } catch (err) {
                        console.log(err);
                    }
                } 
            }
    
            return daysSchedule
        }

    } else if (goalsLv2 == 'gain-flexibility') {
        if (periods <= 0.5) {
            //full flexibility
            const canUseEx = []
            exercisesLv1.forEach((ex) => {
                if (ex.category == "flexibility") {
                    canUseEx.push(ex)
                }
            })

            let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
            let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
            const daysSchedule = []
            let i = 0;
            for (const [index, day] of daysPractice.entries()) {
                if (day) {
                    const todayFlexEx = canUseEx

                    const todayWorkoutExs = getRandom25El(todayFlexEx)
                    const workoutExercises = new WorkoutExercises({
                        date: getDateAfterDays(index),
                        exerciseID: todayWorkoutExs.map((ex) => ex._id),
                        totalDuration: 25,
                        calorieBurned: getFlexCalorie(todayWorkoutExs, weight),
                        restTime: 0.5
                    });

                    const caloNeededToday = originCaloSchedule[index] + calorieBurned
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
        
                    try {
                        const workout = await workoutExercises.save();
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            workoutExercises: workout._id,
                            calories: meal.calo - (amr + calorieBurned)
                        });
                    } catch (err) {
                        console.log(err);
                    }
                    
                    i++

                } else {
                    const caloNeededToday = originCaloSchedule[index]
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                    try{
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            calories: meal.calo - amr
                        });
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
    
            return daysSchedule
        } else {
            // flexibility + endurance
            const canUseEx = []
            exercisesLv1.forEach((ex) => {
                if (ex.category == "flexibility" || ex.category == "endurance") {
                    canUseEx.push(ex)
                }
            })

            let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
            let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
            const daysSchedule = []
            let i = 0;
            for (const [index, day] of daysPractice.entries()) {
                if (day) {
                    const yogaEx = []
                    canUseEx.forEach((ex) => {
                        if (ex.category == 'flexibility') {
                            yogaEx.push(ex)
                        }
                    })

                    const afterFlexEx = getRandomElement(canUseEx.filter((ex) => ex.category == 'endurance'));
                    const todayWorkoutExs = getRandom25El(yogaEx)
                    const exerciseIDs = todayWorkoutExs.map((ex) => ex._id)
                    exerciseIDs.push(afterFlexEx._id)
                    const strengWorkout = {
                        date: getDateAfterDays(index),
                        exerciseID: exerciseIDs,
                        totalDuration: 25 + 20,
                        calorieBurned: getFlexCalorie(todayWorkoutExs, weight) + afterFlexEx.met * weight * 20 / 60,
                        restTime: 2
                    }

                    const workoutExercises = new WorkoutExercises(strengWorkout);
                    const caloNeededToday = originCaloSchedule[index] + calorieBurned
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))

                    try {
                        const workout = await workoutExercises.save();
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            workoutExercises: workout._id,
                            calories: meal.calo - (amr + calorieBurned)
                        });
                    } catch (err) {
                        console.log(err);
                    }
                    
                    i++

                } else {
                    const caloNeededToday = originCaloSchedule[index]
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                    try{
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            calories: meal.calo - amr
                        });
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
    
            return daysSchedule
        }

    } else {
        const canUseEx = []
         exercisesLv1.forEach((ex) => {
            if (ex.type == 'football' || ex.type == "badminton" || ex.type == "basketball") {
                canUseEx.push(ex)
            } else {
                if (ex.category == "endurance" && ex.difficultyLevel == levelExercise) {
                    canUseEx.push(ex)
                }
            }
        })
        let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
        let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
        // const daysAWeek = generateExDay(daysPerWeek)
        // for (let i = 0; i < weekActive; i++) {
        //     daysPractice.concat(daysAWeek)
        // }

        const daysSchedule = []

        for (const [index, day] of daysPractice.entries()) {
            if (day) {
                const currentEx = getRandomElement(canUseEx);
                const calorieBurned = weight * currentEx.met * periods;
                const workoutExercises = new WorkoutExercises({
                    date: getDateAfterDays(index),
                    exerciseID: currentEx._id,
                    totalDuration: periods,
                    calorieBurned,
                    restTime: 0
                });

                const caloNeededToday = originCaloSchedule[index] + calorieBurned
                const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
    
                try {
                    const workout = await workoutExercises.save();
                    const meal = await mealPlan.save()
                    daysSchedule.push({
                        date: getDateAfterDays(index),
                        mealPlan: meal._id,
                        workoutExercises: workout._id,
                        calories: meal.calo - (amr + calorieBurned)
                    });
                } catch (err) {
                    console.log(err);
                }
            } else {
                const caloNeededToday = originCaloSchedule[index]
                const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                try{
                    const meal = await mealPlan.save()
                    daysSchedule.push({
                        date: getDateAfterDays(index),
                        mealPlan: meal._id,
                        calories: meal.calo - amr
                    });
                } catch (err) {
                    console.log(err);
                }
            }
        }

        return daysSchedule

    }
}

const dailyExercises = async (goalsLv2, daysPerWeek, periods, exercisesLv1, levelExercise, weekActive, weight) => {
    // full strength
    if (goalsLv2 == "gain-muscle") {
        // full strength
        const canUseEx = []
            exercisesLv1.forEach((ex) => {
                if (ex.category == "strength") {
                    canUseEx.push(ex)
                }
            })

            let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
            let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
            const daysSchedule = []
            let i = 0;
            for (const [index, day] of daysPractice.entries()) {
                if (day) {
                    const muscleGroupEx = []
                    const todayWorkoutGroup = getTodayWorkoutGroup(i)
                    if (todayWorkoutGroup == "arm") {
                        canUseEx.forEach((ex) => {
                            if (ex.muscleGroups == 'back-arm' || ex.muscleGroups == 'front-arm') {
                                muscleGroupEx.push(ex)
                            }
                        })
                    } else {
                        canUseEx.forEach((ex) => {
                            if (ex.muscleGroups == todayWorkoutGroup) {
                                muscleGroupEx.push(ex)
                            }
                        })
                    }

                    const todayWorkoutExs = getRandom5El(muscleGroupEx)

                    const workoutExercises = new WorkoutExercises({
                        date: getDateAfterDays(index),
                        exerciseID: todayWorkoutExs.map((ex) => ex._id),
                        totalDuration: getStrengthDurations(todayWorkoutExs),
                        calorieBurned: getStrengthCalorie(todayWorkoutExs, weight),
                        restTime: 2
                    });

                    const caloNeededToday = originCaloSchedule[index] + calorieBurned
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
        
                    try {
                        const workout = await workoutExercises.save();
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            workoutExercises: workout._id,
                            calories: meal.calo - (amr + calorieBurned)
                        });
                    } catch (err) {
                        console.log(err);
                    }
                    
                    i++

                } else {
                    const caloNeededToday = originCaloSchedule[index]
                    const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                    try{
                        const meal = await mealPlan.save()
                        daysSchedule.push({
                            date: getDateAfterDays(index),
                            mealPlan: meal._id,
                            calories: meal.calo - amr
                        });
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
    
            return daysSchedule
    }
    // full flexibility
    if (goalsLv2 == "gain-flexibility") {
        const canUseEx = []
        exercisesLv1.forEach((ex) => {
            if (ex.category == "flexibility") {
                canUseEx.push(ex)
            }
        })

        let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
        let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
        const daysSchedule = []
        let i = 0;
        for (const [index, day] of daysPractice.entries()) {
            if (day) {
                const todayFlexEx = canUseEx

                const todayWorkoutExs = getRandom25El(todayFlexEx)
                const workoutExercises = new WorkoutExercises({
                    date: getDateAfterDays(index),
                    exerciseID: todayWorkoutExs.map((ex) => ex._id),
                    totalDuration: 25,
                    calorieBurned: getFlexCalorie(todayWorkoutExs, weight),
                    restTime: 0.5
                });

                const caloNeededToday = originCaloSchedule[index] + calorieBurned
                const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
    
                try {
                    const workout = await workoutExercises.save();
                    const meal = await mealPlan.save()
                    daysSchedule.push({
                        date: getDateAfterDays(index),
                        mealPlan: meal._id,
                        workoutExercises: workout._id,
                        calories: meal.calo - (amr + calorieBurned)
                    });
                } catch (err) {
                    console.log(err);
                }
                
                i++

            } else {
                const caloNeededToday = originCaloSchedule[index]
                const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
                try{
                    const meal = await mealPlan.save()
                    daysSchedule.push({
                        date: getDateAfterDays(index),
                        mealPlan: meal._id,
                        calories: meal.calo - amr
                    });
                } catch (err) {
                    console.log(err);
                }
            }
        }
    
        return daysSchedule
    }

    // other
    // full endurance
    const canUseEx = []
    exercisesLv1.forEach((ex) => {
        if (ex.type == 'football' || ex.type == "badminton" || ex.type == "basketball") {
            canUseEx.push(ex)
        } else {
            if (ex.category == "endurance" && ex.difficultyLevel == levelExercise) {
                canUseEx.push(ex)
            }
        }
    })
    let daysPractice = Array.from({ length: weekActive }, () => generateExDay(daysPerWeek)).flat()
    let originCaloSchedule = Array.from({length: weekActive}, () => caloIntakeInWeeks(amr, weeklyGoal, goalsLv1)).flat()
    const daysSchedule = []


    for (const [index, day] of daysPractice.entries()) {
        if (day) {
            const currentEx = getRandomElement(canUseEx);
            const calorieBurned = weight * currentEx.met * periods;
            const workoutExercises = new WorkoutExercises({
                date: getDateAfterDays(index),
                exerciseID: currentEx._id,
                totalDuration: periods,
                calorieBurned,
                restTime: 0
            });

            const caloNeededToday = originCaloSchedule[index] + calorieBurned
            const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))

            try {
                const workout = await workoutExercises.save();
                const meal = await mealPlan.save()
                daysSchedule.push({
                    date: getDateAfterDays(index),
                    mealPlan: meal._id,
                    workoutExercises: workout._id,
                    calories: meal.calo - (amr + calorieBurned)
                });
            } catch (err) {
                console.log(err);
            } 
        } else {
            const caloNeededToday = originCaloSchedule[index]
            const mealPlan = new MealPlan(await todayMeals(caloNeededToday, index))
            try{
                const meal = await mealPlan.save()
                daysSchedule.push({
                    date: getDateAfterDays(index),
                    mealPlan: meal._id,
                    calories: meal.calo - amr
                });
            } catch (err) {
                console.log(err);
            }
        }
    }

    return daysSchedule

}

// clorie burned 1 ngay = amr + calorie exercises-------------------------------------------------------------
// 
const todayMeals = async (caloNeededToday, index) => {

    const targetCalories = caloNeededToday; 
    const snack = Math.random() > 0.5 ? true : false
    // const snack = false

    const idealBreakfastCalo = snack ? targetCalories * 0.15 : targetCalories * 0.2
    const idealLunchCalo = snack ? targetCalories * 0.45 : targetCalories * 0.5
    const idealDinnerCalo = snack ? targetCalories * 0.25: targetCalories * 0.3
    const idealSnackfastCalo = snack ? targetCalories * 0.15 : 0

    const breakfast = await getBreakfast(idealBreakfastCalo)
    const lunch = await getLaunchDinner(idealLunchCalo)
    const dinner = await getLaunchDinner(idealDinnerCalo)
    let snackMeal = snack ? await getSnack(idealSnackfastCalo): null
    
    // console.log(breakfast)
    // console.log(lunch)
    // console.log('total breakfast calorie: ' + calculateCalories(breakfast) + 'vs ideal: ' + idealBreakfastCalo)
    // console.log(lunch)
    // console.log('total lunch calorie: ' + calculateCalories(lunch) + 'vs ideal: ' + idealLunchCalo) 
    // console.log(dinner)
    // console.log('total dinner calorie: ' + calculateCalories(dinner) + 'vs ideal: ' + idealDinnerCalo)
    // console.log(`total calo day: ${calculateCalories(breakfast) + calculateCalories(lunch) + calculateCalories(dinner)} vs total ideal: 1800`)
    const mealPlan = snack 
    ? 
        [
            {
                name: 'breakfast',
                dishes: breakfast,
                calo: calculateCalories(breakfast)
            },
            {
                name: 'lunch',
                dishes: lunch,
                calo: calculateCalories(lunch)
            },
            {
                name: 'dinner',
                dishes: dinner,
                calo: calculateCalories(dinner)
            },
            {
                name: 'snack',
                dishes: snackMeal,
                calo: calculateCalories(snackMeal)
            },
        ]
    :
        [
            {
                name: 'breakfast',
                dishes: breakfast,
                calo: calculateCalories(breakfast)
            },
            {
                name: 'lunch',
                dishes: lunch,
                calo: calculateCalories(lunch)
            },
            {
                name: 'dinner',
                dishes: dinner,
                calo: calculateCalories(dinner)
            },
        ]

    const returnMeals = mealPlan.map((m) => {
        return {
            name: m.name, 
            dishes: m.dishes.map((mm) => {
                return {
                    id: mm.dish._id,
                    amount: mm.amount
                }
            })
        }
    })

    // console.log(returnMeals)

    return {
        date: getDateAfterDays(index),
        meals: returnMeals,
        calo:  calculateCalories(breakfast) + calculateCalories(lunch) + calculateCalories(dinner) + (snack ? calculateCalories(snackMeal) : 0),
        protein:  calculateProtein(breakfast) + calculateProtein(lunch) + calculateProtein(dinner) + (snack ? calculateProtein(snackMeal) : 0),
        lipit:  calculateLipit(breakfast) + calculateLipit(lunch) + calculateLipit(dinner) + (snack ? calculateLipit(snackMeal) : 0),
        carbohydrat:  calculateCarbohydrat(breakfast) + calculateCarbohydrat(lunch) + calculateCarbohydrat(dinner) + (snack ? calculateCarbohydrat(snackMeal) : 0),
        fiber:  calculateFiber(breakfast) + calculateFiber(lunch) + calculateFiber(dinner) + (snack ? calculateFiber(snackMeal) : 0),
    }
    // getBreakfast(idealBreakfastCalo)

}

const getSnack = async (targetCalories) => {
    const snackTypes = ['Chè', 'Hoa quả sấy', 'Khác', 'Món phụ', 'Sâm', 'Sữa', 'Sữa chua'];
    const snacksDishes = await getDishesByType(snackTypes)

    let nearestIdeal
    let nearestCaloIdeal = 9999
    let endLoop = false
    let countLoop = 0

    while (!endLoop && countLoop < 100) {
        const dish = snacksDishes[Math.floor(Math.random() * snacksDishes.length)];
        // console.log(dish)
        const caloGap = dish.calo - targetCalories
        if (Math.abs(caloGap) <75) {
            nearestIdeal = [{dish, amount: 1}]
            endLoop = true
        } else if (Math.abs(caloGap) < nearestCaloIdeal) {
            nearestCaloIdeal = Math.abs(caloGap)
            nearestIdeal = [{dish, amount: 1}]
        } 
        countLoop++
    }

    return nearestIdeal

}

const getLaunchDinner = async (targetCalories) => {
    const lunchDinnerTypes = ['Cơm', 'Canh', 'Rau, củ', 'Đậu', 'Chả', 'Chim', 'Gỏi', 'Hải sản', 'Thịt bò', 'Thịt gà', 'Thịt lợn', 'Trứng', 'Hoa quả', 'Món sợi, nước'];
    const specificRices = await getDishesByType(['Cơm suất'])
    const waterDishes = await getDishesByType(['Món sợi, nước'])

    const lunchDinnerDishes = await getDishesByType(lunchDinnerTypes)

    const breakfastExtraWater = await Dish.find({$or: [{ten: 'Nước cam vắt'}, {ten: 'Nước ép trái cây đóng hộp'}, {ten: 'Sinh tố'}, {ten: 'Nước sâm'}]})
    const fruits = await getDishesByType(['Hoa quả'])

    const additionFood = breakfastExtraWater.concat(fruits)
    // console.log(lunchDinnerDishes)
    const rice = lunchDinnerDishes.filter((e) => e.loai == "Cơm" && e.calo == 130)
    const meat = lunchDinnerDishes.filter((e) => ['Chả', 'Chim', 'Gỏi', 'Hải sản', 'Thịt bò', 'Thịt gà', 'Thịt lợn'].includes(e.loai))

    const only1Piece = lunchDinnerDishes.filter((e) => ['Chả', 'Chim', 'Gỏi', 'Hải sản', 'Thịt bò', 'Thịt gà', 'Thịt lợn'].includes(e.loai) && e.don_vi_tinh.includes('đĩa'))
    const max3Piece = lunchDinnerDishes.filter((e) => ['Chả', 'Chim', 'Gỏi', 'Hải sản', 'Thịt bò', 'Thịt gà', 'Thịt lợn'].includes(e.loai) && e.calo < 200 && !only1Piece.includes(e))
    const soup = lunchDinnerDishes.filter((e) => ['Canh', 'Rau, củ', 'Đậu'].includes(e.loai))

    const fruits_max_10 = fruits.filter((f) => f.calo <= 20)
    const fruits_max_3 = fruits.filter((f) => f.calo < 50 && f.calo > 20)
    const fruits_max_1 = fruits.filter((f) => f.calo > 50)


    let nearestIdeal
    let nearestCaloIdeal = 9999
    let endLoop = false
    let countLoop = 0
    
    while (!endLoop && countLoop < 100) {

        const randomNumber = Math.floor(Math.random() * 10) + 1

        if (randomNumber == 1) {
            const dish = specificRices[Math.floor(Math.random() * specificRices.length)];
            // console.log(dish)
            const caloGap = dish.calo - targetCalories
            if (Math.abs(caloGap) <75) {
                nearestIdeal = [{dish, amount: 1}]
                endLoop = true
            } else if (caloGap < 0) {
                let endChildLoop = false
                let countChildLoop = 0
                if (Math.abs(caloGap) < nearestCaloIdeal) {
                    nearestCaloIdeal = Math.abs(caloGap)
                    nearestIdeal = [{dish, amount: 1}]    
                }
                while (!endChildLoop && countChildLoop < 15) {
                    
                    const water = additionFood[Math.floor(Math.random() * additionFood.length)];
                    const secondCaloGap = Math.abs(water.calo + dish.calo - targetCalories)
                    if (secondCaloGap <75) {
                        nearestIdeal = [{dish, amount: 1}, {dish: water, amount: 1}]
                        endChildLoop = true
                        endLoop = true

                    } else {
                        if (secondCaloGap < nearestCaloIdeal) {
                            nearestCaloIdeal = secondCaloGap
                            nearestIdeal = [{dish, amount: 1}, {dish: water, amount: 1}]
                        }
                        countChildLoop++
                    }
                }

            } else if (Math.abs(caloGap) < nearestCaloIdeal) {
                nearestCaloIdeal = Math.abs(caloGap)
                nearestIdeal = [{dish, amount: 1}]
            }
        } else if (randomNumber == 2) {
            const dish = waterDishes[Math.floor(Math.random() * waterDishes.length)];
            // console.log(dish)
            const caloGap = dish.calo - targetCalories
            if (Math.abs(caloGap) <75) {
                nearestIdeal = [{dish, amount: 1}]
                endLoop = true
            } else if (caloGap < 0) {
                let endChildLoop = false
                let countChildLoop = 0
                if (Math.abs(caloGap) < nearestCaloIdeal) {
                    nearestCaloIdeal = Math.abs(caloGap)
                    nearestIdeal = [{dish, amount: 1}]    
                }
                while (!endChildLoop && countChildLoop < 15) {
                    
                    const water = additionFood[Math.floor(Math.random() * additionFood.length)];
                    const secondCaloGap = Math.abs(water.calo + dish.calo - targetCalories)
                    if (secondCaloGap <75) {
                        nearestIdeal = [{dish, amount: 1}, {dish: water, amount: 1}]
                        endChildLoop = true
                        endLoop = true

                    } else {
                        if (secondCaloGap < nearestCaloIdeal) {
                            nearestCaloIdeal = secondCaloGap
                            nearestIdeal = [{dish, amount: 1}, {dish: water, amount: 1}]
                        }
                        countChildLoop++
                    }
                }

            } else if (Math.abs(caloGap) < nearestCaloIdeal) {
                nearestCaloIdeal = Math.abs(caloGap)
                nearestIdeal = [{dish, amount: 1}]
            } 
        } else {
            const riceBow = rice[0]
            const riceCalo = riceBow.calo * 2

            const meatDish = only1Piece[Math.floor(Math.random() * only1Piece.length)];
            const secondMeatDish = max3Piece[Math.floor(Math.random() * max3Piece.length)];
            const secondMeatDishAmout = Math.floor(Math.random() * 3) + 1

            const soupBow =  soup[Math.floor(Math.random() * soup.length)]
            
            const mealCalo1 = riceCalo + meatDish.calo + soupBow.calo
            const mealCalo2 = riceCalo + secondMeatDish.calo * secondMeatDishAmout + soupBow.calo
            
            if (Math.abs(mealCalo1 - targetCalories) < Math.abs(mealCalo2 - targetCalories)) {
                if (Math.abs(mealCalo1 - targetCalories) <75) {
                    nearestIdeal = [{dish: meatDish, amount : 1}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                    endLoop = true
                } else {
                    let endChildLoop = false
                    let countChildLoop = 0
                    while (!endChildLoop && countChildLoop < 15) {
                        
                        const fruit = fruits[Math.floor(Math.random() * fruits.length)];
                        // console.log(`countLoop: ${countLoop}`)
                        // console.log(`countChildLoop: ${countChildLoop}`)
                        // console.log(`nearestCaloIdeal: ${nearestCaloIdeal}`)
                        if (fruits_max_10.includes(fruit)) {
                            const randomAmountFruit = Math.floor(Math.random() * (10 - 5 + 1)) + 5
                            const fruitCalo = fruit.calo * randomAmountFruit
                            if (Math.abs(mealCalo1 + fruitCalo - targetCalories) <75) {
                                endChildLoop = true
                                nearestIdeal = [{dish: meatDish, amount : 1}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}, {dish: fruit, amount: randomAmountFruit}]
                            } else if (Math.abs(mealCalo1 + fruitCalo - targetCalories) < nearestCaloIdeal) {
                                nearestCaloIdeal = Math.abs(mealCalo1 + fruitCalo - targetCalories) 
                                nearestIdeal = [{dish: meatDish, amount : 1}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}, {dish: fruit, amount: randomAmountFruit}]
                            }
                        } else if (fruits_max_3.includes(fruit)) {
                            const randomAmountFruit = Math.floor(Math.random() * 3) + 3
                            const fruitCalo = fruit.calo * randomAmountFruit
                            if (Math.abs(mealCalo1 + fruitCalo - targetCalories) <75) {
                                endChildLoop = true
                                nearestIdeal = [{dish: meatDish, amount : 1}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}, {dish: fruit, amount: randomAmountFruit}]
                            } else if (Math.abs(mealCalo1 + fruitCalo - targetCalories) < nearestCaloIdeal) {
                                nearestCaloIdeal = Math.abs(mealCalo1 + fruitCalo - targetCalories) 
                                nearestIdeal = [{dish: meatDish, amount : 1}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}, {dish: fruit, amount: randomAmountFruit}]
                            }
                        } else {
                            const randomAmountFruit = 1
                            const fruitCalo = fruit.calo * randomAmountFruit
                            if (Math.abs(mealCalo1 + fruitCalo - targetCalories) <75) {
                                endChildLoop = true
                                nearestIdeal = [{dish: meatDish, amount : 1}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}, {dish: fruit, amount: randomAmountFruit}]
                            } else if (Math.abs(mealCalo1 + fruitCalo - targetCalories) < nearestCaloIdeal) {
                                nearestCaloIdeal = Math.abs(mealCalo1 + fruitCalo - targetCalories) 
                                nearestIdeal = [{dish: meatDish, amount : 1}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}, {dish: fruit, amount: randomAmountFruit}]
                            }
                        }
                        countChildLoop++
                    }
                }
            } else {
                if (Math.abs(mealCalo2 - targetCalories) <75) {
                    nearestIdeal = [{dish: secondMeatDish, amount : secondMeatDishAmout}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                    endLoop = true
                } else {
                    let endChildLoop = false
                    let countChildLoop = 0
                    while (!endChildLoop && countChildLoop < 15) {
                        
                        // console.log(`countLoop: ${countLoop}`)
                        // console.log(`countChildLoop: ${countChildLoop}`)
                        // console.log(`nearestCaloIdeal: ${nearestCaloIdeal}`)
                        const fruit = fruits[Math.floor(Math.random() * fruits.length)];
                        if (fruits_max_10.includes(fruit)) {
                            const randomAmountFruit = Math.floor(Math.random() * (10 - 5 + 1)) + 5
                            const fruitCalo = fruit.calo * randomAmountFruit
                            if (Math.abs(mealCalo2 + fruitCalo - targetCalories) <75) {
                                endChildLoop = true
                                nearestIdeal = [{dish: secondMeatDish, amount : secondMeatDishAmout}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                            } else if (Math.abs(mealCalo2 + fruitCalo - targetCalories) < nearestCaloIdeal) {
                                nearestCaloIdeal = Math.abs(mealCalo2 + fruitCalo - targetCalories) 
                                nearestIdeal = [{dish: secondMeatDish, amount : secondMeatDishAmout}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                            }
                        } else if (fruits_max_3.includes(fruit)) {
                            const randomAmountFruit = Math.floor(Math.random() * 3) + 3
                            const fruitCalo = fruit.calo * randomAmountFruit
                            if (Math.abs(mealCalo2 + fruitCalo - targetCalories) <75) {
                                endChildLoop = true
                                nearestIdeal = [{dish: secondMeatDish, amount : secondMeatDishAmout}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                            } else if (Math.abs(mealCalo2 + fruitCalo - targetCalories) < nearestCaloIdeal) {
                                nearestCaloIdeal = Math.abs(mealCalo2 + fruitCalo - targetCalories) 
                                nearestIdeal = [{dish: secondMeatDish, amount : secondMeatDishAmout}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                            }
                        } else {
                            const randomAmountFruit = 1
                            const fruitCalo = fruit.calo * randomAmountFruit
                            if (Math.abs(mealCalo2 + fruitCalo - targetCalories) <75) {
                                endChildLoop = true
                                nearestIdeal = [{dish: secondMeatDish, amount : secondMeatDishAmout}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                            } else if (Math.abs(mealCalo2 + fruitCalo - targetCalories) < nearestCaloIdeal) {
                                nearestCaloIdeal = Math.abs(mealCalo2 + fruitCalo - targetCalories) 
                                nearestIdeal = [{dish: secondMeatDish, amount : secondMeatDishAmout}, {dish: riceBow, amount: 2}, {dish: soupBow, amount: 1}]
                            }
                            countChildLoop++
                        }
                    }
                }
            }

            
        }
        countLoop++
    }

    return nearestIdeal

}


const getBreakfast = async (targetCalories) => {
    const breakfastTypes = ['Bánh', 'Bánh mì', 'Món sợi, nước', 'Xôi'];
    const breakfastExtraWater = await Dish.find({$or: [{ten: 'Cà phê đen phin'}, {ten: 'Cà phê sữa gói tan'}, {ten: 'Nước cam vắt'}, {ten: 'Nước ép trái cây đóng hộp'}, {ten: 'Nước ép trái cây đóng hộp'}, {ten: 'Nước rau má'}, {ten: 'Nước sâm'}]})
        // .then(response => {
        //     breakfastExtraWater = response
        // })
    const breakfastDishes = await getDishesByType(breakfastTypes);
    let nearestIdeal
    let nearestCaloIdeal = 9999
    let endLoop = false
    let countLoop = 0
    // console.log(breakfastExtraWater)
    while (!endLoop && countLoop < 50) {
        const dish = breakfastDishes[Math.floor(Math.random() * breakfastDishes.length)];
        // console.log(dish)
        const caloGap = dish.calo - targetCalories
        if (Math.abs(caloGap) <75) {
            nearestIdeal = [{dish, amount: 1}]
            endLoop = true
        } else if (caloGap < 0) {
            let endChildLoop = false
            let countChildLoop = 0
            if (Math.abs(caloGap) < nearestCaloIdeal) {
                nearestCaloIdeal = Math.abs(caloGap)
                nearestIdeal = [{dish, amount: 1}]    
            }
            while (!endChildLoop && countChildLoop < 20) {
                const water = breakfastExtraWater[Math.floor(Math.random() * breakfastExtraWater.length)];
                const secondCaloGap = Math.abs(water.calo + dish.calo - targetCalories)
                if (secondCaloGap <75) {
                    nearestIdeal = [{dish, amount: 1}, {dish: water, amount: 1}]
                    endChildLoop = true
                    endLoop = true

                } else {
                    if (secondCaloGap < nearestCaloIdeal) {
                        nearestCaloIdeal = secondCaloGap
                        nearestIdeal = [{dish, amount: 1}, {dish: water, amount: 1}]
                    }
                    countChildLoop++
                }
            }

            countLoop++
        } else if (Math.abs(caloGap) < nearestCaloIdeal) {
            nearestCaloIdeal = Math.abs(caloGap)
            nearestIdeal = [{dish, amount: 1}]
            countLoop++
        } else {
            countLoop ++
        }
    }
    // console.log(nearestIdeal)
    // console.log(nearestCaloIdeal)

    return nearestIdeal

}

// const breakfastTypes = ['Bánh', 'Bánh mì', 'Món sợi, nước', 'Nước', 'Xôi', 'Sữa'];
// const lunchDinnerTypes = ['Cơm', 'Canh', 'Rau, củ', 'Đậu', 'Chả', 'Chim', 'Gỏi', 'Hải sản', 'Thịt bò', 'Thịt gà', 'Thịt lợn', 'Trứng', 'Hoa quả', 'Món sợi, nước'];

const getDishesByType = async (types) => {
    return await Dish.find({ loai: { $in: types } });
};

const calculateCalories = (dishes) => {
    if (!dishes) {
        return 0
    }
    return dishes.reduce((total, dish) => {
        return total + (dish.dish.calo || 0) * (dish.amount || 1)
    }, 0);
};

const calculateFiber = (dishes) => {
    if (!dishes) {
        return 0
    }
    return dishes.reduce((total, dish) => {
        return total + (dish.dish.fiber || 0) * (dish.amount || 1)
    }, 0);
};

const calculateCarbohydrat = (dishes) => {
    if (!dishes) {
        return 0
    }
    return dishes.reduce((total, dish) => {
        return total + (dish.dish.protein || 0) * (dish.amount || 1)
    }, 0);
};

const calculateLipit = (dishes) => {
    if (!dishes) {
        return 0
    }
    return dishes.reduce((total, dish) => {
        return total + (dish.dish.lipit || 0) * (dish.amount || 1)
    }, 0);
};

const calculateProtein = (dishes) => {
    if (!dishes) {
        return 0
    }
    return dishes.reduce((total, dish) => {
        return total + (dish.dish.carbohydrat || 0) * (dish.amount || 1)
    }, 0);
};

const createMealPlan = async (targetCalories) => {
    const breakfastTypes = ['Bánh', 'Bánh mì', 'Món sợi, nước', 'Xôi', 'Sữa'];
    const lunchDinnerTypes = ['Cơm', 'Canh', 'Rau, củ', 'Đậu', 'Chả', 'Chim', 'Gỏi', 'Hải sản', 'Thịt bò', 'Thịt gà', 'Thịt lợn', 'Trứng', 'Hoa quả', 'Món sợi, nước', 'Cơm suất'];
    const snackTypes = ['Chè', 'Hoa quả sấy', 'Khác', 'Món phụ', 'Sâm', 'Sữa', 'Sữa chua'];

    const breakfastDishes = await getDishesByType(breakfastTypes);
    // console.log(breakfastDishes)
    const lunchDinnerDishes = await getDishesByType(lunchDinnerTypes);
    const snackDishes = await getDishesByType(snackTypes);



    const adjustCalories = (meal, targetCalories) => {
        let totalCalories = calculateCalories(meal);
        let attempts = 0;  // Thêm biến đếm số lần lặp để tránh vòng lặp vô hạn
        const maxAttempts = 50;  // Đặt giới hạn cho số lần lặp
    
        while (Math.abs(totalCalories - targetCalories) > targetCalories * 0.05 && attempts < maxAttempts) {
            if (totalCalories > targetCalories && meal.length > 1) {
                meal.pop();
            } else {
                // Chọn món ăn ngẫu nhiên để thêm vào, tránh việc lặp lại món cuối cùng quá nhiều
                const newDish = meal[Math.floor(Math.random() * meal.length)];
                meal.push({ ...newDish });
            }
            totalCalories = calculateCalories(meal);
            attempts++;
        }
    
        if (attempts === maxAttempts) {
            console.log('Unable to perfectly adjust calories to target within the limit of attempts.');
        }
    
        return meal;
    };

    const breakfastCalories = targetCalories * 0.15;
    const lunchCalories = targetCalories * 0.50;
    const dinnerCalories = targetCalories * 0.20;
    const snackCalories = targetCalories * 0.15;

    const breakfast = distributeDishes(breakfastDishes, breakfastCalories, 3);
    const snack = Math.random() > 0.5 ? distributeDishes(snackDishes, snackCalories, 3) : [];

    let adjustedBreakfastCalories = breakfastCalories;
    let adjustedLunchCalories = lunchCalories;
    let adjustedDinnerCalories = dinnerCalories;
    let adjustedSnackCalories = snackCalories;

    if (snack.length === 0) {
        adjustedBreakfastCalories += targetCalories * 0.05;
        adjustedLunchCalories += targetCalories * 0.05;
        adjustedDinnerCalories += targetCalories * 0.05;
    }

    const lunch = generateLunchDinner(lunchDinnerDishes, adjustedLunchCalories);
    const dinner = generateLunchDinner(lunchDinnerDishes, adjustedDinnerCalories);

    return {
        breakfast: adjustCalories(breakfast, adjustedBreakfastCalories),
        lunch: adjustCalories(lunch, adjustedLunchCalories),
        dinner: adjustCalories(dinner, adjustedDinnerCalories),
        snack: adjustCalories(snack, adjustedSnackCalories)
    };
};

const getRandomDishes = (dishes, count) => {
    const shuffled = dishes.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const distributeDishes = (dishes, targetCalories, maxItems) => {
    let totalCalories = 0;
    const selectedDishes = [];
    while (totalCalories < targetCalories && selectedDishes.length < maxItems) {
        const dish = dishes[Math.floor(Math.random() * dishes.length)];
        const dishCalories = dish.calo || 0;
        const dishCount = Math.max(1, Math.floor((targetCalories - totalCalories) / dishCalories));
        const dishWithQuantity = { ...dish, quantity: dishCount };
        // const dishWithQuantity = { ...dish._doc, quantity: dishCount };
        selectedDishes.push(dishWithQuantity);
        totalCalories += dishCalories * dishCount;
    }
    return selectedDishes;
};

const generateLunchDinner = (dishes, targetCalories) => {
    const options = ['Món sợi, nước', 'Cơm suất', 'Kết hợp'];
    const option = options[Math.floor(Math.random() * options.length)];

    if (option === 'Món sợi, nước') {
        return distributeDishes(dishes.filter(dish => dish.loai === 'Món sợi, nước'), targetCalories, 1);
    } else if (option === 'Cơm suất') {
        return distributeDishes(dishes.filter(dish => dish.loai === 'Cơm suất'), targetCalories, 1);
    } else {
        // const rice = getRandomDishes(dishes.filter(dish => dish.loai === 'Cơm'), 1);
        // const vegetable = getRandomDishes(dishes.filter(dish => ['Canh', 'Rau, củ', 'Đậu'].includes(dish.loai)), 1);
        // const main = getRandomDishes(dishes.filter(dish => ['Chả', 'Chim', 'Gỏi', 'Hải sản', 'Thịt bò', 'Thịt gà', 'Thịt lợn', 'Trứng'].includes(dish.loai)), 1);
        // const fruit = Math.random() > 0.5 ? getRandomDishes(dishes.filter(dish => dish.loai === 'Hoa quả'), 1) : [];
        const rice = distributeDishes(dishes.filter(dish => dish.loai === 'cơm'), targetCalories * 0.4, 1);
        const vegetable = distributeDishes(dishes.filter(dish => ['canh', 'rau, củ', 'đậu'].includes(dish.loai)), targetCalories * 0.2, 1);
        const main = distributeDishes(dishes.filter(dish => ['chả', 'chim', 'gỏi', 'hải sản', 'thịt bò', 'thịt gà', 'thịt lợn', 'trứng'].includes(dish.loai)), targetCalories * 0.3, 1);
        const fruit = Math.random() > 0.5 ? distributeDishes(dishes.filter(dish => dish.loai === 'hoa quả'), targetCalories * 0.1, 1) : [];
        return [...rice, ...vegetable, ...main, ...fruit];
    }
};

const calculateTotalDailyCalories = (mealPlan) => {
    const breakfastCalories = calculateCalories(mealPlan.breakfast);
    const lunchCalories = calculateCalories(mealPlan.lunch);
    const dinnerCalories = calculateCalories(mealPlan.dinner);
    const snackCalories = calculateCalories(mealPlan.snack);

    const totalDailyCalories = breakfastCalories + lunchCalories + dinnerCalories + snackCalories;

    return {
        breakfastCalories,
        lunchCalories,
        dinnerCalories,
        snackCalories,
        totalDailyCalories
    };
};

// ------------------------------------------------------------------------------------------------


const getStrengthDurations = (todayWorkoutExs) => {
    let durations = 0
    todayWorkoutExs.forEach((ex) => {
        durations += ex.duration * 3
    })
    return durations
}

const getFlexCalorie = (todayWorkoutExs, weight) => {
    let calo = 0
    todayWorkoutExs.forEach((ex) => {
        calo += ex.duration / 60 * ex.met * weight
    })
    return calo
}

const getStrengthCalorie = (todayWorkoutExs, weight) => {
    let calo = 0
    todayWorkoutExs.forEach((ex) => {
        calo += (ex.duration * 3)/60 * ex.met * weight
    })
    return calo
}


function getRandom25El(flexEx) {
    if (flexEx.length < 25) {
        throw new Error("Mảng phải có ít nhất 25 phần tử.");
    }
    const tempEx = []
    var ketQuaNgauNhien = [];
    
    let i = 0
    while (i < 25) {
        var index = Math.floor(Math.random() * flexEx.length);
        if (!tempEx.includes(flexEx[index])) {
            ketQuaNgauNhien.push(flexEx[index]);
            tempEx.push(flexEx[index])
            i++
        }
    }
    // for (var i = 0; i < 25; i++) {
        
    // }
    
    return ketQuaNgauNhien;
}

function getRandom5El(gyms) {
    var ketQuaNgauNhien = [];
    
    for (var i = 0; i < 5; i++) {
        var index = Math.floor(Math.random() * gyms.length);
        ketQuaNgauNhien.push(gyms[index]);
        gyms.splice(index, 1);
        if (gyms.length == 0) {
            break
        }
    }
    
    return ketQuaNgauNhien;
}

const getTodayWorkoutGroup = (day) => {
    switch (day % 5){
        case 0: return 'back'
        case 1: return 'arm'
        case 2: return 'chest' 
        case 3: return 'hip-leg'
        case 4: return 'shoulder'
        // case 5: return 'abs'
    }
}

function getDateAfterDays(days) {
    const currentDate = new Date();
    const resultDate = new Date(currentDate);
    resultDate.setDate(currentDate.getDate() + days);
    return resultDate;
}

function getRandomElement(arr) {
    if (arr.length === 0) {
        throw new Error("Array is empty");
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

const generateExDay = (x) => {
    switch (x){
        case 1: return [true, false, false, false, false, false, false,]
        case 2: return [true, false, true, false, false, false, false,]
        case 3: return [true, false, true, false, true, false, false,]
        case 4: return [true, false, true, false, true, false, true,]
        case 5: return [true, true, true, false, true, false, true,]
        case 6: return [true, true, true, true, true, true, false,]
        case 7: return [true, true, true, true, true, true, true,]
    }
}

const getAvailableExercises = async (types) => {
    const query = types.map(type => {
        return {
            type: type
        }
    })
    let result

    await Exercises.find({$or: query})
    .then(response => {
        result = response
    })
    return result
}

// 

const caloIntakeInWeeks = (amr, kgPerWeek, goal) => {
    const gain = goal == "gain-weight" ? true : false
    // averageCalo : calorie trung bình mỗi ngày cần để tăng/giảm/giữ cân
    const averageCalo = getSuggestCalo(amr, kgPerWeek, gain)
    if (gain) {
        return [averageCalo, averageCalo, averageCalo, averageCalo, averageCalo, averageCalo, averageCalo]
    } else {
        return [averageCalo, averageCalo * 0.8, averageCalo * 1.2, averageCalo, averageCalo * 0.8, averageCalo * 1.2, averageCalo]
    }
}

const getAMR = (gender, height, weight, age, baseActivity) => {
    const bmr = gender == "male" ? ( 10*weight + 6.25*height - 5*age + 5) : (10*weight + 6.25*height - 5*age - 161)
    console.log(bmr * baseActivity)
    return bmr * baseActivity 

}

const getSuggestCalo = (amr, kgPerWeek, gain) => {
    const w_amr = amr * 7
    const w_different = KgToCalorie(kgPerWeek)
    if (gain) {
        return Number(((w_amr + w_different) / 7).toFixed(0))
    } else {
        return Number(((w_amr - w_different) / 7).toFixed(0))
    }

}

const KgToCalorie = (kg) => {
    return kg * 7716.179176
}

module.exports = {
    generateSchedule
}