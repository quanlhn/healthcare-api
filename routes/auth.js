const express = require('express')
const router = express.Router()

const AuthController = require('../controller/AuthController')

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/refresh-token', AuthController.refreshToken)
router.post('/user/deleteUser', AuthController.deleteUser)
router.post('/user/updateUser', AuthController.updateUser)
router.post('/user/logout', AuthController.logout)


module.exports = router

