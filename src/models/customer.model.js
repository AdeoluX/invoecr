var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto'); // Assuming you're using Node's built-in crypto module

var customerSchema = new Schema({
  code: {
    type: Schema.Types.UUID, // You can also use Schema.Types.String if UUIDs are stored as strings
    default: function() {
      return 'cus_' + crypto.randomUUID(); // Replaced arrow function with a regular function
    }
  },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  companyName: { type: String },
  entity: {
    type: Schema.Types.UUID,
    ref: 'Entity'
  }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
