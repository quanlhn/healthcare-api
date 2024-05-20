const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    password: {
        type: String
    },
    role: {
        type: String
    },
    schedule: {
        type: Schema.Types.ObjectId,
        ref: 'Schedule'
    },
    gender: {
        type: String
    },
    birth: {
        type: Date
    },
}, {timestamps: true})

const User = mongoose.model('User', userSchema)
module.exports = User
