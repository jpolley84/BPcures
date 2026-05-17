// scripts/send-wakita-week1-summary.mjs
//
// One-shot post-call summary email to Cassandra (Wakita Cirillo Browne)
// after the 2026-05-17 Sunday coaching call. Captures the Week-1 protocol
// Joel set during the call, the "be still" framework, the hydration
// mechanics, and includes Joel's mobile (717-585-9505) for the WhatsApp
// group creation.
//
// USAGE:
//   node --env-file=.env.production scripts/send-wakita-week1-summary.mjs --dry-run
//   node --env-file=.env.production scripts/send-wakita-week1-summary.mjs --send

import { Resend } from 'resend';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const SEND = argv.includes('--send');

if (!DRY_RUN && !SEND) {
  console.error('Required flag: --dry-run or --send');
  process.exit(1);
}
if (SEND && !process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY not set — load .env.production');
  process.exit(1);
}

const TO_EMAIL = 'wconssandra@gmail.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Cassandra — Week 1 + my number for WhatsApp';

const TEXT = `Cassandra,

Today's call mattered. I want you to walk out of it with one thing locked in: this week, simplicity is the protocol. We're not stacking more — we're stripping back to the foundation underneath everything.

Be still. Listen. Trust that the path forward is going to be revealed, one quiet week at a time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WEEK 1 — YOUR ONLY PROTOCOL

1. Twenty-five gratitudes upon waking, followed by 5-10 minutes of listening prayer.
2. Twenty-five gratitudes before sleep, followed by 5-10 minutes of listening prayer.
3. Sip one 84-oz container (roughly a gallon) of water through the day, with Celtic salt rocks under your tongue about every 8 oz.

That's it. No other protocol changes this week. No new supplements to think about. No "and also try this." Just the three above.

The listening prayer is two questions:
  • "What do you need me to know?"
  • "What do you want me to do?"

Stay focused on Jesus and on gratitude — not emptying the mind, just turning your attention toward Him. Notice the thoughts, pictures, and impressions that come. Write them down if you can (Annie writes 100 a day). External expression is stronger than purely mental.

Pictures and impressions you get this week become the puzzle pieces I work with for the next three months.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE WHY (BRIEFLY)

Your brain can't hold gratitude and stress at the same time. Multitasking is rapid switching, not parallel. So while you're generating 25 gratitudes, the chronic-illness loop ("this hurts, this isn't working, I'm in pain") has to step aside. That's the mechanism. That's how the rewiring starts.

You've already done the hard part — you've accumulated more protocol knowledge than 99% of people walking this road. Now we shut all of that down for one week so we can hear what's underneath it. Not knowing what to do and not doing it are two different things — and you said it yourself: at a certain age, you already know.

This week we go to the engine and turn the key.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HYDRATION — THE 24-HOUR DELAY

A few things I want you to keep in mind as you sip:

  • What you drink today hydrates you tomorrow. There's a 24-hour delay.
  • Urine should stay pale yellow to clear. If you feel thirsty, you're already about 4 cups behind.
  • Mental cue: every time you urinate, take a sip on the way back. The bathroom IS the reminder.
  • Waking at night to urinate often means dehydration, not too much water. A chronically dry body becomes hypersensitive to a less-than-full bladder. Once you hydrate steadily for 12-24 hours, the bladder calms down and you'll sleep through.
  • You're in Mexico — heat + perspiration means you may need more than the gallon, not less.

Celtic salt rocks under the tongue every 8 oz pull the water into your cells. Without the minerals, water passes through.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABOUT YOUR BP (118/72 THIS MORNING)

I don't want you anchored to those numbers this week. Yours are normal, but normal doesn't mean healthy when chronic stress is in the picture. Stress can exhaust the body's mechanisms that would otherwise push BP up — so the number stays clean even when the engine is straining. You look younger than you are on the outside; the inside has been carrying more than the readings show. We listen to your body over the cuff. The cuff catches up later.

Same with hormone panels (thyroid, cortisol) — interesting to have on file, but they won't dictate what we do. Symptoms first, labs second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BIOLIFE — YOUR DISCERNMENT IS CORRECT

You felt the spirit of it pulling toward crystals and esoteric practice, and you noticed the practitioner kept telling you "it's working, it's working" while your body wasn't saying the same thing. That's the gift of discernment, and you used it well. Complete the last session if you've already paid for it. After that, we're done with that road.

The supplements were fine. The heated magnetic mat was probably just the heat doing the work. We don't need the rest.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHATSAPP — TEXT ME

Here's my mobile so we can spin up the group:

  Joel — 717-585-9505

Text me when you get this. I'll create the BraveWorks Sprint WhatsApp group from there. Office hours run Sun-Thu, 9 AM - 5 PM ET, so you can drop a question or check-in any time in that window.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOMORROW

  • One-on-one: 8 PM Central (6 PM Pacific for you)
  • Group live coaching: noon Central (10 AM Pacific) — separate call right before our 1:1 won't conflict
  • I'm reviewing your deep-dive intake before we meet, so we hit the ground running

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ONE LAST THING

I'm walking this week with you. Same 25-and-25, same two questions, asking specifically about how to coach you. You're not doing this alone, and neither am I. Be still. Listen.

"Be still and know that I am God." — that's the sentence God gave me through my daughter's NICU stay. He gave it to me to give to you this week.

See you tomorrow at 8.

Joel Polley, RN
BraveWorks
`;

