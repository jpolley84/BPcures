# The 90-Day Health Prep Checklist (PREP lead magnet)

Built 2026-10-27 for Joel's Facebook video "Doomsday Is Everywhere. Is Your Health Ready?" (comment PREP).

| Piece | File |
|---|---|
| Checklist source (edit this, then re-render) | `content/health-prep/90-day-health-prep-checklist.html` |
| Checklist PDF (served at bpquiz.com/downloads/90-day-health-prep-checklist.pdf) | `public/downloads/90-day-health-prep-checklist.pdf` |
| Opt-in page (bpquiz.com/prep) | `public/prep/index.html`, cover in `public/prep/img/` |
| Capture endpoint | `api/prep-optin.js` (same shape as `api/cleanse-optin.js`) |
| Routing | `vercel.json`: `prep/` and `prep$` added to the static-page exclusions |

## Lists the endpoint writes
- `prep:lead:<email>` and set `prep:leads`: every PREP lead (magnet `health-prep-checklist`, source `prep-squeeze`, `bfEarlyAccess: true`).
- Set `bf:early-access`: the Black Friday early-access list (unsubscribed addresses are never added).
- `drip:<email>` and `bwbp:drip:<email>`: tags `prep`, `health-prep-checklist`, `bf-early-access`, `no-quiz`, state `lead`, same as every other lead magnet.
- `prep:sent:<email>`: one delivery email per address, ever.

## Re-render the PDF and cover
```
chrome --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf=public/downloads/90-day-health-prep-checklist.pdf file:///<abs path>/content/health-prep/90-day-health-prep-checklist.html
```
Then rebuild `public/prep/img/checklist-cover.{jpg,webp}` from page 1 (615 px wide).

## Sources for every fact in the checklist
| Claim | Source |
|---|---|
| Pentagon wants major bases able to run at least 90 days on their own; medical supplies on the list | Fox News, "Pentagon's FORTRESS initiative preps US bases for 90-day survival" (about 2026-10-25) |
| Use a validated upper-arm cuff; US Validated Device Listing | validatebp.org (AMA / AHA) |
| Measure seated after 5 minutes, back supported, feet flat, arm at heart level, 2 readings 1 minute apart | American Heart Association home monitoring guidance |
| Prescription medicines belong in a basic emergency kit | Ready.gov, "Build a Kit" |
| Store at least 1 gallon of water per person per day for several days | Ready.gov, "Build a Kit" |
| 5% Daily Value or less is low; 20% or more is high | FDA, "How to Understand and Use the Nutrition Facts Label" |
| 150 minutes a week of moderate activity | CDC physical activity guidelines for adults |
| Adults need 7 or more hours of sleep | CDC |
| Proverbs 22:3 (KJV) | vault `bible-kjv` KB |
| 180/120 or higher: wait 5 minutes and recheck; with chest pain, shortness of breath, back pain, numbness or weakness, vision change, or trouble speaking, call 911; with no symptoms, call your doctor | American Heart Association, "Hypertensive Crisis: When You Should Call 911 for High Blood Pressure" |
| Measure morning and evening for 7 days | American Heart Association home monitoring guidance (readings at the same times daily; doctors often ask for a week of readings) |
| Heat and moisture can damage medicines; store as the label says | FDA consumer guidance on storing medicines in a cool, dry place (not the bathroom) |
| Potassium salt substitutes need a doctor's okay (kidney disease, some blood pressure medicines) | American Heart Association salt substitute guidance |
| Whole grains and beans over refined grains; fruit canned in water or 100% juice; limit added sugar | Dietary Guidelines for Americans 2020-2025 |
| Ask a pharmacist before a new herbal tea if you take medicine | General drug-herb interaction caution (e.g. hibiscus and blood pressure medicine) |

NEWSTART: plant foods only, caffeine-free drinks, box breathing and prayer. No animal products, caffeine, yoga, or meditation.
