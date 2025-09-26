const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.zeptomail.com',
  port: Number(process.env.MAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME || 'emailapikey',
    pass: process.env.MAIL_PASSWORD || '...',
  },
});

exports.sendMail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'Truetab'}" <${
      process.env.MAIL_FROM_ADDRESS || 'info@truetab.co'
    }>`,
    to,
    subject,
    text,
    html,
  });
};
