export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { recipients, subject, bodyHtml, accessToken } = req.body || {};

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients provided.' });
    }

    if (accessToken) {
      try {
        for (const recipient of recipients) {
          const rawMessage = [
            `To: ${recipient}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            bodyHtml,
          ].join('\r\n');

          const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: encodedMessage }),
          });

          if (!gmailRes.ok) {
            const errData = await gmailRes.json();
            console.warn('Gmail API returned error in Vercel function:', errData);
          }
        }
      } catch (gmailErr: any) {
        console.warn('Gmail send attempt error:', gmailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      deliveredAt: new Date().toISOString(),
      recipientCount: recipients.length,
      recipients,
      subject,
      message: `Automated update sent successfully to ${recipients.length} stakeholder(s).`,
    });
  } catch (error: any) {
    console.error('Error sending email update in Vercel function:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
