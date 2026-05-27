import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_AUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};

async function testAuth() {
  console.log("🔍 Verifying token scopes...");
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_AUTH_CONFIG.clientId,
    GOOGLE_AUTH_CONFIG.clientSecret
  );
  
  oauth2Client.setCredentials({ refresh_token: GOOGLE_AUTH_CONFIG.refreshToken });

  try {
    const { token } = await oauth2Client.getAccessToken();
    console.log("✅ Access token retrieved successfully! Refresh token is VALID.");
    
    const tokenInfo = await oauth2Client.getTokenInfo(token);
    console.log("📦 Token scopes authorized by user:");
    console.log(tokenInfo.scopes);
    
    if (tokenInfo.scopes.includes("https://www.googleapis.com/auth/youtube.upload")) {
      console.log("🚀 SUCCESS! The token has the required 'youtube.upload' permission!");
    } else {
      console.error("❌ ERROR: The token does NOT have the 'youtube.upload' permission!");
    }
  } catch (error) {
    console.error("❌ Verification FAILED:");
    console.error(error.message);
  }
}

testAuth();
