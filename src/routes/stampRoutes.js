const express = require('express')
const { getUserStamps, getStampQuotes } = require('../controllers/stampController')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

// Route to get user stamps, protected by authentication middleware
router.get('/stamps', authMiddleware, getUserStamps)

module.exports = router
