const nodemailer = require("nodemailer");
require("dotenv").config();

const parseBoolean = (value, fallback = false) => {
  if (typeof value !== "string") return fallback;
  return ["true", "1", "yes"].includes(value.trim().toLowerCase());
};

const getEmailCredentials = () => {
  const user = (
    process.env.EMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.SMTP_USER ||
    ""
  ).trim();

  const rawPassword =
    process.env.EMAIL_PASS || process.env.MAIL_PASS || process.env.SMTP_PASS || "";

  const isGmailUser = /@gmail\.com$/i.test(user);
  const pass = isGmailUser
    ? rawPassword.replace(/\s+/g, "").trim()
    : rawPassword.trim();

  return { user, pass };
};

const createTransporter = () => {
  const { user, pass } = getEmailCredentials();

  const mailHost = process.env.MAIL_HOST || process.env.SMTP_HOST;
  const mailPort = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
  const mailSecure = parseBoolean(process.env.MAIL_SECURE || process.env.SMTP_SECURE, mailPort === 465);
  const mailService = process.env.MAIL_SERVICE;

  if (mailHost) {
    return nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: mailService || "gmail",
    auth: { user, pass },
  });
};

const buildMailAuthError = (error) => {
  if (error?.code !== "EAUTH" && error?.responseCode !== 535) {
    return error;
  }

  const wrappedError = new Error(
    "Email authentication failed. Use a valid sender account and set EMAIL_PASS to a Google App Password (16 characters, no spaces) when using Gmail."
  );

  wrappedError.code = error.code;
  wrappedError.responseCode = error.responseCode;
  wrappedError.command = error.command;
  wrappedError.cause = error;

  return wrappedError;
};

const emailTransporter = createTransporter();

const sendMail = async (mailOptions) => {
  try {
    return await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    throw buildMailAuthError(error);
  }
};

const verifyEmailTransport = async () => {
  try {
    await emailTransporter.verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: buildMailAuthError(error) };
  }
};

module.exports = {
  emailTransporter,
  sendMail,
  verifyEmailTransport,
  buildMailAuthError,
};