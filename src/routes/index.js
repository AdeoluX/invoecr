const authRoute = require("./auth.route");
const invoiceRoute = require("./invoice.route");
const utilsRoute = require("./utils.route");
const entityRoute = require("./entity.route");
const webHookRoute = require("./webhook.route");
const subscriptionRoute = require("./subscription.route");
const cardRoute = require("./card.route");

module.exports = {
  authRoute,
  invoiceRoute,
  utilsRoute,
  entityRoute,
  webHookRoute,
  subscriptionRoute,
  cardRoute,
};
