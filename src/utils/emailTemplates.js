const getHeader = (title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .header { background-color: #10b981; padding: 30px 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; line-height: 1.6; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; background-color: #f9fafb; border-top: 1px solid #eee; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .tx-details { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .tx-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .tx-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoycr</h1>
    </div>
    <div class="content">
`;

const getFooter = () => `
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Invoycr. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const welcomeTemplate = (userName) => `
  ${getHeader("Welcome to Invoycr")}
  <p>Hi ${userName},</p>
  <p>Welcome to Invoycr! We're excited to help you manage your invoices and receive payments seamlessly.</p>
  <p>You can now start creating invoices, adding customers, and tracking your payments.</p>
  <div style="text-align: center;">
    <a href="${process.env.APP_URL}/dashboard" class="btn">Go to Dashboard</a>
  </div>
  ${getFooter()}
`;

const loginTemplate = (userName, time, ipAddress) => `
  ${getHeader("New Login Detection")}
  <p>Hello ${userName},</p>
  <p>We detected a new login to your Invoycr account.</p>
  <ul>
    <li><strong>Time:</strong> ${new Date(time).toLocaleString()}</li>
    <li><strong>IP Address:</strong> ${ipAddress || "Unknown"}</li>
  </ul>
  <p>If this was you, you can safely ignore this email.</p>
  ${getFooter()}
`;

const invoiceTemplate = (customerName, amount, invoiceNumber, paymentLink) => `
  ${getHeader("New Invoice from " + (process.env.BUSINESS_NAME || "Invoycr"))}
  <p>Hello ${customerName},</p>
  <p>You have a new invoice from <strong>${process.env.BUSINESS_NAME || "Invoycr"}</strong>.</p>
  <div class="tx-details">
    <div class="tx-row"><span>Invoice #:</span> <strong>${invoiceNumber}</strong></div>
    <div class="tx-row"><span>Amount:</span> <strong>N${amount.toLocaleString()}</strong></div>
    <div class="tx-row"><span>Date:</span> <strong>${new Date().toLocaleDateString()}</strong></div>
  </div>
  <p>You can view and pay your invoice by clicking the button below:</p>
  <div style="text-align: center;">
    <a href="${paymentLink}" class="btn">Pay Invoice</a>
  </div>
  ${getFooter()}
`;

const accountCreatedTemplate = (userName, email, password) => `
  ${getHeader("Your Invoycr Account Created")}
  <p>Hello ${userName},</p>
  <p>An account has been created for you on Invoycr.</p>
  <p>You can log in using these credentials:</p>
  <ul>
    <li><strong>Email:</strong> ${email}</li>
    <li><strong>Password:</strong> ${password}</li>
  </ul>
  <div style="text-align: center;">
    <a href="${process.env.APP_URL}/login" class="btn">Login Now</a>
  </div>
  <p>Please change your password after your first login.</p>
  ${getFooter()}
`;

module.exports = {
  welcomeTemplate,
  loginTemplate,
  invoiceTemplate,
  accountCreatedTemplate,
};
