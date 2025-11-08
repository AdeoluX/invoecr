const Joi = require("joi");

const createInventorySchema = {
  body: Joi.object()
    .required()
    .keys({
      name: Joi.string().required(),
      description: Joi.string().optional().allow(""),
      tags: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .optional(),
      amount: Joi.number().min(0).required(),
    }),
};

const updateInventorySchema = {
  body: Joi.object()
    .required()
    .keys({
      name: Joi.string().optional(),
      description: Joi.string().optional().allow(""),
      tags: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .optional(),
      amount: Joi.number().min(0).optional(),
    }),
};

module.exports = {
  createInventorySchema,
  updateInventorySchema,
};
