const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { default: mongoose } = require('mongoose')

const register = (req, res, next) => {
    bcrypt.hash(req.body.password, 10, function(err, hashedPass) {
        if (err) {
            res.json ({
                error: err
            })
        }
        let user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: hashedPass,
            role: req.body.role
        })
        if (!user.name || !user.email || !user.password || !user.password) { 

        }
        user.save()
        .then(user => {
            console.log(user.name)
            res.json({
                message: 'User Added Successfully!',
                success: true
            })
        })
        .catch(err => {
            res.json({
                message: 'An error occured!'
            })
        })
    }) 
}

const login = (req, res, next) => {
    var username = req.body.username
    var password = req.body.password

    User.findOne({$or: [{email: username}, {phone: username}]})
    .then(user => {
        if (user) {
            bcrypt.compare(password, user.password, function(err, result) {
                if (err) {
                    res.json ({
                        error: err
                    })
                }
                if (result) {
                    let token = jwt.sign({name: user.name}, 'Quanlhn22012002', {expiresIn: '30s'})
                    let refreshToken = jwt.sign({name: user.name}, 'refreshtokensecret', {expiresIn: '48h'})
                    console.log(user)
                    res.json({
                        message: 'Login Successfully!',
                        token,
                        refreshToken,
                        success: true,
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        schedule: user.schedule,
                        gender: user.gender,
                        birth: user.birth
                    })
                } else {
                    res.json({
                        message: 'Password does not matched!',
                        success: false
                    })
                }
            })
        } else {
            res.json({
                message: "No user found!",
                success: false
            })
        }
    })
}

const refreshToken = (req, res, next) => {
    const refreshToken = req.body.refreshToken
    jwt.verify(refreshToken,'refreshtokensecret', (err, decoded) => {
      if (err) {
        res.status(400).json ({
            err
        })
      } else {
        let token = jwt.sign({name: decoded.name}, 'Quanlhn22012002', {expiresIn: '30s'})
        let refreshToken = req.body.refreshToken
        res.status(200).json({
            message: 'Token refreshed successfully!',
            token,
            refreshToken
        })
      }  
    })
}

const logout = async (req, res, next) => {
    try {
      res.clearCookie("refreshtoken");
      return res.status(204);
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
}

const deleteUser = (req, res, next) => {
    const userID = req.body.id
    User.findByIdAndDelete(userID)
    .then(response => {
        res.json({
            message: 'User Deleted!'
        })
    })
    .catch(err => {
        res.json({
            message: "An error occurred!"
        })
    })
}

const updateUser = (req, res, next) => {
    let userID = req.body.userID
    let updatedData = {
        name: req.body.name,
        phone: req.body.phone,
        gender: req.body.gender,
        birth: req.body.birth,
        email: req.body.email,
        orders: req.body.orders,
        cartDrawer: req.body.cartDrawer,
    }
    console.log(updatedData)
    User.findByIdAndUpdate(userID, {$set: updatedData})
    .then(response => {
        res.json({
            message: 'User data updated Successfully!'
        })
    })
    .catch(error => {
        res.json({
            message: 'An error occured!'
        })
    })
}





module.exports = {
    register, login, refreshToken, deleteUser, updateUser, logout
}