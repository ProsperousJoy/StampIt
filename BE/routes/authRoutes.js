const express = require('express')
const { register, login } = require('../controllers/authController')
const { body } = require('express-validator')

const router = express.Router()

router.post('/register', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register)

router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password is required')
], login)

module.exports = router