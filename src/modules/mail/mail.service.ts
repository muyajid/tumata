import { logger } from "../../configs/logger.js";
import { mailFrom, mailTransporter } from "../../configs/mail.config.js";
import { SendCredentialDto, SendMailDto } from "./mail.dto.js";

export const sendMail = async ({
  to,
  subject,
  html,
  text,
}: SendMailDto): Promise<void> => {
  try {
    await mailTransporter.sendMail({
      from: mailFrom,
      to,
      subject,
      html,
      text,
    });

    logger.info({ to, subject }, "Email sent successfully");
  } catch (err) {
    logger.error(err, "Failed to send email");
    throw err;
  }
};

export const sendCredential = async ({
  to,
  username,
  password,
}: SendCredentialDto): Promise<void> => {
  const subject = "Informasi Kredensial Akun Anda";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Informasi Akun</h2>
      <p>Berikut adalah kredensial akun Anda:</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td><strong>Username</strong></td>
          <td>: ${username}</td>
        </tr>
        <tr>
          <td><strong>Password</strong></td>
          <td>: ${password}</td>
        </tr>
      </table>
      <p>Harap segera ganti password Anda setelah login.</p>
    </div>
  `;

  await sendMail({ to, subject, html });
};
