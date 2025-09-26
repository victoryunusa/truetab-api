const { prisma } = require('../../../lib/prisma');
const { customAlphabet } = require('nanoid');
const sendEmail = require('../../../utils/mailer'); // implement with nodemailer/sendgrid etc.

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

  const regCode = await prisma.registrationCode.create({
    data: {
      code,
      email: request.email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      demoRequestId: request.id,
    },
  });

  await prisma.demoRequest.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });

  // send email
  await sendEmail(
    request.email,
    'Your demo request has been approved 🎉',
    `Hello ${request.firstName || ''},\n\nYour demo request was approved. Use this code to register: ${code}\n\nThis code will expire in 7 days.\n\nCheers!`
  );

  return regCode;
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

  // optional: notify user
  await sendEmail(
    request.email,
    'Your demo request was not approved',
    `Hello,\n\nUnfortunately, your demo request has been rejected.\n\nRegards.`
  );

  return { ok: true };
}

module.exports = {
  requestDemo,
  listDemoRequests,
  approveDemoRequest,
  rejectDemoRequest,
};
