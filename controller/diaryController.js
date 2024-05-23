const { response, query } = require('express')
const Exercises = require('../models/exercises')
const Diary = require('../models/diary')
const { ObjectId } = require('mongodb')

const addWorkoutToDiary = async (req, res, next) => {
    const {exercises, calo, date, userId} = req.body
    const newWorkoutExs = exercises.map((ex) => ({
        name: ex.name,
        type: ex.type,
        description: ex.description,
        muscleGroups: ex.muscleGroups,
        difficultyLevel: ex.difficultyLevel,
        duration: ex.duration,
        reps: ex.reps,
        imageUrl: ex.imageUrl,
        videoUrl: ex.videoUrl,
        category: ex.category,
        met: ex.met
    }))
    const diary = await Diary.updateOne(
        {$and:[ {"userId": userId}, {"type": 'workout'} ] },
        {
            $push: {days: {
                date: new Date(date),
                workoutExercises: newWorkoutExs,
                workoutCalories: calo,
                mealPlan: [],
            }}
        }
    )

    if (diary.matchedCount === 0) {
        const newDiary = new Diary({
            days: [{
                date: new Date(date),
                workoutExercises: newWorkoutExs,
                workoutCalories: calo,
                mealPlan: [],
            }],
            userId: userId,
            type: 'workout'
        })
        try {
            
            const saveDiary = await newDiary.save()
            res.json({
                saveDiary
            })
        } catch (err) {
            res.json({
                message: 'create diary failed'
            })
        }

    } else {
        
        res.json({diary})
    }
  

}

const addMealToDiary = async (req, res, next) => {
    const {
        foods,
        calo,
        date,
        userId,
        carbohydrat,
        lipit,
        protein,
        fiber,
    } = req.body
    const diary = await Diary.updateOne(
        {$and: [ {"userId": userId}, {"type": 'meal'} ] },
        {
            $push: {days: {
                date: new Date(date),
                workoutExercises: [],
                workoutCalories: calo,
                mealPlan: foods,
                carbohydrat,
                lipit,
                protein,
                fiber,
                calo
            }}
        }
    )

    if (diary.matchedCount === 0) {
        const newDiary = new Diary({
            days: [{
                date: new Date(date),
                workoutExercises: [],
                mealPlan: foods,
                carbohydrat,
                lipit,
                protein,
                fiber,
                calo
            }],
            userId: userId,
            type: 'meal'
        })
        try {
            
            const saveDiary = await newDiary.save()
            res.json({
                saveDiary
            })
        } catch (err) {
            res.json({
                message: 'create diary failed'
            })
        }
    } else {
        
        res.json({diary})
    }
  

}

const getDairyWorkout = (req, res, next) => {
    const userId = req.body.userId
    Diary.find({$and:[ {"userId": userId}, {"type": 'workout'} ] })
    .then(diaryWorkout => {
        res.json({
            diaryWorkout
        })
    })
    .catch((err) => {
        res.json({
            diaryWorkout: []
        })
    })
}

const getDairyMeal = (req, res, next) => {
    const userId = req.body.userId
    Diary.find({$and:[ {"userId": userId}, {"type": 'meal'} ] })
    .then(diaryMeals => {
        res.json({
            diaryMeals
        })
    })
    .catch((err) => {
        res.json({
            diaryMeals: []
        })
    })
}

module.exports = { addWorkoutToDiary, addMealToDiary, getDairyWorkout, getDairyMeal }