// scripts/setup-gmail-oauth.mjs
//
// One-shot Gmail OAuth refresh-token minter. Run ONCE locally to bootstrap
// the reply-agent. The output (refresh token) goes into Vercel env.
//
// PREREQUISITES:
//   1. Google Cloud Console → create or pick a project
//   2. Enable Gmail API
//   3. APIs & Services → OAuth consent screen → External, add your Gmail
//      address as a Test user
//   4. APIs & Services → Credentials → Create OAuth Client ID
//      • Application type: Desktop app
//      • Save the client ID + secret
//
// USAGE (Windows PowerShell):
//   $env:GMAIL_OAUTH_CLIENT_ID    = "xxxx.apps.googleusercontent.com"
//   $env:GMAIL_OAUTH_CLIENT_SECRET = "yyyy"
//   node scripts/setup-gmail-oauth.mjs
//
// The script will:
//   • Print an auth URL
//   • Wait for you to paste back the ?code=... value from the redirect
//   • Exchange the code for a refresh_token
//   • Print the refresh_token (paste into Vercel as GMAIL_OAUTH_REFRESH_TOKEN)

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

// Tiny .env.local loader (no dep). Picks up vars unless already set in process env.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const CLIENT_ID = process.env.GMAIL_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_OAUTH_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET in env or .env.local first.');
  process.exit(1);
}

// "urn:ietf:wg:oauth:2.0:oob" is deprecated; use localhost redirect.
// For a Desktop OAuth client, Google accepts http://localhost (no port) and
// redirects with the auth code in the URL. Just copy the `code` query param.
const REDIRECT_URI = 'http://localhost';
const SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces refresh_token to be returned every time
  scope: [SCOPE],
});

console.log('\n━━━━━━━━━━ GMAIL OAUTH SETUP ━━━━━━━━━━\n');
console.log('1) Open this URL in your browser (signed in as Joel\'s Gmail):\n');
console.log(authUrl);
console.log('\n2) Approve the consent screen.');
console.log('3) Browser will redirect to http://localhost/?code=XXXXX&scope=... (will show "site can\'t be reached" — that\'s fine).');
console.log('4) Copy the value of ?code= from the URL bar.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the code here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2.getToken(code.trim());
    console.log('\n━━━━━━━━━━ SUCCESS ━━━━━━━━━━\n');
    console.log('Add these to Vercel env (Project → Settings → Environment Variables):\n');
    console.log(`  GMAIL_OAUTH_CLIENT_ID     = ${CLIENT_ID}`);
    console.log(`  GMAIL_OAUTH_CLIENT_SECRET = ${CLIENT_SECRET}`);
    console.log(`  GMAIL_OAUTH_REFRESH_TOKEN = ${tokens.refresh_token}`);
    console.log(`  ANTHROPIC_API_KEY         = (already set, but verify)`);
    console.log('\nOptional:');
    console.log('  GMAIL_INBOX_ADDRESS       = braveworksrn@gmail.com  (default)');
    console.log('  REPLY_AGENT_DIGEST_TO     = brave.works.marketing@gmail.com  (default)');
    console.log('  REPLY_AGENT_FROM_NAME     = Joel Polley, RN  (default)');
    console.log('\nFirst cron fires daily at 1:00 UTC (8 PM CT).');
    console.log('Manual test after env is set: curl https://bpquiz.com/api/reply-agent');
  } catch (err) {
    console.error('\nFailed to exchange code for tokens:', err.message);
    process.exit(1);
  }
});
