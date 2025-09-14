const Customer = require("../models/customer.model");

class CustomerRepository {
  async create(data) {
    const customer = new Customer(data);
    return await customer.save();
  }

  async find({ query = {}, sort = {}, limit = 0, skip = 0 }) {
    return await Customer.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate("entity", "name email");
  }

  async findOne({ query = {} }) {
    return await Customer.findOne(query).populate("entity", "name email");
  }

  async findOneAndUpdate(filter, update, options = {}) {
    return await Customer.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  async findOneAndDelete({ query = {} }) {
    return await Customer.findOneAndDelete(query);
  }

  async count(query = {}) {
    return await Customer.countDocuments(query);
  }

  async deleteMany(query = {}) {
    return await Customer.deleteMany(query);
  }
}

module.exports = new CustomerRepository();