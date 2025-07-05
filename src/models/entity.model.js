var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto'); // Assuming you're using Node's built-in crypto module

var entitySchema = new Schema({
  code: {
    type: String, // You can also use Schema.Types.String if UUIDs are stored as strings
    default: function () {
      return 'ent_' + crypto.randomUUID().split('-').join('').slice(0, 15); // Replaced arrow function with a regular function
    }
  },
  parent_id: {
    type: String,
    ref: 'Entity',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  first_name: String,
  last_name: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true // helps with optional unique fields
  },
  password: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['business', 'staff'],
    required: true
  },
  logo: String,
  address: String,
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password; // Remove password field from the output
      return ret;
    }
  }
});

// Virtuals
entitySchema.virtual('staff', {
  ref: 'Entity',
  localField: '_id',
  foreignField: 'parent_id'
});

entitySchema.virtual('roleEntities', {
  ref: 'RoleEntity',
  localField: '_id',
  foreignField: 'entity_id',
  justOne: true
});

var Entity = mongoose.model('Entity', entitySchema);

module.exports = Entity;
