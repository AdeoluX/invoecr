const Joi = require("joi");

const signInSchema = {
  body: Joi.object().required().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const signUpSchema = {
  body: Joi.object()
    .required()
    .keys({
      email: Joi.string().required(),
      password: Joi.string().required(),
      confirm_password: Joi.string().required(),
      type: Joi.string().valid("business", "staff", "individual").optional(),
      name: Joi.string().required(),
      phone: Joi.string().optional(),
      first_name: Joi.string().optional(),
      last_name: Joi.string().optional(),
      logo: Joi.string().optional(),
      address: Joi.string().optional(),
    }),
};

module.exports = {
  signInSchema,
  signUpSchema,
};
