const express = require('express')
const connectDb = require('./db/connect')
const sosRoutes = require('./routes/sosRoutes')
const volunteerRoutes = require('./routes/volunteerRoutes')
const userRoutes = require('./routes/userRoutes')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const PORT = process.env.PORT || 5000

const app = express()
const server = http.createServer(app)

// Proper CORS setup
app.use(cors({
  origin: '*', // For development; replace with your frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json())

const io = new Server(server, {
  cors: {
    origin: '*', // For development; replace with your frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
})

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
      console.log(`Server is running`)
    })
  } catch (error) {
    console.error('Failed to connect to database:', error)
    process.exit(1)
  }
}

startServer()
