const { listBanks, verifyBankAccount } = require('../utils/bank.utils');
const { abortIf } = require('../utils/responder');
const httpStatus = require('http-status');
const { PaymentGateway, PaystackPaymentGateway, PaymentResponse } = require('../utils/paystack.utils');
const transactionRepo = require('../repo/transaction.repo');
const invoiceRepo = require('../repo/invoice.repo');
const crypto = require('crypto');

class UtilsService {
  static listAllBanks = async () => {
    const getBanks = await listBanks()
    return getBanks
  };

  static verifyBankNumber = async (accountNumber, bankCode) => {
    const verifyBank = await verifyBankAccount(accountNumber, bankCode)
    abortIf(!verifyBank.status, httpStatus.BAD_REQUEST, verifyBank.message);
    return verifyBank.data
  }

  static webhook = async (object) => {
    try {
      const paystack = new PaystackPaymentGateway();
      const dataReq = object;
      // Verify Paystack signature
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        throw new Error('Paystack Secret Key is not defined');
      }
  
      const event = dataReq.event;
      const data = dataReq.data;
  
      // Only process charge.success events
      if (event === 'charge.success') {
        try {
          const verification = await paystack.verifyTransaction(data.reference)
          if(verification.success){
            const transaction = await transactionRepo.findOne({
              query: { reference: data.reference }
            })
            await transactionRepo.update(transaction._id, { status: 'SUCCESS' })
            const invoice = await invoiceRepo.update(transaction.invoice, { status: 'paid' })
            return {}
          }
        } catch (error) {
          console.error('Charge success error:', error);
          return {};
        }
      }
    } catch (error) {
      console.error('Webhook service error:', error);
      return {}
    }
  }
}

module.exports = {
  UtilsService,
};
