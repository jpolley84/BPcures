// One-shot: send Wakita's Week 1 plan email.
// Reviewed in chat 2026-05-19. No BP framing (she's stress/cortisol).
// Run: node scripts/send-wakita-week1-plan.mjs

import 'dotenv/config';
import { Resend } from 'resend';

const TO = 'wconssandra@gmail.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Your Week 1 plan + a few updates';

const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 30px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">Joel Polley, RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Week 1 &middot; 90-Day Coaching</div>
      </td></tr>

      <tr><td style="padding:24px 30px 0;">
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">Hi Wakita,</p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">I went through your intake yesterday. Honestly &mdash; nothing surprised me. Your protocol continues exactly as we mapped it. The foundation is solid, your awareness is clear, and the work over these 90 days is about implementation, not diagnosis.</p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">Here&#8217;s what&#8217;s ahead.</p>
      </td></tr>

      <tr><td style="padding:20px 30px 0;">
        <div style="border-left:3px solid #4A6741;padding:4px 0 4px 18px;margin:0 0 20px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#4A6741;font-weight:700;margin-bottom:10px;">This Week &mdash; Gratitude + Listening to God</div>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">This is the heart of Week 1. Two sessions a day:</p>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;"><strong style="color:#2C3E50;">Morning.</strong> Write 25 things you&#8217;re grateful for. Then sit in a season of listening &mdash; let God speak in answer to:</p>
          <p style="font-family:Georgia,serif;font-size:18px;line-height:1.4;color:#B85A36;margin:0 0 18px 14px;font-style:italic;">&ldquo;What do you want me to know?&rdquo;</p>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;"><strong style="color:#2C3E50;">Evening.</strong> 25 things again &mdash; written or spoken aloud, however it lands that day. Then another season of listening for God to answer:</p>
          <p style="font-family:Georgia,serif;font-size:18px;line-height:1.4;color:#B85A36;margin:0 0 16px 14px;font-style:italic;">&ldquo;What do you want me to do?&rdquo;</p>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0;">What you write and what God speaks to you stays between you and Him. That&#8217;s the point. I&#8217;m not asking you to share the lists. I&#8217;m doing the same practice alongside you for the full 90 days &mdash; you&#8217;re not in any of it alone.</p>
        </div>
      </td></tr>

      <tr><td style="padding:8px 30px 0;">
        <div style="border-left:3px solid #B85A36;padding:4px 0 4px 18px;margin:0 0 20px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:700;margin-bottom:10px;">Next Sunday &mdash; Master Cleanse (3 days)</div>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">Starting next Sunday we go into a 3-day Master Cleanse together. Pick up the following over the next few days:</p>
          <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">&rarr; <strong style="color:#2C3E50;">Fresh lemons</strong> &mdash; organic if you can. You&#8217;ll want 12&ndash;15 for 3 days.</p>
          <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">&rarr; <strong style="color:#2C3E50;">Real maple syrup</strong> &mdash; Grade B or dark amber. Not pancake syrup.</p>
          <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">&rarr; <strong style="color:#2C3E50;">Cayenne pepper</strong> &mdash; fresh, not the jar that&#8217;s been in your cupboard since 2022.</p>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">Each morning starts with a <strong>quart of warm salt water to flush the bowels.</strong> Then throughout the day, any time hunger or thirst shows up, you drink the lemonade mixture freely &mdash; as much as you need.</p>
          <p style="font-size:14px;line-height:1.6;color:#7A7061;margin:0;font-style:italic;">Full instructions will follow in a separate email this week.</p>
        </div>
      </td></tr>

      <tr><td style="padding:8px 30px 0;">
        <div style="border-left:3px solid #4A6741;padding:4px 0 4px 18px;margin:0 0 20px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#4A6741;font-weight:700;margin-bottom:10px;">Schedule &mdash; Sunday 8 PM Central</div>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">I&#8217;m moving our weekly call to <strong style="color:#2C3E50;">Sunday nights at 8 PM Central</strong> &mdash; that&#8217;s <strong style="color:#2C3E50;">6 PM Pacific</strong> where you are in Mexico right now. Same Zoom link as our prior calls. Same depth, better rhythm for both of us.</p>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">I&#8217;m also still going live on <strong style="color:#2C3E50;">Mondays at 9 PM Central.</strong> You have premium access &mdash; feel free to drop into that Zoom anytime you want. Same link.</p>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0;">We&#8217;ll stay in touch through the week on <strong style="color:#2C3E50;">WhatsApp</strong> &mdash; that&#8217;s the fastest line to me between calls. I&#8217;ll also message you if any other lives or sessions pop up that I want you in.</p>
        </div>
      </td></tr>

      <tr><td style="padding:8px 30px 0;">
        <div style="border-left:3px solid #B85A36;padding:4px 0 4px 18px;margin:0 0 24px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:700;margin-bottom:10px;">Skool VIP &mdash; Free Access for 90 Days</div>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">I&#8217;m upgrading you to VIP in the BraveWorks Skool community:</p>
          <p style="margin:0 0 14px;"><a href="https://www.skool.com/how-to-be-your-own-doctor-8010/about" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.02em;">Join the community &rarr;</a></p>
          <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 10px;">VIP gets you <strong style="color:#2C3E50;">free access to every course, every PDF, every protocol I&#8217;ve published</strong> &mdash; for the full 90 days of our coaching. Use what resonates. Skip what doesn&#8217;t. It&#8217;s all yours.</p>
          <p style="font-size:14px;line-height:1.6;color:#7A7061;margin:0;">I&#8217;ll set the VIP permissions on my end once you join.</p>
        </div>
      </td></tr>

      <tr><td style="padding:8px 30px 0;">
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 4px;">&mdash; Joel</p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">Joel Polley, RN</p>

        <div style="border-top:1px solid #E8E2D4;padding-top:18px;">
          <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0;"><strong style="color:#2C3E50;">P.S.</strong> The morning and evening listening sessions are the foundation everything else this week sits on. The cleanse, the supplements, the rest of it &mdash; all of it works better when the listening is happening first. Start tomorrow morning.</p>
        </div>
      </td></tr>

      <tr><td style="padding:20px 30px 28px;"></td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi Wakita,

