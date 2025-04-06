const mongoose = require('mongoose');

const dbConnect = mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log('Connected to MongoDB'));

module.exports = dbConnect;