/**
 * Google OAuth Token Generator Script (L-2)
 * Run manually via `node scripts/gmail-auth.js` to generate credentials when rotating tokens.
 * Keep token.json and credentials.json outside version control.
 */

const path = require("path");
const fs = require("fs");
const { authenticate } = require("@google-cloud/local-auth");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
];

const CREDENTIALS_PATH = path.join(
  __dirname,
  "..",
  "credentials.json"
);

const TOKEN_PATH = path.join(
  __dirname,
  "..",
  "token.json"
);

async function authorize() {
  try {
    const auth = await authenticate({
      keyfilePath: CREDENTIALS_PATH,
      scopes: SCOPES,
    });

    console.log("✅ Google authorization successful!");

    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify(auth.credentials, null, 2)
    );

    console.log(`✅ Token saved at: ${TOKEN_PATH}`);
    
    console.log("\nAvailable credentials:");
    console.log({
      hasAccessToken: !!auth.credentials.access_token,
      hasRefreshToken: !!auth.credentials.refresh_token,
      scope: auth.credentials.scope,
    });

    console.log("\n⚠️ Please set GMAIL_REFRESH_TOKEN in your environment variables (.env / Render).");
  } catch (error) {
    console.error("❌ Google authorization failed:", error);
  }
}

authorize();
