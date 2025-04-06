var mongoose = require('mongoose');
var itemSchema = require('./item.model'); // Assuming itemSchema is exported from './item.model'

var invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: mongoose.Schema.Types.UUID,
    default: function() {
      return 'inv_' + crypto.randomUUID(); // Adjusted to use a regular function instead of an arrow function
    }
  },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  entity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', required: true },
  items: [itemSchema],
  issueDate: { type: Date, required: true },
  dueDate: { type: Date },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  notes: { type: String },
  terms: { type: String },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: {
    type: Number,
    required: true,
    default: function() {
      return this.subtotal + this.tax; // Regular function expression for `default`
    }
  }
}, { timestamps: true });

// Pre-save hook
invoiceSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce(function(acc, item) {
    return acc + (item.price * item.quantity);
  }, 0);
  this.total = this.subtotal + this.tax;

  next();
});

// Pre-update hook
invoiceSchema.pre('findOneAndUpdate', function(next) {
  var update = this.getUpdate();
  if (update.items) {
    var subtotal = update.items.reduce(function(acc, item) {
      return acc + (item.price * item.quantity);
    }, 0);
    update.subtotal = subtotal;
    update.total = subtotal + (update.tax || 0);
  }

  next();
});

// Export the model
module.exports = mongoose.model('Invoice', invoiceSchema);
