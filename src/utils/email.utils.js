const nodemailer = require("nodemailer");
const emailRenderer = require("./emailRenderer");

class EmailBuilder {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(to, template, context = {}) {
    const html = await emailRenderer.render(template, context);

    // Get subject from context or generate default based on template
    const subject = context.subject || this.getDefaultSubject(template);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  getDefaultSubject(template) {
    const subjectMap = {
      login: "New sign-in detected",
      otp: "Your verification code",
      "reset-password": "Reset your password",
    };
    return subjectMap[template] || "Notification";
  }
}

module.exports = EmailBuilder;
