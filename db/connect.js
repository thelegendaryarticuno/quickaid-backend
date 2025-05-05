const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

const connectDb = async () => {
  return mongoose.connect(process.env.MONGO_URI)
}

module.exports = connectDb
