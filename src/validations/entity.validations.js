const Joi = require('joi');

const addBankSchema = {
    body: Joi.object().required().keys({
        accountNumber: Joi.string().required(),
        bankCode: Joi.string().required(),
        isActive: Joi.boolean().required().default(false),
    }),
}

const editEntitySchema = {
    body: Joi.object().required().keys({
        phone: Joi.string().optional(),
        logo: Joi.string().optional(),
        address: Joi.string().optional(),
    })
}

const addMemberSchema = {
    body: Joi.object().required().keys({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().required(),
        type: Joi.string().required(),
    })
}

module.exports = {
    addBankSchema,
    editEntitySchema,
    addMemberSchema
}