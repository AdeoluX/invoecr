const { Resend } = require('resend');
const templates = require('../utils/emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Invoycr <no-reply@invoycr.com>';

/**
 * Send an email using Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
const sendMail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Error sending email:', error.message);
      return;
    }
    console.log(`Email sent: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};

const sendWelcomeEmail = async (email, userName) => {
  const html = templates.welcomeTemplate(userName);
  return sendMail(email, 'Welcome up with Invoycr!', html);
};

const sendLoginEmail = async (email, userName, ipAddress) => {
  const html = templates.loginTemplate(userName, Date.now(), ipAddress);
  return sendMail(email, 'New Login Detected - Invoycr', html);
};

const sendInvoiceEmail = async (email, customerName, amount, invoiceNumber, paymentLink) => {
  const html = templates.invoiceTemplate(customerName, amount, invoiceNumber, paymentLink);
  return sendMail(email, `New Invoice ${invoiceNumber} from Invoycr`, html);
};

const sendAccountCreatedEmail = async (email, userName, password) => {
  const html = templates.accountCreatedTemplate(userName, email, password);
  return sendMail(email, 'Your Invoycr Account Details', html);
};

module.exports = {
  sendWelcomeEmail,
  sendLoginEmail,
  sendInvoiceEmail,
  sendAccountCreatedEmail,
};
