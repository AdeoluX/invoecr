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
        .valid("draft", "sent", "paid", "overdue", "published")
        .default("draft"),
      notes: Joi.string().optional().allow(""),
      terms: Joi.string().optional().allow(""),
      subtotal: Joi.number().required().min(0),
      tax: Joi.number().optional().min(0).default(0),
      template: Joi.string()
        .valid(
          "pdf0",
          "pdf1",
          "pdf2",
          "pdf3",
          "invoice1",
          "invoice2",
          "invoice3"
        )
        .default("pdf0"),
      type: Joi.string().valid("invoice", "quote").default("invoice"),
    })
    .xor("customer_id", "customer"),
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
    .optional()
    .keys({
      customerId: Joi.string().optional(),
      currency: Joi.string().valid("USD", "EUR", "GBP", "NGN").optional(),
      customer: Joi.object()
        .keys({
          name: Joi.string().optional(),
          email: Joi.string().email().optional(),
          phone: Joi.string().optional(),
        })
        .optional(),
      items: Joi.array()
        .items(
          Joi.object().keys({
            name: Joi.string().optional(),
            description: Joi.string().optional(),
            quantity: Joi.number().min(1).optional(),
            unitPrice: Joi.number().min(0).optional(),
            total: Joi.number().min(0).optional(),
          })
        )
        .optional(),
      issueDate: Joi.date().optional(),
      dueDate: Joi.date().optional(),
      status: Joi.string()
        .valid("draft", "sent", "paid", "overdue", "published")
        .optional(),
      notes: Joi.string().optional().allow(""),
      terms: Joi.string().optional().allow(""),
      subtotal: Joi.number().min(0).optional(),
      tax: Joi.number().min(0).optional(),
      total: Joi.number().min(0).optional(),
      template: Joi.string()
        .valid(
          "pdf0",
          "pdf1",
          "pdf2",
          "pdf3",
          "invoice1",
          "invoice2",
          "invoice3"
        )
        .optional(),
      type: Joi.string().valid("invoice", "quote").optional(),
    }),
  files: Joi.object()
    .optional()
    .keys({
      file: Joi.object()
        .optional()
        .keys({
          mimetype: Joi.string().valid("image/jpeg", "image/png").optional(),
          size: Joi.number()
            .max(3 * 1024 * 1024)
            .optional(),
        }),
    })
    .optional(),
};

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
};
