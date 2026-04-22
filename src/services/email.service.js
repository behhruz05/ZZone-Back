const nodemailer = require('nodemailer');
const logger     = require('../config/logger');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'ZZone <noreply@zzone.uz>';

const sendProductApproved = async (to, productName) => {
  if (!process.env.EMAIL_HOST) return;
  try {
    await transporter.sendMail({
      from:    FROM,
      to,
      subject: `✅ Mahsulotingiz tasdiqlandi — ${productName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
          <h2 style="color:#22c55e">Mahsulot tasdiqlandi!</h2>
          <p>Sizning <strong>${productName}</strong> nomli mahsulotingiz admin tomonidan tasdiqlandi va platformada ko'rinadi.</p>
          <p style="margin-top:24px;color:#666">ZZone jamoasi</p>
        </div>
      `,
    });
    logger.info({ to, product: productName }, 'Approval email sent');
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to send approval email');
  }
};

const sendProductRejected = async (to, productName, reason) => {
  if (!process.env.EMAIL_HOST) return;
  try {
    await transporter.sendMail({
      from:    FROM,
      to,
      subject: `❌ Mahsulotingiz rad etildi — ${productName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
          <h2 style="color:#ef4444">Mahsulot rad etildi</h2>
          <p>Sizning <strong>${productName}</strong> nomli mahsulotingiz quyidagi sabab bilan rad etildi:</p>
          <blockquote style="border-left:3px solid #ef4444;padding-left:12px;color:#444;margin:16px 0">
            ${reason}
          </blockquote>
          <p>Mahsulotni to'g'irlab, qayta yuborishingiz mumkin.</p>
          <p style="margin-top:24px;color:#666">ZZone jamoasi</p>
        </div>
      `,
    });
    logger.info({ to, product: productName }, 'Rejection email sent');
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to send rejection email');
  }
};

module.exports = { sendProductApproved, sendProductRejected };
