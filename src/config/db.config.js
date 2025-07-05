const mongoose = require('mongoose');

const dbConnect = mongoose.connect(`mongodb+srv://juwontayo:${process.env.MONGO_DB_PASSWORD}@cluster0.gzpfkkr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'));

module.exports = dbConnect;