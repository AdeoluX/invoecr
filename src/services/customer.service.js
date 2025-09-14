const customerRepository = require("../repo/customer.repo");

class CustomerService {
  // Create a new customer
  static async createCustomer(customerData, entityId) {
    const customer = await customerRepository.create({
      ...customerData,
      entity: entityId,
    });
    return customer;
  }

  // Get all customers for an entity
  static async getAllCustomers(entityId, query = {}) {
    const { page = 1, limit = 10, search } = query;
    
    const filter = { entity: entityId };
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await customerRepository.find({
      query: filter,
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await customerRepository.count(filter);

    return {
      customers,
      pagination: {
        total,
        page: parseInt(page),
        perPage: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1,
      },
    };
  }

  // Get a single customer by ID
  static async getCustomerById(customerId, entityId) {
    const customer = await customerRepository.findOne({
      query: { _id: customerId, entity: entityId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }

  // Update a customer by ID
  static async updateCustomer(customerId, customerData, entityId) {
    const customer = await customerRepository.findOneAndUpdate(
      { _id: customerId, entity: entityId },
      customerData,
      { new: true }
    );

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }

  // Delete a customer by ID
  static async deleteCustomer(customerId, entityId) {
    const customer = await customerRepository.findOneAndDelete({
      query: { _id: customerId, entity: entityId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }
}

module.exports = {
  CustomerService,
};
