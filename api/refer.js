// api/refer.js — friend-and-family referral enrollment.
//
// 2026-07-17 (Joel): every sequence email footer invites the reader to forward
// the email OR reply with a friend's address to get them the free Blueprint.
// Replies land in braveworksrn@ Gmail and are processed by api/referral-scan.js
// (or a scheduled scan), which calls THIS endpoint per address.
//
// Consent kept clean: the referred person gets ONE value-first welcome email
// with the Blueprint + a one-click unsubscribe, and is told plainly that a few
// follow-up notes will come and they can stop anytime. Only non-unsubscribed,
// not-already-enrolled addresses are added. This protects domain health after
// the 2026-07-16 cold blast.
//
// POST { email, referredBy?, secret } -> { ok, status: 'enrolled'|'skipped', reason? }
// `secret` must equal process.env.REFERRAL_SECRET (the scanner passes it) so a
// random web caller cannot mass-enroll strangers.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { signUnsubToken } from './triangle-unsubscribe.js';
import { FROM, REPLY_TO, SITE_URL, p, ctaButton, buildEmail } from './_triangle-email.js';

const BLUEPRINT_URL = `${SITE_URL}/downloads/bp-blueprint.pdf`;

function referralEmail({ firstName, referredBy, unsubUrl }) {
  const who = referredBy ? `Someone who cares about you (${referredBy})` : 'Someone who cares about you';
  const preheader = 'A free gift a friend wanted you to have. No catch.';
  const bodyHtml = [
    p(`Hi${firstName ? ' ' + firstName : ''},`),
    p(`${who} thought this might help you, so they asked me to send it your way. I am Joel Polley, a nurse of 20 years in the ICU and ER, and this is my free Blood Pressure Blueprint.`),
    p(`It walks you through the 5 hidden triggers I watched drive blood pressure up for two decades. Stress. Sugar. Sodium. Poor sleep. Sitting too long. Most people are fighting the wrong one. This shows you how to spot yours.`),
    ctaButton('Get The Free BP Blueprint', BLUEPRINT_URL),
    p(`I will also send you a few short follow-up notes over the next couple of weeks, the same teaching I give everyone. If that is not for you, just tap unsubscribe at the bottom and you will not hear from me again. No hard feelings.`),
    p(`Glad you are here,`),
    p(`Joel Polley, RN`),
  ].join('');
  const bodyText = `Hi${firstName ? ' ' + firstName : ''},

${who} thought this might help you, so they asked me to send it your way. I am Joel Polley, a nurse of 20 years in the ICU and ER, and this is my free Blood Pressure Blueprint.

It walks you through the 5 hidden triggers I watched drive blood pressure up for two decades. Stress. Sugar. Sodium. Poor sleep. Sitting too long. Most people are fighting the wrong one. This shows you how to spot yours.

Get the free BP Blueprint: ${BLUEPRINT_URL}

I will also send you a few short follow-up notes over the next couple of weeks, the same teaching I give everyone. If that is not for you, just tap unsubscribe at the bottom and you will not hear from me again. No hard feelings.

Glad you are here,
Joel Polley, RN`;
  return buildEmail({ preheader, bodyHtml, bodyText, unsubUrl });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  if (process.env.REFERRAL_SECRET && body.secret !== process.env.REFERRAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const referredBy = typeof body.referredBy === 'string' ? body.referredBy.trim().slice(0, 200) : '';

  const dripKey = `bwbp:drip:${email}`;
  try {
    const existing = await kv.get(dripKey);
    if (existing) {
      // Already known: never re-enroll, never re-email a mid-sequence contact,
      // and respect an unsubscribe absolutely.
      return res.status(200).json({ ok: true, status: 'skipped', reason: existing.unsubscribed ? 'unsubscribed' : 'already_enrolled' });
    }
    // Also honor a legacy-rail unsubscribe tombstone.
    const legacy = await kv.get(`drip:${email}`);
    if (legacy && legacy.unsubscribed) {
      return res.status(200).json({ ok: true, status: 'skipped', reason: 'unsubscribed' });
    }
  } catch (err) {
    console.warn('refer: KV read failed (continuing)', err.message);
  }

  const now = new Date().toISOString();
  // leadDay0Sent:true — the referral welcome below IS their day-0 touch; the
  // cron must not also send the quiz-result Email 1 (they never took the quiz).
  const record = {
    email,
    firstName: '',
    state: 'lead',
    stateEnteredAt: now,
    leadDay0Sent: true,
    source: 'referral',
    ...(referredBy ? { referredBy } : {}),
    enrolledAt: now,
  };

  const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${signUnsubToken({ email })}`;
  const { html, text } = referralEmail({ firstName: '', referredBy, unsubUrl });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject: 'A friend wanted you to have this',
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  } catch (err) {
    console.error('refer: send failed', err.message);
    return res.status(500).json({ error: 'send_failed' });
  }

  // Enroll only AFTER a successful send (so a failed send can be retried).
  try {
    await kv.set(dripKey, record);
  } catch (err) {
    console.warn('refer: KV write failed (email sent)', err.message);
  }

  return res.status(200).json({ ok: true, status: 'enrolled' });
}
