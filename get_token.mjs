import { google } from "googleapis";
import http from "http";
import { URL } from "url";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}`;

async function getRefreshToken() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.force-ssl"
    ],
    prompt: "consent", // Force refresh token generation
  });

  console.log("\n🚀 Starting OAuth Flow...");
  console.log("1. Open this URL in your browser and log in:");
  console.log(`\n\x1b[36m${authUrl}\x1b[0m\n`);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.indexOf("favicon.ico") > -1) return;
      
      const qs = new URL(req.url, REDIRECT_URI).searchParams;
      const code = qs.get("code");

      if (code) {
        res.end("Authentication successful! You can close this tab and return to the terminal.");
        
        const { tokens } = await oauth2Client.getToken(code);
        console.log("\n✅ SUCCESS! Here is your Refresh Token:\n");
        console.log("\x1b[32m" + tokens.refresh_token + "\x1b[0m");
        console.log("\nCopy this value and add it to your GOOGLE_REFRESH_TOKEN secret on GitHub.");
        
        server.close();
        process.exit(0);
      }
    } catch (e) {
      res.end("Error occurred. Check terminal.");
      console.error("❌ Error fetching token:", e.message);
      process.exit(1);
    }
  }).listen(PORT, () => {
    console.log(`2. Waiting for authorization... (listening on ${REDIRECT_URI})`);
    console.log("(Press Ctrl+C to cancel if you get stuck)\n");
  });
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_ID.includes("YOUR_")) {
  console.error("❌ Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing or invalid in your .env file.");
  console.log("Please fill them in before running this script.");
  process.exit(1);
}

getRefreshToken();
