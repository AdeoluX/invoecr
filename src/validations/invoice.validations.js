const Joi = require('joi');

const createInvoiceSchema = {
    body: Joi.object().required().keys({
        customer: Joi.string().required(), // The customer is typically a reference ID
        items: Joi.array().items(
            Joi.object().keys({
                description: Joi.string().required(),
                quantity: Joi.number().required().min(1),
                unitPrice: Joi.number().required().min(0),
            })
        ).required(),
        issueDate: Joi.date().required(),
        dueDate: Joi.date().optional(),
        status: Joi.string().valid('draft', 'sent', 'paid', 'overdue').default('draft'),
        notes: Joi.string().optional().allow(''),
        terms: Joi.string().optional().allow(''),
        subtotal: Joi.number().required().min(0),
        tax: Joi.number().optional().min(0).default(0),
    }),
};

module.exports = {
    createInvoiceSchema,
};
