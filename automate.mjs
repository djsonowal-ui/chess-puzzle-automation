import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";

import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { getSessionPuzzle } from "./src/utils/fetch-puzzle.mjs";

dotenv.config();

// --- THEME CONFIGURATION ---
const THEME_POOL = {
  morning: [
    { 
      title: "Sunrise Solve", 
      colors: { dark: "#b58863", light: "#f0d9b5" }, // Wood
      bg: "morning_bg.png" 
    },
    { 
      title: "Early Bird Tactics", 
      colors: { dark: "#8b4513", light: "#deb887" }, // Burly Wood
      bg: "morning_bg.png" 
    }
  ],
  afternoon: [
    { 
      title: "Lunchtime Gambit", 
      colors: { dark: "#769656", light: "#eeeed2" }, // Green
      bg: "afternoon_bg.png" 
    },
    { 
      title: "Nature's Mate", 
      colors: { dark: "#2e7d32", light: "#c8e6c9" }, // Forest
      bg: "afternoon_bg.png" 
    }
  ],
  evening: [
    { 
      title: "Twilight Tactics", 
      colors: { dark: "#4b7399", light: "#eaeaea" }, // Blue
      bg: "evening_bg.png" 
    },
    { 
      title: "Midnight Mate", 
      colors: { dark: "#2c3e50", light: "#bdc3c7" }, // Midnight
      bg: "midnight_bg.png" 
    }
  ]
};

// --- SESSION SELECTION ---
function getActiveSession() {
  const slotArg = process.argv.find(arg => arg.startsWith("--slot="));
  let slot = "morning";

  if (slotArg) {
    slot = slotArg.split("=")[1].toLowerCase();
    if (!THEME_POOL[slot]) slot = "morning";
  } else {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 14) slot = "morning";
    else if (hour >= 14 && hour < 19) slot = "afternoon";
    else slot = "evening";
  }

  // Pick a random variation from the pool for variety
  const variations = THEME_POOL[slot];
  const variation = variations[Math.floor(Math.random() * variations.length)];
  
  return { 
    slot, 
    theme: variation,
    mateCount: (slot === "morning") ? 2 : 3 // Evening also uses Mate in 3 from Polgar
  };
}


const sessionData = getActiveSession();
const activeSessionKey = sessionData.slot;
const theme = sessionData.theme;
const requiredMateCount = sessionData.mateCount;

const GOOGLE_AUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};

