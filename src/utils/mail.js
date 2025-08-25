import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project management app",
      link: "http://projectmanagementapp.com/",
    },
  });

  // use options.mailGenContent instead of options.emailVerificationTemplate
  if (!options.mailGenContent || !options.mailGenContent.body) {
    throw new Error("Invalid mailGenContent provided");
  }

  const emailText = mailGenerator.generatePlaintext(options.mailGenContent);
  const emailHtml = mailGenerator.generate(options.mailGenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMPT_HOST,
    port: process.env.MAILTRAP_SMPT_PORT,
    auth: {
      user: process.env.MAILTRAP_SMPT_USER,
      pass: process.env.MAILTRAP_SMPT_PASS,
    },
  });

  const mail = {
    from: "mail.projectmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
    return true;
  } catch (error) {
    console.log("Email sending error", error);
    throw error;
  }
};

const emailVerificationTemplate = (username, verificationLink) => {
  return {
    body: {
      name: username,
      intro: "Welcome! We're excited to have you on board.",
      action: {
        instructions:
          "To get started, please verify your email address by clicking the button below:",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationLink,
        },
      },
      outro:
        "If you did not create an account, no further action is required on your part.",
    },
  };
};

const passwordResetTemplate = (username, resetLink) => {
  return {
    body: {
      name: username,
      intro: "You have requested to reset your password.",
      action: {
        instructions: "To reset your password, please click the button below:",
        button: {
          color: "#FF5733",
          text: "Reset Password",
          link: resetLink,
        },
      },
      outro:
        "If you did not request a password reset, please ignore this email.",
    },
  };
};

export { emailVerificationTemplate, passwordResetTemplate, sendEmail };
