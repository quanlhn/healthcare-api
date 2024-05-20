const express = require('express')
const router = express.Router()

const ScheduleController = require('../controller/scheduleController')

router.post('/generateSchedule', ScheduleController.generateSchedule)
router.post('/getSchedule', ScheduleController.getSchedule)



module.exports = router