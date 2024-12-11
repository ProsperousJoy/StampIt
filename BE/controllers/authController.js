const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../../config/prisma')

module.exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    // Create initial stamp board for the user
    await prisma.stampBoard.create({
      data: {
        userId: user.id,
        period: 'WEEKLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
      }
    })

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })

    res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error during login' })
  }
}
