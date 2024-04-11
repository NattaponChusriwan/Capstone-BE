const nodemailer = require('nodemailer');
const sendEmail = async (email, subject, url) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: `Dear user,\n\nPlease find the following link for your reference:\n${url}\n\nBest regards,\nArt Gallery`,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendConfirmationPayment = async (email, orderUrl) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Payment Confirmation",
      text: `Dear customer,\n\nYour payment has been confirmed. Below is the link to your image:\n${orderUrl}\n\nBest regards,\nArt Gallery`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
const sendTranfer = async (email, orderUrl) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Payment Confirmation",
      text: `Dear customer,\n\nYour payment has been confirmed. Below is the link to your image:\n${orderUrl}\n\nBest regards,\nArt Gallery`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
module.exports = { sendEmail, sendConfirmationPayment } ;
