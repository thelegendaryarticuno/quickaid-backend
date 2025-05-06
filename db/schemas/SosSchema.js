const mongoose = require('mongoose')

const SosSchema = new mongoose.Schema({
  sosId: {
    type: String,
    unique: true,
    required: true
  },
  UserId: {
    type: String,
    required: true
  },
  emergencyType: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  authority: {
    type: [String],
    default: []
  },
  address: {
    type: String
  },
  sosStatus: {
    type: String,
    enum: ['unattended', 'ongoing', 'completed'],
    default: 'unattended'
  },
  sosAtendee: {
    type: String,
    default: null
  }
}, { timestamps: true })

module.exports = mongoose.model('sosraised', SosSchema)