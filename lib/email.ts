import nodemailer from 'nodemailer';

const navy = '#1e3a5f';

function emailLayout(title: string, content: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:${navy};padding:24px 32px;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;font-weight:700;">Système de Réservation de Salles</h1>
              <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">${title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1e293b;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} Réservation Salles — Notification automatique
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendMail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[email] SMTP non configuré — email non envoyé:', subject, '→', to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Réservation Salles" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[email] Échec envoi:', error);
    return false;
  }
}

export async function sendConflictEmail(params: {
  to: string;
  userName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const html = emailLayout(
    'Conflit de réservation détecté',
    `
      <p>Bonjour <strong>${params.userName}</strong>,</p>
      <p>Votre demande de réservation n'a pas pu être enregistrée car la salle est déjà occupée sur ce créneau.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#64748b;">Salle</td><td style="padding:8px 0;font-weight:600;">${params.roomName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;font-weight:600;">${params.date}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Horaire</td><td style="padding:8px 0;font-weight:600;">${params.startTime} – ${params.endTime}</td></tr>
      </table>
      <p>Veuillez choisir un autre créneau ou une autre salle.</p>
    `,
  );
  return sendMail(params.to, 'Conflit de réservation — Salle occupée', html);
}

export async function sendReservationConfirmedEmail(params: {
  to: string;
  userName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  const html = emailLayout(
    'Réservation confirmée',
    `
      <p>Bonjour <strong>${params.userName}</strong>,</p>
      <p>Bonne nouvelle ! Votre réservation a été <strong style="color:#059669;">confirmée</strong> par l'administration.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#64748b;">Salle</td><td style="padding:8px 0;font-weight:600;">${params.roomName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;font-weight:600;">${params.date}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Horaire</td><td style="padding:8px 0;font-weight:600;">${params.startTime} – ${params.endTime}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Motif</td><td style="padding:8px 0;font-weight:600;">${params.reason}</td></tr>
      </table>
    `,
  );
  return sendMail(params.to, 'Réservation confirmée', html);
}

export async function sendReservationRefusedEmail(params: {
  to: string;
  userName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  const html = emailLayout(
    'Réservation refusée',
    `
      <p>Bonjour <strong>${params.userName}</strong>,</p>
      <p>Nous sommes au regret de vous informer que votre demande de réservation a été <strong style="color:#dc2626;">refusée</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#64748b;">Salle</td><td style="padding:8px 0;font-weight:600;">${params.roomName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;font-weight:600;">${params.date}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Horaire</td><td style="padding:8px 0;font-weight:600;">${params.startTime} – ${params.endTime}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Motif</td><td style="padding:8px 0;font-weight:600;">${params.reason}</td></tr>
      </table>
      <p>Pour toute question, contactez l'administration.</p>
    `,
  );
  return sendMail(params.to, 'Réservation refusée', html);
}

export async function sendPasswordResetEmail(params: { to: string; userName: string; resetUrl: string }) {
  const html = emailLayout(
    'Réinitialisation du mot de passe',
    `
      <p>Bonjour <strong>${params.userName}</strong>,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${params.resetUrl}" style="display:inline-block;background:${navy};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p style="color:#64748b;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  );
  return sendMail(params.to, 'Réinitialisation de votre mot de passe', html);
}
