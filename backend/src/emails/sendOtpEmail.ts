import nodemailer from "nodemailer";
import { config } from "../config/config.js";

// Email verification
const sendEmailVerificationCode = async ( userName: string, email: string, otp: string): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: { 
        user: config.otpEmailAddress, 
        pass: config.otpEmailPassword, 
      },
    });
  
    const emailHtml = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background-color: #f4f4f4; }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: #ffffff; 
              padding: 20px; 
              border-radius: 8px; 
              text-align: left; }
            .otp { 
              font-size: 24px; 
              font-weight: bold; 
              color: #007bff; 
              background: #e9ecef; 
              padding: 10px 20px; 
              border-radius: 6px; 
              display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>OTP Verification</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your One-Time Password (OTP) for email verification is:</p>
            <div class="otp">${otp}</div>
            <p>This OTP is valid for next <strong>10 minutes</strong>. Please do not share it with anyone.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p class="best-regards">Best Regards,</p>
            <p class="link-sphere"><strong>LinkSphere</strong></p>
            <p style="font-size: 12px; color: #888;">&copy; 2025 LinkSphere. All Rights Reserved.</p>
          </div>
        </body>
      </html>
    `;
  
    const response = await transporter.sendMail({
      from: `LinkSphere <linksphere@socialmedia.in>`,
      to: email,
      subject: "Signup Verification Code",
      html: emailHtml,
    });

    return true;
  } catch (error) {
    console.error(`Error while send otp: ${error}`);
    return false;
  }
};

// Account activation
const sendAccountActivationCode = async ( userName: string, email: string, otp: string): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: { 
        user: config.otpEmailAddress, 
        pass: config.otpEmailPassword, 
      },
    });
  
    const emailHtml = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background-color: #f4f4f4; }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: #ffffff; 
              padding: 20px; 
              border-radius: 8px; 
              text-align: left; }
            .otp { 
              font-size: 24px; 
              font-weight: bold; 
              color: #007bff; 
              background: #e9ecef; 
              padding: 10px 20px; 
              border-radius: 6px; 
              display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Activate Your Account</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>We noticed that you requested to activate your account on LinkSphere.</p>
            <p>Your activation code is:</p>
            <div class="otp">${otp}</div>
            <p>This code is valid for next <strong>10 minutes</strong>. Please do not share it with anyone.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p class="best-regards">Best Regards,</p>
            <p class="link-sphere"><strong>LinkSphere</strong></p>
            <p style="font-size: 12px; color: #888;">&copy; 2025 LinkSphere. All Rights Reserved.</p>
          </div>
        </body>
      </html>
    `;
  
    const response = await transporter.sendMail({
      from: `LinkSphere <linksphere@socialmedia.in>`,
      to: email,
      subject: "Activate Your Account",
      html: emailHtml,
    });

    return true;
  } catch (error) {
    console.error(`Error while send otp: ${error}`);
    return false;
  }
};

export { 
  sendEmailVerificationCode,
  sendAccountActivationCode, 
};