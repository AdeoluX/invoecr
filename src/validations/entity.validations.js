const Joi = require("joi");

const addBankSchema = {
  body: Joi.object()
    .required()
    .keys({
      accountNumber: Joi.string().required(),
      bankCode: Joi.string().required(),
      isActive: Joi.boolean().required().default(false),
    }),
};

const editEntitySchema = {
  body: Joi.object()
    .required()
    .keys({
      phone: Joi.string().optional(),
      logo: Joi.string().optional(),
      address: Joi.string().optional(),
      signature: Joi.string().optional(),
      whatsappNumber: Joi.string().optional(),
      email: Joi.string().optional(),
      name: Joi.string().optional(),
      state: Joi.string().optional(),
      city: Joi.string().optional(),
      country: Joi.string().optional(),
      businessType: Joi.string()
        .optional()
        .valid(
          "freelancer",
          "tailor",
          "salon",
          "caterer",
          "mechanic",
          "contractor",
          "digital_marketing",
          "creative_agency",
          "it_consultant",
          "ngo",
          "church",
          "restaurant",
          "retail_shop",
          "transport",
          "healthcare",
          "education",
          "real_estate",
          "manufacturing",
          "other"
        ),
    }),
};

const addMemberSchema = {
  body: Joi.object().required().keys({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().required(),
    type: Joi.string().required(),
  }),
};

module.exports = {
  addBankSchema,
  editEntitySchema,
  addMemberSchema,
};
