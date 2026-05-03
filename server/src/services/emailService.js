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
          <a href="${process.env.CLIENT_URL}${digitalCardUrl}" style="background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">View Your Digital Card</a>
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
          <a href="${process.env.CLIENT_URL}/dashboard/payouts" style="background-color: #000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold;">Go to Payouts</a>
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