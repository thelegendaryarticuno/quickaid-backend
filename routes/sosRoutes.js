const express = require('express')
const router = express.Router()
const Sos = require('../db/schemas/SosSchema')

// POST route to save SOS data
router.post('/raisesos', async (req, res) => {
    try {
        const sosData = await Sos.create(req.body)
        res.status(201).json({ success: true, message: 'SOS data saved successfully'})
    } catch (error) {
        res.status(400).json({ success: false, error: error.message })
    }
})

// GET route to retrieve SOS data by userId
router.get('/getsos/:userId', async (req, res) => {
    try {
        const sosData = await Sos.find({ UserId: req.params.userId })
        if (!sosData) {
            return res.status(404).json({ success: false, message: 'No SOS data found for this user' })
        }
        res.status(200).json({ success: true, data: sosData })
    } catch (error) {
        res.status(400).json({ success: false, error: error.message })
    }
})

module.exports = router