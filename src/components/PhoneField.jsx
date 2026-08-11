// PhoneField — the one phone input used by every form on the site.
//
// 2026-08-10 (Joel): "make phone numbers universally required where all our
// forms are". This component exists so that is one decision in one place
// rather than nineteen. Every form renders THIS, and every form therefore
// gets the same validation, the same keyboard on mobile, and the same
// consent line.
//
// ── WHY THE CONSENT LINE IS NOT OPTIONAL ─────────────────────────────────
// `note` renders under the field and defaults to a real sentence about what
// the number is for. Do not pass an empty string to hide it. Collecting a
// phone with no stated purpose is the thing that turns a lead list into a
// complaint, and on a health list the person handing it over is often
// anxious about who is going to call her. Say what it is for. If a form
// needs different wording, pass a different `note`, not none.
//
// ── HOW TO MAKE ONE FORM OPTIONAL AGAIN ──────────────────────────────────
// Pass `required={false}`. That is the whole revert for a single form, and
// it is deliberately that easy: if a top-of-funnel form starts bleeding
// conversions, you flip one prop rather than unpicking a rewrite.
//
// autoComplete="tel" + inputMode="tel" matter more than they look: they give
// a 60-year-old on a phone the number pad and her saved number, instead of a
// full qwerty keyboard and a typo.

import { forwardRef } from 'react';

const DEFAULT_NOTE = 'So we can reach you about this. We do not share it, and we do not send marketing texts.';

const PhoneField = forwardRef(function PhoneField(
  {
    value,
    onChange,
    required = true,
    id = 'phone',
    label = 'Phone number',
    note = DEFAULT_NOTE,
    placeholder = '(555) 555-5555',
    error = '',
    style = {},
    inputStyle = {},
    labelStyle = {},
    noteStyle = {},
    dark = false,
  },
  ref
) {
  const muted = dark ? 'rgba(255,255,255,0.68)' : '#666666';
  const text = dark ? '#FFFFFF' : '#1A1A1A';

  return (
    <div style={{ margin: '0 0 18px', ...style }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontSize: 15, fontWeight: 600, color: text, ...labelStyle }}>
        {label}{required ? '' : ' (optional)'}
      </label>
      <input
        ref={ref}
        id={id}
        name="phone"
        type="tel"
        required={required}
        autoComplete="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={`${id}-note`}
        style={{
          width: '100%', padding: '13px 14px', fontSize: 16, borderRadius: 5,
          border: `1px solid ${error ? '#B4321F' : '#E2E2E2'}`,
          background: dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
          color: text, fontFamily: 'inherit', boxSizing: 'border-box',
          ...inputStyle,
        }}
      />
      <p id={`${id}-note`} style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.5, color: muted, ...noteStyle }}>
        {note}
      </p>
      {error && (
        <p role="alert" style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#B4321F' }}>{error}</p>
      )}
    </div>
  );
});

export default PhoneField;