I went through your intake yesterday. Honestly — nothing surprised me. Your protocol continues exactly as we mapped it. The foundation is solid, your awareness is clear, and the work over these 90 days is about implementation, not diagnosis.

Here's what's ahead.

—

THIS WEEK — Gratitude + Listening to God

This is the heart of Week 1. Two sessions a day:

Morning. Write 25 things you're grateful for. Then sit in a season of listening — let God speak in answer to:
"What do you want me to know?"

Evening. 25 things again — written or spoken aloud, however it lands that day. Then another season of listening for God to answer:
"What do you want me to do?"

What you write and what God speaks to you stays between you and Him. That's the point. I'm not asking you to share the lists. I'm doing the same practice alongside you for the full 90 days — you're not in any of it alone.

—

NEXT SUNDAY — Master Cleanse (3 days)

Starting next Sunday we go into a 3-day Master Cleanse together. Pick up the following over the next few days:

→ Fresh lemons — organic if you can. You'll want 12-15 for 3 days.
→ Real maple syrup — Grade B or dark amber. Not pancake syrup.
→ Cayenne pepper — fresh, not the jar that's been in your cupboard since 2022.

Each morning starts with a quart of warm salt water to flush the bowels. Then throughout the day, any time hunger or thirst shows up, you drink the lemonade mixture freely — as much as you need.

Full instructions will follow in a separate email this week.

—

SCHEDULE — Sunday 8 PM Central

I'm moving our weekly call to Sunday nights at 8 PM Central — that's 6 PM Pacific where you are in Mexico right now. Same Zoom link as our prior calls. Same depth, better rhythm for both of us.

I'm also still going live on Mondays at 9 PM Central. You have premium access — feel free to drop into that Zoom anytime you want. Same link.

We'll stay in touch through the week on WhatsApp — that's the fastest line to me between calls. I'll also message you if any other lives or sessions pop up that I want you in.

—

SKOOL VIP — Free Access for 90 Days

I'm upgrading you to VIP in the BraveWorks Skool community:

https://www.skool.com/how-to-be-your-own-doctor-8010/about

VIP gets you free access to every course, every PDF, every protocol I've published — for the full 90 days of our coaching. Use what resonates. Skip what doesn't. It's all yours.

I'll set the VIP permissions on my end once you join.

—

— Joel
Joel Polley, RN

P.S. The morning and evening listening sessions are the foundation everything else this week sits on. The cleanse, the supplements, the rest of it — all of it works better when the listening is happening first. Start tomorrow morning.`;

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('RESEND_API_KEY missing — set it in .env.local or pass via env');
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: FROM,
  to: [TO],
  replyTo: REPLY_TO,
  subject: SUBJECT,
  html,
  text,
});

if (error) {
  console.error('✗ Send failed:', error);
  process.exit(1);
}

console.log(`✓ Sent to ${TO} → Resend ID: ${data.id}`);
