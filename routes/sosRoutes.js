const express = require('express')
const router = express.Router()
const Sos = require('../db/schemas/SosSchema')
const axios = require('axios')
const Volunteer = require('../db/schemas/VolunteerSchema')

router.post('/raisesos', async (req, res) => {
  try {
    // Generate a unique sosId (6-digit code)
    let sosId
    while (true) {
      sosId = Math.floor(100000 + Math.random() * 900000).toString()
      const existing = await Sos.findOne({ sosId })
      if (!existing) break
    }

    // Attach sosId, sosStatus, sosAtendee to the data
    const sosData = await Sos.create({
      ...req.body,
      sosId,
      sosStatus: 'unattended',
      sosAtendee: null
    })

    // Fetch user details for name and address
    let userName = ''
    let userAddress = ''
    try {
      const userRes = await axios.get(
        `${process.env.BACKEND_BASE_URL || 'http://localhost:5000'}/user/${sosData.UserId}`
      )
      if (userRes.data && userRes.data.success && userRes.data.data) {
        userName = userRes.data.data.name || ''
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err.message)
    }

    // Emit to all connected volunteers
    const io = req.app.get('io')
    if (io) {
      io.to('volunteers').emit('sos-alert', {
        sosId: sosData.sosId,
        type: sosData.emergencyType,
        address: sosData.address, // Always use the address from the SOS payload
        name: userName
      })
      console.log(userName, sosData.address)
      console.log('SOS alert emitted to volunteers')
    } else {
      console.error('Socket.IO instance not found')
    }

    res.status(201).json({ success: true, data: sosData })
  } catch (error) {
    console.error('SOS Creation Error:', error)
    res.status(400).json({ success: false, error: error.message })
  }
})
router.get('/getsos/:userId', async (req, res) => {
  try {
    const sosData = await Sos.find({ UserId: req.params.userId })
    if (!sosData) {
      return res.status(404).json({ success: false, message: 'No SOS data found for this user' })
    }

    // For each SOS, fetch the volunteer's name if sosAtendee exists
    const sosWithVolunteerName = await Promise.all(
      sosData.map(async (sos) => {
        let volunteerName = ''
        if (sos.sosAtendee) {
          const volunteer = await Volunteer.findOne({ volunteerID: sos.sosAtendee })
          volunteerName = volunteer ? volunteer.name : ''
        }
        return {
          ...sos.toObject(),
          volunteerName
        }
      })
    )

    res.status(200).json({ success: true, data: sosWithVolunteerName })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/:sosid/accept', async (req, res) => {
  try {
    const { volunteerId } = req.body
    const { sosid } = req.params
    const sos = await Sos.findOne({ sosId: sosid })
    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' })
    }
    if (sos.sosStatus !== 'unattended') {
      return res.status(409).json({ success: false, message: 'SOS already accepted or completed' })
    }
    sos.sosStatus = 'ongoing'
    sos.sosAtendee = volunteerId
    await sos.save()
    const io = req.app.get('io')
    if (io) {
      io.to('volunteers').emit('sos-removed', { sosId: sosid })
    }
    const User = require('../db/schemas/UserSchema')
    const user = await User.findOne({ userId: sos.UserId })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({ success: true, phone: user.phone })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:sosId/completed', async (req, res) => {
  try {
    const { sosId } = req.params
    const sos = await Sos.findOneAndUpdate(
      { sosId },
      { sosStatus: 'completed' },
      { new: true }
    )
    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' })
    }
    res.status(200).json({ success: true, message: 'SOS marked as completed', data: sos })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/sos/recent', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' })
    }
    const sosList = await Sos.find({ UserId: userId }).sort({ createdAt: -1 })
    if (!sosList || sosList.length === 0) {
      return res.status(200).json({ success: true, data: [] })
    }
    const recentSos = sosList[0]
    const now = new Date()
    const sosTime = new Date(recentSos.createdAt)
    const diffMs = now - sosTime
    const diffMins = Math.floor(diffMs / 60000)

    res.status(200).json({
      success: true,
      data: [{
        type: recentSos.emergencyType,
        sosStatus: recentSos.sosStatus,
        timeGapMinutes: diffMins
      }]
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router