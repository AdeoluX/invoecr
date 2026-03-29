const bcrypt = require("bcryptjs");
const Entity = require("../models/entity.model");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status");
const entityRepository = require("../repo/entity.repo");
const jwt = require("jsonwebtoken");
const Authorization = require("../utils/authorization.service");
const SubscriptionService = require("./subscription.service");
const EmailBuilder = require("../utils/email.utils");

class AuthService {
  static signup = async ({
    name,
    email,
    password,
    type = "business",
    phone,
    first_name,
    last_name,
    logo,
    address,
  }) => {
    // Validate required fields
    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required");
    }

    // Check for existing entity by email
    const existingEntity = await entityRepository.findOne({ query: { email } });
    abortIf(
      existingEntity,
      httpStatus.BAD_REQUEST,
      "Entity with this email already exists"
    );

    // Check for existing entity by phone if phone is provided
    if (phone) {
      const existingPhoneEntity = await entityRepository.findOne({
        query: { phone },
      });
      abortIf(
        existingPhoneEntity,
        httpStatus.BAD_REQUEST,
        "Entity with this phone number already exists"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const entity = await entityRepository.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        type,
        phone: phone?.trim() || null, // Set to null if empty string
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        logo,
        address: address?.trim() || null,
      });

      // Initialize entity with free subscription plan
      await SubscriptionService.initializeEntitySubscription(entity._id);

      // Generate token
      const token = Authorization.generateToken({
        id: entity._id,
        email: entity.email,
      });

      const { sendWelcomeEmail } = require("./email.service");
      sendWelcomeEmail(entity.email, entity.name || entity.first_name);

      return { entity, token };
    } catch (error) {
      // Handle duplicate key errors with more specific messages
      if (error.message.includes("already in use")) {
        throw new Error(error.message);
      }
      throw new Error(`Failed to create entity: ${error.message}`);
    }
  };
  static signIn = async (email, password) => {
    const entity = await entityRepository.findOne({ query: { email } });
    abortIf(!entity, httpStatus.UNAUTHORIZED, "Invalid email or password");
    const isMatch = await bcrypt.compare(password, entity.password);
    abortIf(!isMatch, httpStatus.UNAUTHORIZED, "Invalid email or password");
    const { sendLoginEmail } = require("./email.service");
    sendLoginEmail(entity.email, entity.first_name || entity.last_name || entity.name, "Unknown")
      .catch((err) => console.error("Login email failed:", err.message));
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