// --- HELPER TO GET TARGET UPLOAD DATE ---
function getTargetDate() {
  const scheduleArg = process.argv.find(arg => arg.startsWith("--schedule="));
  if (scheduleArg) {
    const scheduleStr = scheduleArg.split("=")[1];
    const parsedDate = new Date(scheduleStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  return new Date();
}

// --- SEO EXPERT METADATA GENERATOR ---
function generateSEOMetadata(theme, puzzleData) {
  const mateCount = puzzleData.mateCount || 2;
  const eloRange = mateCount === 2 ? "1200+" : "1500+";
  const eloRating = mateCount === 2 ? "1200 - 1400" : "1500 - 1800";

  const targetDate = getTargetDate();
  const dateShort = targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // e.g. "Jul 30"
  const dateFull = targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); // e.g. "July 30, 2026"

  const titleOptions = [
    `Magnus Carlsen Level Mate in ${mateCount}! 🤯 (${dateShort}) #shorts`,
    `Hikaru Found This in 2 Seconds! ⚡ (${dateShort}) #shorts`,
    `Only ${eloRange} ELO Can Solve This! ♟️ Daily Puzzle (${dateShort}) #shorts`,
    `99% FAIL This Mate in ${mateCount}! 🤯 ${dateShort} Challenge #shorts`,
    `Can You Spot Today's Sacrifice? 🏆 (${dateShort}) #shorts`,
    `Brilliant ${eloRange} ELO Checkmate Trap ⚡ ${dateShort} #shorts`,
    `Can 1200 ELO Spot This Grandmaster Trap? 🧠 (${dateShort}) #shorts`,
    `Kasparov's Favorite Checkmate Trap 🎯 (${dateShort}) #shorts`
  ];
  
  const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
  
  const description = `📅 Daily Chess Challenge — ${dateFull}
🎯 Difficulty: ~${eloRating} (${eloRange} ELO)

⏱️ Can you solve today's puzzle before time runs out? Pause the video and write your move in the comments! 👇

🏆 Subscribe to @puzzlegambit for Daily Chess Shorts, Checkmate Tactics & Chess Riddles!

#chess #puzzles #chessshorts #checkmate #guessthemove #chesstactics #chessstrategy #dailychess #remotion #magnuscarlsen #hikarunakamura`;

  const tags = [
    "chess", "puzzles", "shorts", "remotion", `matein${mateCount}`,
    "chess tactics", "chess strategy", "grandmaster", "magnus carlsen", "hikaru nakamura",
    "chess puzzles", "chess opening", "chess endgame", "checkmate", "brilliant move",
    "guessthemove", "chess challenge", "chess riddle", "daily puzzle"
  ];

  const hooks = [
    `MAGNUS CARLSEN MATE IN ${mateCount}!`,
    `HIKARU FOUND THIS IN 2s!`,
    `ONLY ${eloRange} ELO CAN SOLVE THIS!`,
    `99% MISS THIS MATE IN ${mateCount}!`,
    `CAN YOU SPOT THE SACRIFICE?`,
    `INSANE MATE IN ${mateCount} TRAP!`,
    `CAN YOU SOLVE IN 5 SECONDS?`
  ];

  const hookText = hooks[Math.floor(Math.random() * hooks.length)];
  return { title, description, tags, category: "24", hookText, eloRating, formattedDate: dateShort.toUpperCase() };
}

// --- RENDERING LOGIC ---
async function renderPuzzle(puzzleData, metadata) {
  console.log(`🚀 Rendering ${theme.title} (${metadata.formattedDate}, Mate in ${requiredMateCount}, ~${metadata.eloRating} ELO)...`);
  
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
    mateCount: requiredMateCount,
    colors: theme.colors,
    bg: theme.bg,
    hookText: metadata.hookText,
    eloRating: metadata.eloRating,
    formattedDate: metadata.formattedDate,
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
    audioCodec: "aac",
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

// --- COMMENT POSTER ENGINE ---
async function postInteractiveComment(youtube, videoId, metadata) {
  try {
    console.log(`💬 Posting interactive comment on video ${videoId}...`);
    const commentText = `What is your current ELO rating? ♟️ Did you spot the checkmate before the timer ran out? Comment your time below! 👇`;
    
    await youtube.commentThreads.insert({
      part: "snippet",
      requestBody: {
        snippet: {
          videoId: videoId,
          topLevelComment: {
            snippet: {
              textOriginal: commentText
            }
          }
        }
      }
    });
    console.log(`✅ Posted interactive comment: "${commentText}"`);
  } catch (err) {
    console.warn(`⚠️ Could not post comment: ${err.message}`);
  }
}

// --- UPLOAD LOGIC ---
async function uploadToYouTube(filePath, metadata) {
  if (!GOOGLE_AUTH_CONFIG.clientId || GOOGLE_AUTH_CONFIG.clientId.includes("YOUR_")) {
    console.warn("⚠️ Skipping YouTube upload due to missing credentials.");
    return null;
  }

  // Final Quality Check
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    throw new Error("Rendered file is missing or empty.");
  }

  const scheduleArg = process.argv.find(arg => arg.startsWith("--schedule="));
  let publishAt = scheduleArg ? scheduleArg.split("=")[1] : null;

  if (publishAt && new Date(publishAt) < new Date()) {
    console.warn(`⚠️ Scheduled time ${publishAt} is in the past. Uploading as PUBLIC immediately instead.`);
    publishAt = null;
  }


  console.log("☁️ Uploading to YouTube...");
  const oauth2Client = new google.auth.OAuth2(GOOGLE_AUTH_CONFIG.clientId, GOOGLE_AUTH_CONFIG.clientSecret);
  oauth2Client.setCredentials({ refresh_token: GOOGLE_AUTH_CONFIG.refreshToken });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: metadata.category,
      },
      status: { 
        privacyStatus: publishAt ? "private" : "public", 
        publishAt: publishAt || undefined,
        selfDeclaredMadeForKids: false 
      },
    },
    media: { body: fs.createReadStream(filePath) },
  }).catch(err => {
    const errMsg = err.message || "";
    const errDetails = err.errors?.[0] || {};
    const reason = errDetails.reason || "";

    if (reason === "quotaExceeded" || errMsg.includes("quotaExceeded")) {
      throw new Error("🚀 YOUTUBE QUOTA EXCEEDED: Daily upload limit reached for Google Cloud project.");
    }
    if (reason === "invalid_grant" || reason === "unauthorized" || errMsg.includes("invalid_grant") || errMsg.includes("unauthorized")) {
      throw new Error("🔐 YOUTUBE AUTH FAILED: OAuth refresh token is expired or invalid. Please run 'node get_token.mjs' and update GitHub Secrets.");
    }
    throw new Error(`📡 YOUTUBE API ERROR (${reason || "unknown"}): ${errMsg || JSON.stringify(errDetails)}`);
  });

  if (publishAt) {
    console.log(`\n✅ Upload successful! Scheduled for: ${publishAt}. ID: ${response.data.id}`);
  } else {
    console.log(`\n✅ Upload successful! Published as PUBLIC. ID: ${response.data.id}`);
  }

  // Automatically post interactive comment to drive comment velocity
  await postInteractiveComment(youtube, response.data.id, metadata);

  return response.data;
}


