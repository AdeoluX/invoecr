const Joi = require("joi");

const createCustomerSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    "string.empty": "Customer name is required",
    "string.min": "Customer name must be at least 2 characters",
    "string.max": "Customer name must not exceed 100 characters",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),
  phone: Joi.string().optional().pattern(/^[\+]?[1-9][\d]{0,15}$/).messages({
    "string.pattern.base": "Please provide a valid phone number",
  }),
  address: Joi.string().optional().max(500).messages({
    "string.max": "Address must not exceed 500 characters",
  }),
  companyName: Joi.string().optional().max(100).messages({
    "string.max": "Company name must not exceed 100 characters",
  }),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Customer name must be at least 2 characters",
    "string.max": "Customer name must not exceed 100 characters",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),
  phone: Joi.string().optional().pattern(/^[\+]?[1-9][\d]{0,15}$/).messages({
    "string.pattern.base": "Please provide a valid phone number",
  }),
  address: Joi.string().optional().max(500).messages({
    "string.max": "Address must not exceed 500 characters",
  }),
  companyName: Joi.string().optional().max(100).messages({
    "string.max": "Company name must not exceed 100 characters",
  }),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
