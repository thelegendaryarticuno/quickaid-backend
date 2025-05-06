const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: false
  },
  emergencycontact1: {
    type: String,
    required: false
  },
  emergencycontact1phone: {
    type: String,
    required: false
  },
  emergencycontact2: {
    type: String,
    required: false
  },
  emergencycontact2phone: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  }
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)