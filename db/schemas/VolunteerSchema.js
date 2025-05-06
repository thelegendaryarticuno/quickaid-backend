const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const VolunteerSchema = new mongoose.Schema({
  volunteerID: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  skills: {
    type: [String],
    required: true
  },
  idProof: {
    type: String,
    required: true
  },
  address: {
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
  isVerified: {
    type: Boolean,
    default: false
  },
  volunteerStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  }
}, { timestamps: true })

VolunteerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

VolunteerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('Volunteer', VolunteerSchema)