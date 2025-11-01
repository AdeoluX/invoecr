const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const emailRenderer = {
  async render(templateName, context) {
    try {
      const templatePath = path.join(
        __dirname,
        "..",
        "notificationTemplates",
        `${templateName}.hbs`
      );
      const templateSource = fs.readFileSync(templatePath, "utf8");
      //compile the template
      const template = handlebars.compile(templateSource);
      //render the template with the context
      return template(context);
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      throw error;
    }
  },
};

module.exports = emailRenderer;
