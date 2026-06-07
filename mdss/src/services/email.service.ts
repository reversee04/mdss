import nodemailer from 'nodemailer';

interface EmailConfig {
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; path: string }[];
}

export async function sendEmail(config: EmailConfig): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'test',
      pass: process.env.SMTP_PASSWORD || 'test',
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'mdss@mdss.health.gov.mw',
    to: config.to.join(', '),
    subject: config.subject,
    html: config.html,
    attachments: config.attachments,
  });
}

export function generateAlertEmailHTML(alert: any): string {
  const severityColors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">${alert.alert_type.toUpperCase()} ALERT</h1>
        <p style="margin: 10px 0 0 0;">Severity: ${alert.severity.toUpperCase()}</p>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2>Disease: ${alert.disease.disease_name}</h2>
        <p><strong>Location:</strong> ${alert.district || 'National'}</p>
        <p><strong>Current Cases:</strong> ${alert.current_cases}</p>
        <p><strong>Cases per 100k:</strong> ${alert.cases_per_100k.toFixed(1)}</p>
        <p><strong>Threshold:</strong> ${alert.threshold_value} per 100k</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${alert.sent_at.toLocaleString()}</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>This is an automated alert from the Malawi Disease Surveillance System</p>
      </div>
    </div>
  `;
}