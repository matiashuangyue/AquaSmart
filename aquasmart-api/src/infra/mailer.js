// src/infra/mailer.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

// Log de ayuda (solo mientras desarrollás)
console.log("📧 SMTP config:", {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  FROM: SMTP_FROM,
});

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST || "smtp.gmail.com",
  port: Number(SMTP_PORT) || 587,
  secure: false, // con 587 es STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// función helper para enviar mail de reset
export async function sendPasswordResetMail(to, resetLink) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("⚠️ SMTP no configurado, no se envía mail real.");
    console.warn(`   Link de reset: ${resetLink}`);
    return;
  }

  const from = SMTP_FROM || SMTP_USER;

  await mailer.sendMail({
    from,
    to,
    subject: "Restablecer contraseña - AquaSmart",
    html: `
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de AquaSmart.</p>
      <p>Hacé clic en el siguiente enlace (o copialo en tu navegador):</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Si vos no hiciste esta solicitud, podés ignorar este mensaje.</p>
      <p>Saludos,<br/>Equipo AquaSmart</p>
    `,
  });
}
