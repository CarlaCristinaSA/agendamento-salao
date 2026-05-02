/**
 * src/services/emailService.js
 * Serviço de envio de e-mails (RN-006, HU-007, RNF-010).
 *
 * O disparo é assíncrono (não bloqueia a confirmação do agendamento).
 * Falhas no envio são logadas, mas não revertem a transação (RN-006, HU-007).
 */

const transporter = require('../config/email');

const salonName  = () => process.env.SALON_NAME  || 'Salão de Beleza';
const emailFrom  = () =>
  `"${process.env.EMAIL_FROM_NAME || salonName()}" <${process.env.EMAIL_FROM || 'nao-responda@salao.com'}>`;

/**
 * Formata data BR: 2026-04-15 → 15/04/2026
 */
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formata valor monetário: 80 → R$ 80,00
 */
function formatCurrency(value) {
  return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

/**
 * Envia e-mail de confirmação de agendamento (HU-007).
 * Executa de forma assíncrona em background (RNF-010).
 *
 * @param {object} appointment - Dados do agendamento
 * @param {object} service     - Dados do serviço
 */
function sendConfirmationEmail(appointment, service) {
  // Disparo em background — não bloqueia o fluxo principal (RNF-010)
  setImmediate(async () => {
    if (!appointment.client_email) return; // e-mail opcional no fluxo admin

    const subject = `Confirmação de Agendamento - ${salonName()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">✅ Agendamento Confirmado!</h2>
        <p>Olá, <strong>${appointment.client_name}</strong>!</p>
        <p>Seu agendamento foi confirmado com sucesso. Veja os detalhes abaixo:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background:#f8f9fa;">
            <td style="padding:10px; border:1px solid #dee2e6;"><strong>Serviço</strong></td>
            <td style="padding:10px; border:1px solid #dee2e6;">${service.name}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #dee2e6;"><strong>Data</strong></td>
            <td style="padding:10px; border:1px solid #dee2e6;">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr style="background:#f8f9fa;">
            <td style="padding:10px; border:1px solid #dee2e6;"><strong>Horário</strong></td>
            <td style="padding:10px; border:1px solid #dee2e6;">${appointment.appointment_time}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #dee2e6;"><strong>Valor</strong></td>
            <td style="padding:10px; border:1px solid #dee2e6;">${formatCurrency(service.price)}</td>
          </tr>
        </table>
        <p style="color:#6c757d; font-size:13px;">
          O pagamento é realizado presencialmente após a conclusão do atendimento.
        </p>
        <hr/>
        <p style="color:#6c757d; font-size:12px;">
          Este é um e-mail automático. Por favor, não responda.
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from:    emailFrom(),
        to:      appointment.client_email,
        subject,
        html,
      });
      console.log(`[Email] Confirmação enviada para ${appointment.client_email}`);
    } catch (err) {
      // RN-006 / HU-007: falha no e-mail não reverte o agendamento
      console.error(`[Email] Falha ao enviar confirmação para ${appointment.client_email}:`, err.message);
    }
  });
}

/**
 * Envia e-mail de cancelamento de agendamento (HU-007, RN-006).
 * Executa de forma assíncrona em background (RNF-010).
 *
 * @param {object} appointment - Dados do agendamento
 * @param {object} service     - Dados do serviço
 */
function sendCancellationEmail(appointment, service) {
  setImmediate(async () => {
    if (!appointment.client_email) return;

    const subject = `Cancelamento de Agendamento - ${salonName()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">❌ Agendamento Cancelado</h2>
        <p>Olá, <strong>${appointment.client_name}</strong>!</p>
        <p>Informamos que o seu agendamento foi <strong>cancelado</strong>. Veja os detalhes:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background:#f8f9fa;">
            <td style="padding:10px; border:1px solid #dee2e6;"><strong>Serviço</strong></td>
            <td style="padding:10px; border:1px solid #dee2e6;">${service.name}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #dee2e6;"><strong>Data</strong></td>
            <td style="padding:10px; border:1px solid #dee2e6;">${formatDate(appointment.appointment_date)}</td>
          </tr>
          <tr style="background:#f8f9fa;">
            <td style="padding:10px; border:1px solid #dee2e6;"><strong>Horário</strong></td>
            <td style="padding:10px; border:1px solid #dee2e6;">${appointment.appointment_time}</td>
          </tr>
        </table>
        <p>Lamentamos o ocorrido. Entre em contato conosco para reagendar.</p>
        <hr/>
        <p style="color:#6c757d; font-size:12px;">
          Este é um e-mail automático. Por favor, não responda.
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from:    emailFrom(),
        to:      appointment.client_email,
        subject,
        html,
      });
      console.log(`[Email] Cancelamento enviado para ${appointment.client_email}`);
    } catch (err) {
      console.error(`[Email] Falha ao enviar cancelamento para ${appointment.client_email}:`, err.message);
    }
  });
}

module.exports = { sendConfirmationEmail, sendCancellationEmail };
