const Joi = require('joi');

const addBankSchema = {
    body: Joi.object().required().keys({
        accountNumber: Joi.string().required(),
        bankCode: Joi.string().required(),
        isActive: Joi.boolean().required().default(false),
    }),
}

module.exports = {
    addBankSchema
}