const HTML = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,serif;color:#2C2A26;line-height:1.7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFDF7;border-radius:14px;border:1px solid #E6DECE;">
  <tr><td style="padding:36px 32px 8px;">
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;margin-bottom:18px;">BraveWorks Sprint · Week 1 summary</div>
    <p style="font-family:Georgia,serif;font-size:18px;font-style:italic;color:#5B564C;margin:0 0 24px;">Cassandra,</p>

    <p style="font-size:15.5px;margin:0 0 14px;">Today's call mattered. I want you to walk out of it with one thing locked in: <strong>this week, simplicity is the protocol</strong>. We're not stacking more — we're stripping back to the foundation underneath everything.</p>
    <p style="font-size:15.5px;margin:0 0 24px;">Be still. Listen. Trust that the path forward is going to be revealed, one quiet week at a time.</p>

    <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 24px;" />

    <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 12px;">Week 1 — your only protocol</p>
    <ol style="font-size:15px;padding-left:22px;margin:0 0 18px;line-height:1.7;">
      <li style="margin-bottom:8px;"><strong>Twenty-five gratitudes upon waking</strong>, followed by 5-10 minutes of listening prayer.</li>
      <li style="margin-bottom:8px;"><strong>Twenty-five gratitudes before sleep</strong>, followed by 5-10 minutes of listening prayer.</li>
      <li style="margin-bottom:8px;"><strong>Sip one 84-oz container</strong> (roughly a gallon) of water through the day, with <strong>Celtic salt rocks under your tongue about every 8 oz</strong>.</li>
    </ol>
    <p style="font-size:15px;margin:0 0 14px;color:#5B564C;font-style:italic;">That's it. No other protocol changes this week. No new supplements to think about. No "and also try this." Just the three above.</p>

    <p style="font-size:15px;margin:0 0 6px;">The listening prayer is two questions:</p>
    <ul style="font-size:15px;padding-left:22px;margin:0 0 14px;line-height:1.7;">
      <li>"What do you need me to know?"</li>
      <li>"What do you want me to do?"</li>
    </ul>
    <p style="font-size:15px;margin:0 0 14px;">Stay focused on Jesus and on gratitude — not emptying the mind, just turning your attention toward Him. Notice the thoughts, pictures, and impressions that come. Write them down if you can (Annie writes 100 a day). External expression is stronger than purely mental.</p>
    <p style="font-size:15px;margin:0 0 24px;color:#5B564C;font-style:italic;">Pictures and impressions you get this week become the puzzle pieces I work with for the next three months.</p>

    <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 24px;" />

    <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 12px;">The why (briefly)</p>
    <p style="font-size:15px;margin:0 0 14px;">Your brain can't hold gratitude and stress at the same time. Multitasking is rapid switching, not parallel. So while you're generating 25 gratitudes, the chronic-illness loop ("this hurts, this isn't working, I'm in pain") has to step aside. <strong>That's the mechanism.</strong> That's how the rewiring starts.</p>
    <p style="font-size:15px;margin:0 0 14px;">You've already done the hard part — you've accumulated more protocol knowledge than 99% of people walking this road. Now we shut all of that down for one week so we can hear what's underneath it. Not knowing what to do and not doing it are two different things — and you said it yourself: at a certain age, you already know.</p>
    <p style="font-size:15px;margin:0 0 24px;">This week we go to the engine and turn the key.</p>

    <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 24px;" />

    <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 12px;">Hydration — the 24-hour delay</p>
    <ul style="font-size:15px;padding-left:22px;margin:0 0 14px;line-height:1.7;">
      <li style="margin-bottom:6px;">What you drink today hydrates you <em>tomorrow</em>. There's a 24-hour delay.</li>
      <li style="margin-bottom:6px;">Urine should stay pale yellow to clear. If you feel thirsty, you're already about 4 cups behind.</li>
      <li style="margin-bottom:6px;">Mental cue: every time you urinate, take a sip on the way back. The bathroom IS the reminder.</li>
      <li style="margin-bottom:6px;">Waking at night to urinate often means <em>dehydration</em>, not too much water. A chronically dry body becomes hypersensitive to a less-than-full bladder. Once you hydrate steadily for 12-24 hours, the bladder calms down and you'll sleep through.</li>
      <li style="margin-bottom:6px;">You're in Mexico — heat + perspiration means you may need <strong>more</strong> than the gallon, not less.</li>
    </ul>
    <p style="font-size:15px;margin:0 0 24px;">Celtic salt rocks under the tongue every 8 oz pull the water into your cells. Without the minerals, water passes through.</p>

    <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 24px;" />

    <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 12px;">About your BP (118/72 this morning)</p>
    <p style="font-size:15px;margin:0 0 24px;">I don't want you anchored to those numbers this week. Yours are normal, but normal doesn't mean healthy when chronic stress is in the picture. Stress can exhaust the body's mechanisms that would otherwise push BP up — so the number stays clean even when the engine is straining. You look younger than you are on the outside; the inside has been carrying more than the readings show. <strong>We listen to your body over the cuff.</strong> The cuff catches up later. Same with hormone panels (thyroid, cortisol) — interesting to have on file, but they won't dictate what we do. Symptoms first, labs second.</p>

    <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 24px;" />

    <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 12px;">BioLife — your discernment is correct</p>
    <p style="font-size:15px;margin:0 0 24px;">You felt the spirit of it pulling toward crystals and esoteric practice, and you noticed the practitioner kept telling you "it's working, it's working" while your body wasn't saying the same thing. That's the gift of discernment, and you used it well. Complete the last session if you've already paid for it. After that, we're done with that road. The supplements were fine. The heated magnetic mat was probably just the heat doing the work. We don't need the rest.</p>

    <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 24px;" />

    <div style="background:#E6EBE0;border-left:3px solid #3F5A3C;border-radius:6px;padding:18px 20px;margin:0 0 24px;">
      <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 8px;">WhatsApp — text me</p>
      <p style="font-size:15px;margin:0 0 8px;">Here's my mobile so we can spin up the group:</p>
      <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#2C2A26;margin:0 0 10px;letter-spacing:0.02em;">717-585-9505</p>
      <p style="font-size:14px;margin:0;color:#5B564C;">Text me when you get this. I'll create the BraveWorks Sprint WhatsApp group from there. Office hours run Sun-Thu, 9 AM-5 PM ET.</p>
    </div>

    <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 12px;">Tomorrow</p>
    <ul style="font-size:15px;padding-left:22px;margin:0 0 24px;line-height:1.7;">
      <li><strong>One-on-one:</strong> 8 PM Central (6 PM Pacific for you)</li>
      <li><strong>Group live coaching:</strong> noon Central (10 AM Pacific) — separate call right before, won't conflict</li>
      <li>I'm reviewing your deep-dive intake before we meet, so we hit the ground running</li>
    </ul>

    <hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 24px;" />

    <p style="font-size:15px;margin:0 0 12px;">I'm walking this week with you. Same 25-and-25, same two questions, asking specifically about how to coach you. You're not doing this alone, and neither am I.</p>
    <p style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#3F5A3C;margin:0 0 8px;line-height:1.5;">"Be still and know that I am God."</p>
    <p style="font-size:14px;color:#5B564C;margin:0 0 24px;font-style:italic;">That's the sentence God gave me through my daughter's NICU stay. He gave it to me to give to you this week.</p>

    <p style="font-size:15px;margin:24px 0 4px;">See you tomorrow at 8.</p>
    <p style="font-family:Georgia,serif;font-size:17px;font-weight:600;color:#2C2A26;margin:0 0 2px;">Joel Polley, RN</p>
    <p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 28px;">BraveWorks</p>
  </td></tr>
</table>
<p style="font-size:11px;color:#9C9485;margin:18px 0 0;font-family:-apple-system,sans-serif;">BraveWorks RN · braveworksrn@gmail.com · bpquiz.com</p>
</td></tr></table>
</body></html>`;

console.log(`→ TO: ${TO_EMAIL}`);
console.log(`→ FROM: ${FROM}`);
console.log(`→ SUBJECT: ${SUBJECT}`);
console.log(`→ MODE: ${DRY_RUN ? 'DRY RUN (no send)' : 'SEND'}`);
console.log('');

if (DRY_RUN) {
  console.log('— TEXT BODY —');
  console.log(TEXT);
  console.log('--- (HTML body suppressed in dry run; pass --send to actually send) ---');
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
try {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO_EMAIL,
    replyTo: REPLY_TO,
    subject: SUBJECT,
    text: TEXT,
    html: HTML,
  });
  if (error) {
    console.error('✗ Resend error:', error);
    process.exit(1);
  }
  console.log(`✓ Sent. Resend message id: ${data?.id || '(no id returned)'}`);
} catch (err) {
  console.error('✗ Threw:', err.message);
  process.exit(1);
}
