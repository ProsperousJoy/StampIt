const express = require('express')
const { createTask, updateTaskStatus, getUserTasks } = require('../controllers/taskController')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/tasks', authMiddleware, createTask)
router.put('/tasks/:taskId', authMiddleware, updateTaskStatus)
router.get('/tasks', authMiddleware, getUserTasks)

module.exports = router
