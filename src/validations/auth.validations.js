const Joi = require('joi');

const signInSchema = {
    body: Joi.object().required().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
}

const signUpSchema = {
    body: Joi.object().required().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
        confirm_password: Joi.string().required(),
        name: Joi.string().required(),
    }),
}

module.exports = {
    signInSchema,
    signUpSchema
}