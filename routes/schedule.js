const express = require('express')
const router = express.Router()

const ScheduleController = require('../controller/scheduleController')

router.post('/generateSchedule', ScheduleController.generateSchedule)



module.exports = router