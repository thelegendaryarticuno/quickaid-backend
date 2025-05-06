const express = require('express')
const router = express.Router()
const User = require('../db/schemas/UserSchema')
const twilio = require('twilio')
const bcrypt = require('bcryptjs')

// Replace with your Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE
const client = twilio(accountSid, authToken)

// Helper to generate 6-digit userId
const generateUserId = async () => {
  while (true) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const existing = await User.findOne({ userId: code })
    if (!existing) return code
  }
}

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// In-memory store for OTPs (for demo, use Redis or DB for production)
const otpStore = {}

// Route to handle onboarding (send OTP)
router.post('/onboard', async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' })

    let user = await User.findOne({ phone })
    const otp = generateOTP()
    otpStore[phone] = otp

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP for QuickAid onboarding is: ${otp}`,
      from: twilioPhone,
      to: `+91${phone}`
    })

    if (user) {
      return res.status(200).json({ success: true, userType: 'existingUser' })
    } else {
      return res.status(200).json({ success: true, userType: 'newUser' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Route to verify OTP and create user if new, only phone and otp are required
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' })

    if (otpStore[phone] !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    let user = await User.findOne({ phone })
    let userType
    let userId
    let responseData = { success: true }

    if (!user) {
      // Create new user with only phone and generated userId
      userId = await generateUserId()
      user = await User.create({
        userId,
        phone,
      })
      responseData.userType = 'newUser'
      responseData.userId = userId
    } else {
      responseData.userType = 'existingUser'
      responseData.userId = user.userId
      responseData.userName = user.name
    }
    
    // Remove OTP after verification
    delete otpStore[phone]
    res.status(200).json(responseData)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
// Route to update name by userId
router.post('/:userId/name=:name', async (req, res) => {
  try {
    const { userId, name } = req.params
    const user = await User.findOneAndUpdate(
      { userId },
      { name },
      { new: true }
    )
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({ success: true, message: 'Name updated', data: { userId, name: user.name } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Route to get user details by userId
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('-_id -__v')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/authorize', async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password required' })
    }

    let user = await User.findOne({ phone })
    let responseData = { success: true }

    if (user) {
      // If password field is missing or empty, update it
      if (!user.password) {
        user.password = await bcrypt.hash(password, 10)
        await user.save()
        responseData.userType = 'existingUser'
        responseData.userId = user.userId
        responseData.userName = user.name
        return res.status(200).json(responseData)
      }
      // If password exists, compare
      const isMatch = await bcrypt.compare(password, user.password)
      if (isMatch) {
        responseData.userType = 'existingUser'
        responseData.userId = user.userId
        responseData.userName = user.name
        return res.status(200).json(responseData)
      } else {
        return res.status(401).json({ success: false, message: 'Invalid password' })
      }
    } else {
      // Create new user with phone and password
      const userId = await generateUserId()
      const hashedPassword = await bcrypt.hash(password, 10)
      user = await User.create({
        userId,
        phone,
        password: hashedPassword
      })
      responseData.userType = 'newUser'
      responseData.userId = userId
      return res.status(200).json(responseData)
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router