const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.zeptomail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // Use false for port 587 (STARTTLS)
  requireTLS: true,
  auth: {
    user: process.env.MAIL_USERNAME || 'emailapikey',
    pass:
      process.env.MAIL_PASSWORD ||
      'wSsVR611+xDzXaoumWL7L+s5ng4ABgmkERx13lv163aoHq+Tpcc+lBHOBFT2FfcYQDU9EjBB8LMrmh0E0mEM2d4onF0DACiF9mqRe1U4J3x17qnvhDzNX25fmhKKK48MwgVvmWhpFMwr+g==',
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
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
