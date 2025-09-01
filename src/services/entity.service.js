const bcrypt = require("bcryptjs");
const Entity = require("../models/entity.model");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;
const bankRepository = require("../repo/bankAccount.repo");
const entityRepository = require("../repo/entity.repo");
const { PaystackPaymentGateway } = require("../utils/paystack.utils");
const jwt = require("jsonwebtoken");
const Authorization = require("../utils/authorization.service");
const SubscriptionService = require("./subscription.service");

class EntityService {
  static addBank = async ({
    accountNumber,
    bankCode,
    userId,
    isActive = false,
  }) => {
    const existingEntity = await entityRepository.findOne({
      query: { _id: userId },
    });
    abortIf(!existingEntity, httpStatus.BAD_REQUEST, "Entity does not exist");
    const paystack = new PaystackPaymentGateway();
    const subAccount = await paystack.createSubaccount({
      account_number: accountNumber,
      bank_code: bankCode,
      business_name: existingEntity.name,
      percentage_charge: 0.3,
      description: "",
      primary_contact_email: existingEntity.email,
    });
    //create bank repo
    const createBank = await bankRepository.create({
      accountNumber,
      accountName: subAccount.data.account_name,
      bankName: subAccount.data.settlement_bank,
      subAccountCode: subAccount.data.subaccount_code,
      entity: userId,
      isActive,
    });
    return createBank;
  };

  static getBanks = async ({ userId }) => {
    const existingEntity = await entityRepository.findOne({
      query: { _id: userId },
    });
    abortIf(!existingEntity, httpStatus.BAD_REQUEST, "Entity does not exist");
    const allBanks = await bankRepository.findAll({
      query: { entity: userId },
    });
    return allBanks;
  };

  static addLogo = async (email, password) => {
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
  static addSignature = async (email, password) => {
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

  static editEntity = async (data) => {
    const entity = await entityRepository.findById(data.entity.id);
    abortIf(!entity, httpStatus.BAD_REQUEST, "Invalid Entity Id");
    const updatedEntity = await entityRepository.update(
      data.entity.id,
      data.data
    );
    abortIf(!updatedEntity, httpStatus.BAD_REQUEST, "Unable to update entity");
    return {};
  };

  static addMember = async (data) => {
    const entity = await entityRepository.findById(data.entity.id);
    abortIf(!entity, httpStatus.BAD_REQUEST, "Invalid Entity Id");
    const { first_name, last_name, email, type } = data.data;
    const { id } = data.entity;
    const password = await bcrypt.hash("generated-password", 10);
    const createdEntity = await entityRepository.create({
      first_name,
      last_name,
      email,
      type: "staff",
      parent_id: id,
      name: entity.name,
      password,
    });
    return createdEntity;
  };
}

module.exports = {
  EntityService,
};
