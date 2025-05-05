const mongoose = require('mongoose')

const SosSchema = new mongoose.Schema({
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
  }
}, { timestamps: true })

module.exports = mongoose.model('sosraised', SosSchema)