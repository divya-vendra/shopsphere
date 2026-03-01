const nodemailer = require('nodemailer');

/**
 * Thin wrapper around Nodemailer.
 *
 * In development: use Mailtrap (SMTP sandbox) to catch outgoing emails.
 * In production: swap to SendGrid / AWS SES by changing the transporter config.
 *
 * The class approach lets us instantiate with user-specific data and call
 * different template methods (sendWelcome, sendPasswordReset, etc.)
 */
class Email {
  constructor(user, url = '') {
    this.to   = user.email;
    this.name = user.name.split(' ')[0];
    this.url  = url;
    this.from = process.env.EMAIL_FROM || 'ShopSphere <noreply@shopsphere.com>';
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      // TODO: Replace with SendGrid / AWS SES transport for production
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }

    // Development: Mailtrap sandbox
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async send(subject, html) {
    await this.createTransport().sendMail({
      from:    this.from,
      to:      this.to,
      subject,
      html,
    });
  }

  async sendWelcome() {
    await this.send(
      'Welcome to ShopSphere!',
      `<h1>Welcome, ${this.name}!</h1>
       <p>Your account has been created successfully.</p>
       <p>Start shopping at <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>`
    );
  }

  async sendPasswordReset() {
    await this.send(
      'ShopSphere — Password Reset Request (valid 10 min)',
      `<h1>Password Reset</h1>
       <p>Hi ${this.name},</p>
       <p>Click the link below to reset your password. This link expires in 10 minutes.</p>
       <a href="${this.url}" style="background:#6366f1;color:white;padding:12px 24px;
         border-radius:6px;text-decoration:none;display:inline-block;">
         Reset Password
       </a>
       <p>If you didn't request this, please ignore this email.</p>`
    );
  }

  async sendOrderConfirmation(order) {
    const itemsHtml = order.items
      .map(
        (item) =>
          `<tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
          </tr>`
      )
      .join('');

    await this.send(
      `ShopSphere — Order Confirmed #${order._id}`,
      `<h1>Your order is confirmed!</h1>
       <p>Hi ${this.name}, thank you for your purchase.</p>
       <table border="1" cellpadding="8" style="border-collapse:collapse;">
         <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
         <tbody>${itemsHtml}</tbody>
       </table>
       <p><strong>Total: $${order.totalPrice.toFixed(2)}</strong></p>
       <a href="${process.env.CLIENT_URL}/orders/${order._id}">View Order</a>`
    );
  }
}

module.exports = Email;
