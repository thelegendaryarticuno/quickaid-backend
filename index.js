const express = require('express')
const connectDb = require('./db/connect')
const sosRoutes = require('./routes/sosRoutes')
const cors = require('cors')

const app = express()

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Routes
app.use('/victim/sos', sosRoutes)

const PORT = 5000

const startServer = async () => {
  try {
    await connectDb()
    console.log('Successfully connected to database')
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to connect to database:', error)
    process.exit(1)
  }
}

startServer()