// --- VALIDATION LOGIC ---
import { Chess } from "chess.js";

function validatePuzzle(puzzleData) {
  console.log(`🔍 Validating puzzle ${puzzleData.id}...`);
  const game = new Chess(puzzleData.initialFen);
  
  for (const move of puzzleData.puzzleMoves) {
    try {
      const result = game.move({ 
        from: move.substring(0, 2), 
        to: move.substring(2, 4), 
        promotion: "q" 
      });
      if (!result) throw new Error(`Illegal move: ${move}`);
    } catch (e) {
      throw new Error(`Validation failed at move ${move}: ${e.message}`);
    }
  }

  // Checkmate validation for Mate themes
  if (puzzleData.id.includes("mate") || puzzleData.id.includes("polgar")) {
    if (!game.isCheckmate()) {
      throw new Error("Final position is NOT checkmate but puzzle is labeled as mate.");
    }
  }

  console.log("✅ Puzzle validation passed.");
  return true;
}

// --- STATE PERSISTENCE ---
async function markPuzzleAsUsed(puzzleData) {
  const puzzlesPath = path.resolve("./puzzles.json");
  if (!fs.existsSync(puzzlesPath)) return;

  const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, "utf-8"));
  const index = puzzles.findIndex(p => p.id === puzzleData.id);
  
  if (index !== -1) {
    puzzles[index].used = true;
    puzzles[index].lastUsed = new Date().toISOString();
  } else {
    // Add fallback puzzle so it doesn't get repeated
    puzzles.push({
      ...puzzleData,
      used: true,
      lastUsed: new Date().toISOString()
    });
  }
  
  fs.writeFileSync(puzzlesPath, JSON.stringify(puzzles, null, 2));
  console.log(`💾 Updated puzzles.json: Marked ${puzzleData.id} as used.`);
}

// --- MAIN ---
async function main() {
  try {
    const isDryRun = process.argv.includes("--dry-run");
    if (isDryRun) console.log("🧪 DRY RUN MODE ENABLED. No rendering or uploading.");


    const puzzleData = await getSessionPuzzle(activeSessionKey, requiredMateCount);
    
    // Validate the puzzle first
    validatePuzzle(puzzleData);

    // MARK AS USED IMMEDIATELY after validation passes. 
    // This ensures that even if rendering or uploading fails, 
    // we NEVER attempt this specific puzzle again.
    await markPuzzleAsUsed(puzzleData);

    const metadata = generateSEOMetadata(theme, puzzleData);
    console.log(`✨ SEO Title: ${metadata.title}`);
    
    if (isDryRun) {
      console.log("⏭️ Skipping render and upload in dry run.");
      console.log("🏁 Dry run complete.");
      return;
    }

    const videoPath = await renderPuzzle(puzzleData, metadata);
    await uploadToYouTube(videoPath, metadata);

    console.log(`🏁 ${theme.title} Automation complete!`);
  } catch (err) {
    console.error("\n❌ Automation failed:");
    console.error(err);
    process.exit(1);
  }
}

main();
