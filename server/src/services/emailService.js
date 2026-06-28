import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

export const sendGiftReceipt = async (guestEmail, guestName, amount, giftName, digitalCardUrl) => {
  const mailOptions = {
    from: `"ZeAlpha Registry" <${process.env.EMAIL_USER}>`,
    to: guestEmail,
    subject: `Your Gift Receipt for ${giftName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Thank You, ${guestName}!</h2>
        <p>Your contribution of <strong>${amount} ETB</strong> to the gift <strong>${giftName}</strong> has been successfully processed.</p>
        <p>The couple has been notified of your generosity.</p>
        ${digitalCardUrl ? `
        <div style="margin-top: 30px; text-align: center;">
          <a href="${clientUrl}${digitalCardUrl}" style="background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">View Your Digital Card</a>
        </div>
        ` : ''}
        <footer style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">
          <p>© 2026 ZeAlpha - The Modern Wedding Registry</p>
        </footer>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendWeddingFundedAlert = async (coupleEmail, giftName, totalAmount) => {
  const mailOptions = {
    from: `"ZeAlpha Alerts" <${process.env.EMAIL_USER}>`,
    to: coupleEmail,
    subject: `Great News! Your gift "${giftName}" is fully funded!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">A Major Milestone!</h2>
        <p>Your gift <strong>${giftName}</strong> has reached its goal of <strong>${totalAmount} ETB</strong>.</p>
        <p>You can now view the full list of contributors and the digital cards they've left for you in your dashboard.</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${clientUrl}/dashboard/payouts" style="background-color: #000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Go to Payouts</a>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendPayoutNotification = async (coupleEmail, amount, method) => {
  const mailOptions = {
    from: `"ZeAlpha Finance" <${process.env.EMAIL_USER}>`,
    to: coupleEmail,
    subject: `Your Payout is on the Way!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">Funds Dispatched</h2>
        <p>We've processed your payout of <strong>${amount} ETB</strong> via <strong>${method}</strong>.</p>
        <p>Please allow 24-48 hours for the funds to reflect in your account.</p>
        <p>Happy wedding planning!</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: `"ZeAlpha Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Password Reset Request`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Reset Your Password</h2>
        <p>You requested a password reset for your ZeAlpha account.</p>
        <p>Click the link below to reset your password:</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">This link will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #888;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendGiftSurgeAlert = async (coupleEmail, giftName, progress, giftLink) => {
  const mailOptions = {
    from: `"ZeAlpha Alerts" <${process.env.EMAIL_USER}>`,
    to: coupleEmail,
    subject: `🔥 ${giftName} is surging!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Your guests are rallying!</h2>
        <p>Your gift <strong>${giftName}</strong> is now <strong>${progress}% funded</strong> — guests are excited to contribute!</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${clientUrl}${giftLink}" style="background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">View Gift</a>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

export const sendOrderStatusEmail = async (coupleEmail, giftName, vendorName, status, orderLink) => {
  const statusEmoji = { pending: '📋', confirmed: '✅', ordered: '📦', shipped: '🚚', delivered: '🎉', cancelled: '❌' };
  const mailOptions = {
    from: `"ZeAlpha Orders" <${process.env.EMAIL_USER}>`,
    to: coupleEmail,
    subject: `Order ${status}: ${giftName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">${statusEmoji[status] || '📋'} Order ${status}</h2>
        <p>Your order for <strong>${giftName}</strong>${vendorName ? ` from <strong>${vendorName}</strong>` : ''} is now <strong>${status}</strong>.</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${clientUrl}${orderLink}" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">View Order</a>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

export const sendWithdrawalCreatedEmail = async (coupleEmail, amount) => {
  const mailOptions = {
    from: `"ZeAlpha Finance" <${process.env.EMAIL_USER}>`,
    to: coupleEmail,
    subject: 'Payout Request Received',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Payout Request Submitted</h2>
        <p>Your payout request of <strong>${amount} ETB</strong> has been received and is being reviewed.</p>
        <p>We'll notify you when it's approved.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

export const sendWithdrawalApprovedEmail = async (coupleEmail, amount) => {
  const mailOptions = {
    from: `"ZeAlpha Finance" <${process.env.EMAIL_USER}>`,
    to: coupleEmail,
    subject: 'Payout Request Approved!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">Payout Approved</h2>
        <p>Your payout request of <strong>${amount} ETB</strong> has been approved.</p>
        <p>We will process and send the funds to your bank account shortly.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

export const sendWeddingApproachingAlert = async (coupleEmail, weddingName, weddingDate, daysAway) => {
  const mailOptions = {
    from: `"ZeAlpha Reminders" <${process.env.EMAIL_USER}>`,
    to: coupleEmail,
    subject: `🎊 Your wedding is in ${daysAway} days!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Your Big Day is Almost Here!</h2>
        <p>Your wedding <strong>${weddingName}</strong> is <strong>${daysAway} days away</strong> (${new Date(weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}).</p>
        <p>Make sure your registry is complete and gifts are on track!</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${clientUrl}/dashboard" style="background-color: #B8860B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Go to Dashboard</a>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

export const sendSupportEmail = async ({ name, email, subject, message }) => {
  const mailOptions = {
    from: `"ZeAlpha Support" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `[Support] ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">New Support Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};