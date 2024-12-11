const express = require('express')
const authRoutes = require('./routes/authRoutes')
const taskRoutes = require('./routes/taskRoutes')
const stampRoutes = require('./routes/stampRoutes')
const bodyParser = require('body-parser')
const cors = require('cors');

const app = express()

// Middlewares
app.use(bodyParser.json(), cors())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/', taskRoutes)
app.use('/api', stampRoutes)

// Listening
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})