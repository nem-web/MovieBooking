import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // automatically sets host/port for Gmail
  auth: {
    user: process.env.SMTP_USER, // your Gmail address
    pass: process.env.SMTP_PASS, // App Password (not your real password)
  },
});

const sendEmail = async ({ to, subject, body }) => {
  const response = await transporter.sendMail({
    from: process.env.SENDER_EMAIL, // same as user (Gmail address)
    to,
    subject,
    html: body,
  });
  return response;
};

export default sendEmail;
