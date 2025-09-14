const catchAsync = require("../utils/catchAsync");
const { CustomerService } = require("../services");
const { successResponse } = require("../utils/responder");

class CustomerController {
  // Create a new customer
  static createCustomer = catchAsync(async (req, res, next) => {
    const customerData = req.body;
    const user = req.user;
    const customer = await CustomerService.createCustomer(customerData, user.id);
    return successResponse(req, res, customer);
  });

  // Get all customers for the authenticated entity
  static getAllCustomers = catchAsync(async (req, res, next) => {
    const user = req.user;
    const query = req.query;
    const customers = await CustomerService.getAllCustomers(user.id, query);
    return successResponse(req, res, customers);
  });

  // Get a single customer by ID
  static getCustomerById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    const customer = await CustomerService.getCustomerById(id, user.id);
    return successResponse(req, res, customer);
  });

  // Update a customer by ID
  static updateCustomer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const customerData = req.body;
    const user = req.user;
    const customer = await CustomerService.updateCustomer(id, customerData, user.id);
    return successResponse(req, res, customer);
  });

  // Delete a customer by ID
  static deleteCustomer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    await CustomerService.deleteCustomer(id, user.id);
    return successResponse(req, res, { message: "Customer deleted successfully" });
  });
}

module.exports = {
  CustomerController,
};
