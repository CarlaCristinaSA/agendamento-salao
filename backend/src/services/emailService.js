const transporter = require('../config/email');
const { query }   = require('../config/database');

const salonName = () => process.env.SALON_NAME || 'Salão de Beleza';
const emailFrom = () =>
  `"${process.env.EMAIL_FROM_NAME || salonName()}" <${process.env.EMAIL_FROM || 'nao-responda@salao.com'}>`;

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatTime(timeStr) {
  return String(timeStr).substring(0, 5);
}

function formatCurrency(value) {
  return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

function detailsTable(rows) {
  const body = rows
    .map(
      ([label, val], i) => `
      <tr style="${i % 2 === 0 ? 'background:#f8f9fa;' : ''}">
        <td style="padding:10px; border:1px solid #dee2e6;"><strong>${label}</strong></td>
        <td style="padding:10px; border:1px solid #dee2e6;">${val}</td>
      </tr>`
    )
    .join('');
  return `<table style="width:100%; border-collapse: collapse; margin: 16px 0;">${body}</table>`;
}

async function getAdminRecipients() {
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    return [process.env.ADMIN_NOTIFICATION_EMAIL];
  }
  try {
    const result = await query(
      `SELECT email FROM users WHERE role = 'admin' AND is_active = TRUE`
    );
    return result.rows.map((r) => r.email);
  } catch (err) {
    console.error('[Email] Falha ao resolver destinatários admin:', err.message);
    return [];
  }
}

function sendConfirmationEmail(appointment, service) {
  setImmediate(async () => {
    if (!appointment.client_email) return;

    const subject = `Confirmação de Agendamento - ${salonName()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">✅ Agendamento Confirmado!</h2>
        <p>Olá, <strong>${appointment.client_name}</strong>!</p>
        <p>Seu agendamento foi confirmado com sucesso. Veja os detalhes abaixo:</p>
        ${detailsTable([
          ['Serviço', service.name],
          ['Data', formatDate(appointment.appointment_date)],
          ['Horário', formatTime(appointment.appointment_time)],
          ['Valor', formatCurrency(service.price)],
        ])}
        <p style="color:#6c757d; font-size:13px;">
          O pagamento é realizado presencialmente após a conclusão do atendimento.
        </p>
        <hr/>
        <p style="color:#6c757d; font-size:12px;">Este é um e-mail automático. Por favor, não responda.</p>
      </div>`;

    try {
      await transporter.sendMail({ from: emailFrom(), to: appointment.client_email, subject, html });
      console.log(`[Email] Confirmação enviada para ${appointment.client_email}`);
    } catch (err) {
      console.error(`[Email] Falha ao enviar confirmação para ${appointment.client_email}:`, err.message);
    }
  });
}

function sendCancellationEmail(appointment, service) {
  setImmediate(async () => {
    if (!appointment.client_email) return;

    const subject = `Cancelamento de Agendamento - ${salonName()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">❌ Agendamento Cancelado</h2>
        <p>Olá, <strong>${appointment.client_name}</strong>!</p>
        <p>Informamos que o seu agendamento foi <strong>cancelado</strong>. Veja os detalhes:</p>
        ${detailsTable([
          ['Serviço', service.name],
          ['Data', formatDate(appointment.appointment_date)],
          ['Horário', formatTime(appointment.appointment_time)],
        ])}
        <p>Caso queira reagendar, entre em contato com o salão.</p>
        <hr/>
        <p style="color:#6c757d; font-size:12px;">Este é um e-mail automático. Por favor, não responda.</p>
      </div>`;

    try {
      await transporter.sendMail({ from: emailFrom(), to: appointment.client_email, subject, html });
      console.log(`[Email] Cancelamento enviado para ${appointment.client_email}`);
    } catch (err) {
      console.error(`[Email] Falha ao enviar cancelamento para ${appointment.client_email}:`, err.message);
    }
  });
}

function sendAdminCancellationNotice(appointment, service) {
  setImmediate(async () => {
    const recipients = await getAdminRecipients();
    if (recipients.length === 0) return;

    const subject = `Cancelamento de Agendamento - ${salonName()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">⚠️ Cancelamento realizado pelo cliente</h2>
        <p>O cliente abaixo cancelou um agendamento pela área logada. O horário foi liberado na agenda.</p>
        ${detailsTable([
          ['Cliente', appointment.client_name],
          ['Contato', appointment.client_phone || '—'],
          ['Serviço', service.name],
          ['Data', formatDate(appointment.appointment_date)],
          ['Horário', formatTime(appointment.appointment_time)],
        ])}
        <hr/>
        <p style="color:#6c757d; font-size:12px;">Este é um e-mail automático. Por favor, não responda.</p>
      </div>`;

    try {
      await transporter.sendMail({ from: emailFrom(), to: recipients.join(', '), subject, html });
      console.log(`[Email] Notificação de cancelamento enviada ao admin (${recipients.join(', ')})`);
    } catch (err) {
      console.error('[Email] Falha ao notificar admin sobre cancelamento:', err.message);
    }
  });
}

function sendPasswordResetEmail(user, code, ttlMinutes) {
  setImmediate(async () => {
    if (!user.email) return;

    const subject = `Recuperação de Senha - ${salonName()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🔒 Recuperação de Senha</h2>
        <p>Olá, <strong>${user.name}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para concluir o processo:</p>
        <p style="text-align:center; margin: 24px 0;">
          <span style="display:inline-block; font-size:32px; letter-spacing:8px; font-weight:bold; color:#2c3e50; background:#f8f9fa; border:1px solid #dee2e6; border-radius:8px; padding:12px 24px;">${code}</span>
        </p>
        <p>Este código expira em <strong>${ttlMinutes} minutos</strong>.</p>
        <p>Se você não solicitou esta alteração, ignore este e-mail — sua senha permanecerá a mesma.</p>
        <hr/>
        <p style="color:#6c757d; font-size:12px;">Este é um e-mail automático. Por favor, não responda.</p>
      </div>`;

    try {
      await transporter.sendMail({ from: emailFrom(), to: user.email, subject, html });
      console.log(`[Email] Código de recuperação enviado para ${user.email}`);
    } catch (err) {
      console.error(`[Email] Falha ao enviar código de recuperação para ${user.email}:`, err.message);
    }
  });
}

module.exports = {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendAdminCancellationNotice,
  sendPasswordResetEmail,
};
