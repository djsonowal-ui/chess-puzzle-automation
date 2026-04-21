import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { getSessionPuzzle } from "./src/utils/fetch-puzzle.mjs";

dotenv.config();

// --- THEME CONFIGURATION ---
const THEMES = {
  morning: {
    title: "Sunrise Solve",
    mateCount: 2,
    colors: { dark: "#b58863", light: "#f0d9b5" }, // Wood
  },
  afternoon: {
    title: "Lunchtime Gambit",
    mateCount: 3,
    colors: { dark: "#769656", light: "#eeeed2" }, // Green
  },
  evening: {
    title: "Twilight Tactics",
    mateCount: 4,
    colors: { dark: "#4b7399", light: "#eaeaea" }, // Blue
  }
};

// --- SESSION SELECTION ---
function getActiveSession() {
  const slotArg = process.argv.find(arg => arg.startsWith("--slot="));
  if (slotArg) {
    const slot = slotArg.split("=")[1].toLowerCase();
    if (THEMES[slot]) return slot;
  }

  const hour = new Date().getHours();
  // 8 AM - 2 PM
  if (hour >= 8 && hour < 14) return "morning";
  // 2 PM - 7 PM
  if (hour >= 14 && hour < 19) return "afternoon";
  // 7 PM - 8 AM
  return "evening";
}

const activeSessionKey = getActiveSession();
const theme = THEMES[activeSessionKey];

const GOOGLE_AUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};

const VIDEO_DETAILS = {
  title: `${theme.title} ♟️ Mate in ${theme.mateCount} | ${new Date().toLocaleDateString()} #shorts`,
  description: `Can you solve this Mate in ${theme.mateCount} puzzle? \n\n#chess #puzzles #chessshorts #checkmate #remotion #lichess #tactics`,
  tags: ["chess", "puzzles", "shorts", "remotion", `matein${theme.mateCount}`],
  category: "24",
};

// --- RENDERING LOGIC ---
async function renderPuzzle(puzzleData) {
  console.log(`🚀 Rendering ${theme.title} (Mate in ${theme.mateCount})...`);
  
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH !== 'ffmpeg') {
    process.env.FFMPEG_PATH = path.resolve(process.env.FFMPEG_PATH);
  }
  
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.jsx"),
    sourceMaps: false,
  });

  const inputProps = {
    ...puzzleData,
    sessionTitle: theme.title,
    mateCount: theme.mateCount,
    colors: theme.colors,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "ChessShort",
    inputProps,
  });

  const outputLocation = `output_${activeSessionKey}.mp4`;
  console.log(`🎬 Rendering to ${outputLocation}...`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps,
    videoBitrate: "50M",
    onProgress: ({ progress }) => {
      process.stdout.write(`⏳ Progress: ${(progress * 100).toFixed(1)}%\r`);
    },
  });

  console.log(`\n✅ Render complete: ${outputLocation}`);
  return path.resolve(outputLocation);
}

// --- UPLOAD LOGIC ---
async function uploadToYouTube(filePath) {
  if (!GOOGLE_AUTH_CONFIG.clientId || GOOGLE_AUTH_CONFIG.clientId.includes("YOUR_")) {
    console.warn("⚠️ Skipping YouTube upload due to missing credentials.");
    return null;
  }

  console.log("☁️ Uploading to YouTube...");
  const oauth2Client = new google.auth.OAuth2(GOOGLE_AUTH_CONFIG.clientId, GOOGLE_AUTH_CONFIG.clientSecret);
  oauth2Client.setCredentials({ refresh_token: GOOGLE_AUTH_CONFIG.refreshToken });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: VIDEO_DETAILS.title,
        description: VIDEO_DETAILS.description,
        tags: VIDEO_DETAILS.tags,
        categoryId: VIDEO_DETAILS.category,
      },
      status: { privacyStatus: "unlisted", selfDeclaredMadeForKids: false },
    },
    media: { body: fs.createReadStream(filePath) },
  });

  console.log(`\n✅ Upload successful! ID: ${response.data.id}`);
  return response.data;
}

// --- MAIN ---
async function main() {
  try {
    const puzzleData = await getSessionPuzzle(activeSessionKey, theme.mateCount);
    const videoPath = await renderPuzzle(puzzleData);
    await uploadToYouTube(videoPath);
    console.log(`🏁 ${theme.title} Automation complete!`);
  } catch (err) {
    console.error("\n❌ Automation failed:");
    console.error(err);
    process.exit(1);
  }
}

main();
