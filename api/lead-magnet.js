import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Update this URL to wherever you host the cookbook PDF
const COOKBOOK_DOWNLOAD_URL = `${process.env.VITE_SITE_URL || 'https://bpcures.com'}/downloads/cook-for-life-cookbook.pdf`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    await resend.emails.send({
      from: 'BraveWorks RN <braveworksrn@gmail.com>',
      to: email,
      subject: 'Your Free Cook for Life Cookbook',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h1 style="color: #2C3E50; font-size: 24px; margin-bottom: 16px;">
            Here's your Cook for Life Cookbook
          </h1>
          <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Thanks for grabbing a copy. Inside you'll find 45+ plant-based recipes, a 14-day meal plan,
            shopping lists, and a 4-day juice detox — all designed around the herbs and foods that
            actually move your blood pressure numbers.
          </p>
          <a href="${COOKBOOK_DOWNLOAD_URL}"
             style="display: inline-block; background-color: #6C3483; color: white; padding: 14px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Download Your Cookbook
          </a>
          <p style="color: #9CA3AF; font-size: 14px; margin-top: 32px; line-height: 1.5;">
            Want the full protocol? The <strong>Blood Pressure Reset Kit</strong> includes 7 guides,
            47 herbs, daily checklists, and the Overmedicated Boomers book — all for $17.
          </p>
          <a href="${process.env.VITE_SITE_URL || 'https://bpcures.com'}"
             style="color: #6C3483; font-size: 14px;">
            Get the BP Reset Kit &rarr;
          </a>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0 16px;" />
          <p style="color: #9CA3AF; font-size: 12px;">
            BraveWorks RN &mdash; Joel Polley, RN | Naturopathic Practitioner
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err.message);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
