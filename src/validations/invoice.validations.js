const Joi = require("joi");

const createInvoiceSchema = {
  body: Joi.object()
    .required()
    .keys({
      customer_id: Joi.string().optional(),
      currency: Joi.string().valid("USD", "EUR", "GBP", "NGN").default("NGN"),
      customer: Joi.object()
        .keys({
          name: Joi.string().required(),
          email: Joi.string().email().optional(),
          phone: Joi.string().optional(),
          address: Joi.string().optional(),
          companyName: Joi.string().optional(),
        })
        .optional(),
      items: Joi.array()
        .items(
          Joi.object().keys({
            description: Joi.string().required(),
            name: Joi.string().required(),
            quantity: Joi.number().required().min(1),
            unitPrice: Joi.number().required().min(0),
          })
        )
        .required(),
      issueDate: Joi.date().required(),
      dueDate: Joi.date().optional(),
      status: Joi.string()
        .valid("draft", "sent", "paid", "overdue")
        .default("draft"),
      notes: Joi.string().optional().allow(""),
      terms: Joi.string().optional().allow(""),
      subtotal: Joi.number().required().min(0),
      tax: Joi.number().optional().min(0).default(0),
    })
    .xor("customerId", "customer"),
  files: Joi.object()
    .optional()
    .keys({
      file: Joi.object()
        .optional()
        .keys({
          mimetype: Joi.string().valid("image/jpeg", "image/png").required(),
          size: Joi.number()
            .max(3 * 1024 * 1024)
            .required(), // 5MB limit
        }),
    })
    .optional(),
};

const updateInvoiceSchema = {
  body: Joi.object()
    .required()
    .keys({
      customerId: Joi.string().optional(),
      customer: Joi.object()
        .keys({
          name: Joi.string().optional(), // Optional for update
          email: Joi.string().email().optional(),
          phone: Joi.string().optional(),
        })
        .optional(),
      items: Joi.array()
        .items(
          Joi.object().keys({
            description: Joi.string().optional(), // Optional for update
            quantity: Joi.number().min(1).optional(),
            unitPrice: Joi.number().min(0).optional(),
          })
        )
        .optional(),
      issueDate: Joi.date().optional(),
      dueDate: Joi.date().optional(),
      status: Joi.string().valid("draft", "sent", "paid", "overdue").optional(),
      notes: Joi.string().optional().allow(""),
      terms: Joi.string().optional().allow(""),
      subtotal: Joi.number().min(0).optional(),
      tax: Joi.number().min(0).optional(),
    })
    .or("customerId", "customer"), // At least one of customerId or customer must be provided if either is present
  files: Joi.object()
    .optional()
    .keys({
      file: Joi.object()
        .optional()
        .keys({
          mimetype: Joi.string().valid("image/jpeg", "image/png").required(),
          size: Joi.number()
            .max(3 * 1024 * 1024)
            .required(), // 5MB limit
        }),
    })
    .optional(),
};

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
};
