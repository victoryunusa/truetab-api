const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendMail = async ({ to, subject, text, html }) => {
  await resend.emails.send({
    from: `${process.env.MAIL_FROM_NAME || 'Truetab'} <${
      process.env.MAIL_FROM_ADDRESS || 'info@truetab.co'
    }>`,
    to,
    subject,
    text,
    html,
  });
};
