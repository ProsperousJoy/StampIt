const express = require('express')
const authRoutes = require('./routes/authRoutes')
const taskRoutes = require('./routes/taskRoutes')
const stampRoutes = require('./routes/stampRoutes')
const bodyParser = require('body-parser')

const app = express()

// Middleware to parse JSON requests
app.use(bodyParser.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api', stampRoutes)

// Test route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running, everything is working fine!')
})

// Start the server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})