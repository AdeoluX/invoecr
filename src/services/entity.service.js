const bcrypt = require("bcryptjs");
const Entity = require("../models/entity.model");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;
const bankRepository = require("../repo/bankAccount.repo");
const entityRepository = require("../repo/entity.repo");
const { PaystackPaymentGateway } = require("../utils/paystack.utils");
const SubscriptionService = require("./subscription.service");
const { UtilsService } = require("./utils.service");

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

  static addLogo = async ({ file, entityId }) => {
    const entity = await entityRepository.findOne({ query: { _id: entityId } });
    abortIf(!entity, httpStatus.BAD_REQUEST, "Entity does not exist");
    abortIf(!file, httpStatus.BAD_REQUEST, "Logo is required");
    abortIf(
      !["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype),
      httpStatus.BAD_REQUEST,
      "Invalid file type"
    );
    const logo = await UtilsService.cloudinaryUpload(
      file.tempFilePath,
      `${entity.name.toLowerCase().split(" ").join("-")}`
    );
    abortIf(!logo, httpStatus.BAD_REQUEST, "Unable to upload logo");
    entity.logo = logo;
    await entity.save();
    return { logo };
  };
  static addSignature = async ({ file, entityId }) => {
    const entity = await entityRepository.findOne({ query: { _id: entityId } });
    abortIf(!entity, httpStatus.BAD_REQUEST, "Entity does not exist");
    abortIf(!file, httpStatus.BAD_REQUEST, "Signature is required");
    abortIf(
      !["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype),
      httpStatus.BAD_REQUEST,
      "Invalid file type"
    );
    const signature = await UtilsService.cloudinaryUpload(
      file.tempFilePath,
      `${entity.name.toLowerCase().split(" ").join("-")}`
    );
    abortIf(!signature, httpStatus.BAD_REQUEST, "Unable to upload signature");
    entity.signature = signature;
    await entity.save();
    return { signature };
  };

  static removeLogo = async ({ entityId }) => {
    const entity = await entityRepository.findOne({ query: { _id: entityId } });
    abortIf(!entity, httpStatus.BAD_REQUEST, "Entity does not exist");
    entity.logo = undefined;
    await entity.save();
    return {};
  };

  static removeSignature = async ({ entityId }) => {
    const entity = await entityRepository.findOne({ query: { _id: entityId } });
    abortIf(!entity, httpStatus.BAD_REQUEST, "Entity does not exist");
    entity.signature = undefined;
    await entity.save();
    return {};
  };

  static getEntity = async (id) => {
    const entity = await entityRepository.findById(id);
    abortIf(!entity, httpStatus.BAD_REQUEST, "Entity does not exist");
    return entity;
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
    const { sendAccountCreatedEmail } = require("./email.service");
    sendAccountCreatedEmail(createdEntity.email, createdEntity.first_name, "generated-password");

    return createdEntity;
  };
}

module.exports = {
  EntityService,
};
