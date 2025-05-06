const express = require('express')
const connectDb = require('./db/connect')
const sosRoutes = require('./routes/sosRoutes')
const volunteerRoutes = require('./routes/volunteerRoutes')
const userRoutes = require('./routes/userRoutes')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const PORT = 5000  // Move PORT declaration to the top

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Make io accessible to routes
app.set('io', io)

// Routes
app.use('/victim/sos', sosRoutes)
app.use('/volunteer', volunteerRoutes)
app.use('/user', userRoutes)

// Socket connection handling
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id)

  socket.on('join-volunteer-room', (volunteerID) => {
    socket.join('volunteers')
    console.log('Volunteer joined room:', volunteerID)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

const startServer = async () => {
  try {
    await connectDb()
    console.log('Successfully connected to database')
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to connect to database:', error)
    process.exit(1)
  }
}

startServer()
