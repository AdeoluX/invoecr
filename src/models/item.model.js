var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var itemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  total: {
    type: Number,
    required: true,
    default: function () {
      return this.unitPrice * this.quantity;
    }
  },
}, { _id: false });

module.exports = itemSchema; // Exported for reuse in Invoice
