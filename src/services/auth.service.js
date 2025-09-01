const bcrypt = require("bcryptjs");
const Entity = require("../models/entity.model");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;
const entityRepository = require("../repo/entity.repo");
const jwt = require("jsonwebtoken");
const Authorization = require("../utils/authorization.service");
const SubscriptionService = require("./subscription.service");

class AuthService {
  static signup = async ({
    name,
    email,
    password,
    type = "staff",
    phone,
    first_name,
    last_name,
    logo,
    address,
  }) => {
    const existingEntity = await entityRepository.findOne({ query: { email } });
    abortIf(existingEntity, httpStatus.BAD_REQUEST, "Entity already exists");
    const hashedPassword = await bcrypt.hash(password, 10);
    const entity = await entityRepository.create({
      name,
      email,
      password: hashedPassword,
      type,
      phone,
      first_name,
      last_name,
      logo,
      address,
    });

    // Initialize entity with free subscription plan
    await SubscriptionService.initializeEntitySubscription(entity._id);

    //generate token
    const token = Authorization.generateToken({
      id: entity._id,
      email: entity.email,
    });
    return { entity, token };
  };
  static signIn = async (email, password) => {
    const entity = await entityRepository.findOne({ query: { email } });
    abortIf(!entity, httpStatus.NOT_FOUND, "Entity not found");
    const isMatch = await bcrypt.compare(password, entity.password);
    abortIf(!isMatch, httpStatus.BAD_REQUEST, "Invalid credentials");
    const token = Authorization.generateToken({
      id: entity._id,
      email: entity.email,
    });
    return { entity, token };
  };
}

module.exports = {
  AuthService,
};
