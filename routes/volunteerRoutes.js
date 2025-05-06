const express = require('express')
const router = express.Router()
const Volunteer = require('../db/schemas/VolunteerSchema')
const jwt = require('jsonwebtoken')
const Sos = require('../db/schemas/SosSchema')
const User = require('../db/schemas/UserSchema')

// Helper function to generate unique 6-digit code
const generateVolunteerID = async () => {
  while (true) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const existingVolunteer = await Volunteer.findOne({ volunteerID: code })
    if (!existingVolunteer) return code
  }
}

router.post('/signup', async (req, res) => {
  try {
    const { name, phone, password, skills, location, idProof, address } = req.body
    const existingVolunteer = await Volunteer.findOne({ phone })
    if (existingVolunteer) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' })
    }

    const volunteerID = await generateVolunteerID()

    const volunteer = await Volunteer.create({
      volunteerID,
      name,
      phone,
      password,
      skills,
      idProof,
      address,
      location
    })

    const token = jwt.sign(
      { id: volunteer._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      success: true,
      volunteerID: volunteer.volunteerID,
      token
    })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    const volunteer = await Volunteer.findOne({ phone })
    if (!volunteer || !(await volunteer.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    const token = jwt.sign(
      { id: volunteer._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(200).json({
      success: true,
      volunteerID: volunteer.volunteerID,
      token
    })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/status/:volunteerId', async (req, res) => {
  try {
    const { volunteerId } = req.params

    // Find all SOS where this volunteer is the attendee
    const sosRequests = await Sos.find({ sosAtendee: volunteerId })

    let newStatus = 'inactive'
    if (sosRequests.some(sos => sos.sosStatus === 'ongoing')) {
      newStatus = 'active'
    }

    const volunteer = await Volunteer.findOneAndUpdate(
      { volunteerID: volunteerId },
      { volunteerStatus: newStatus },
      { new: true }
    )

    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found' })
    }

    res.status(200).json({ success: true, volunteerStatus: volunteer.volunteerStatus })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/sosSearch/:volunteerId', async (req, res) => {
  try {
    const { volunteerId } = req.params
    // Find ongoing SOS where this volunteer is the attendee
    const sos = await Sos.findOne({ sosAtendee: volunteerId, sosStatus: 'ongoing' })
    if (!sos) {
      return res.status(404).json({ success: false, message: 'No ongoing SOS found for this volunteer' })
    }
    // Fetch user details
    const user = await User.findOne({ userId: sos.UserId })
    res.status(200).json({
      success: true,
      data: {
        type: sos.emergencyType,
        sosId: sos.sosId,
        address: sos.address,
        location: sos.location,
        name: user ? user.name : '',
        phone: user ? user.phone : ''
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
module.exports = router