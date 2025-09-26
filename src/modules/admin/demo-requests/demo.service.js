const { prisma } = require('../../../lib/prisma');
const { customAlphabet } = require('nanoid');
const templateService = require('../../../services/templateService');
const { sendMail } = require('../../../utils/mailer');
// const sendEmail = require('../../../utils/mailer'); // implement with nodemailer/sendgrid etc.

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars
const nanoid = customAlphabet(alphabet, 8);

async function requestDemo({ email, firstName, lastName, company, message }) {
  const existing = await prisma.demoRequest.findUnique({ where: { email } });
  if (existing) {
    const e = new Error('A demo request already exists for this email');
    e.status = 409;
    throw e;
  }

  return prisma.demoRequest.create({
    data: { email, firstName, lastName, company, message },
  });
}

async function listDemoRequests() {
  return prisma.demoRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

async function approveDemoRequest(id) {
  const request = await prisma.demoRequest.findUnique({ where: { id } });
  if (!request) {
    const e = new Error('Request not found');
    e.status = 404;
    throw e;
  }

  const code = nanoid();

  const regCode = await prisma.registrationCode.upsert({
    where: { demoRequestId: request.id },
    update: {
      code,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // refresh if re-approved
    },
    create: {
      code,
      email: request.email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      demoRequestId: request.id,
    },
  });

  await prisma.demoRequest.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });

  // Send email with code
  await sendDemoInvite({ request, regCode });

  return regCode;
}

async function sendDemoInvite({ request, regCode }) {
  const registerUrl = `${process.env.APP_URL}/register?code=${regCode.code}`;

  const htmlContent = await templateService.renderTemplate('demo-invite-email', {
    requesterName: request.name || 'there',
    code: regCode.code,
    registerUrl,
    expiresAt: regCode.expiresAt.toDateString(),
    year: new Date().getFullYear(),
  });

  await sendMail({
    to: request.email,
    subject: '✅ Your Nine demo access is ready',
    html: htmlContent,
    text: `Hi ${request.name}, your Nine demo is ready. Use code ${regCode.code} to register here: ${registerUrl}`,
  });
}

async function rejectDemoRequest(id) {
  const request = await prisma.demoRequest.findUnique({ where: { id } });
  if (!request) {
    const e = new Error('Request not found');
    e.status = 404;
    throw e;
  }

  await prisma.demoRequest.update({
    where: { id },
    data: { status: 'REJECTED' },
  });

  // Notify user
  await sendMail({
    to: request.email,
    subject: 'Your demo request was not approved',
    text: `Hello,\n\nUnfortunately, your demo request has been rejected.\n\nRegards,\nTruetab`,
    html: `<p>Hello,</p>
           <p>Unfortunately, your demo request has been <b>rejected</b>.</p>
           <p>Regards,<br>Truetab</p>`,
  });

  return { ok: true };
}

module.exports = {
  requestDemo,
  listDemoRequests,
  approveDemoRequest,
  rejectDemoRequest,
};
