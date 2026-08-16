import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { getPlayerStats } from "./src/utils/fetch-player.mjs";

dotenv.config();

const GOOGLE_AUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};

// --- HELPER TO GET TARGET UPLOAD DATE ---
function parseScheduleTime() {
  const scheduleArg = process.argv.find(arg => arg.startsWith("--schedule="));
  if (!scheduleArg) return null;

  const scheduleStr = scheduleArg.split("=")[1];
  let parsedDate = new Date(scheduleStr);
  if (isNaN(parsedDate.getTime())) return null;

  const now = new Date();
  if (parsedDate < now) {
    console.warn(`⚠️ Scheduled time ${scheduleStr} is in the past (${parsedDate.toISOString()}). Rolling forward by +24 hours.`);
    while (parsedDate < now) {
      parsedDate.setDate(parsedDate.getDate() + 1);
    }
    console.log(`📅 Adjusted scheduled publish time to tomorrow: ${parsedDate.toISOString()}`);
  }
  return parsedDate.toISOString();
}

function getTargetDate() {
  const publishAt = parseScheduleTime();
  return publishAt ? new Date(publishAt) : new Date();
}

// --- VIRAL SEO METADATA GENERATOR ---
function generateViralSEOMetadata(playerData) {
  const ratingClue = playerData.fideStats.ratings.standard || playerData.fideStats.ratings.rapid || playerData.fideStats.ratings.blitz;
  const genderTerm = playerData.name.includes("Deshmukh") || playerData.name.includes("Sachdev") || playerData.name.includes("Agrawal") || playerData.name.includes("Rout") ? "she" : "he";
  const titleShort = playerData.fideStats.title?.toLowerCase().includes("grandmaster") || playerData.fideStats.title === "GM" ? "GM" : "IM";

  const targetDate = getTargetDate();
  const dateShort = targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // e.g. "Jul 30"
  const dateFull = targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); // e.g. "July 30, 2026"

  // Dynamic high-retention titles for the YouTube algorithm
  const titleOptions = [
    `Can you GUESS this Chess Legend? 🤯🏆 (${dateShort}) #shorts`,
    `99% of Chess Fans FAIL to Guess this ${titleShort}! ♟️😱 (${dateShort}) #shorts`,
    `Who is this active FIDE ${ratingClue} Rated Chess Star? 🌟 (${dateShort}) #shorts`,
    `Guess the famous Chess ${titleShort}! 👇✍️ (${dateShort}) #shorts`
  ];
  const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];

  const description = `📅 Daily Guess the GM Challenge — ${dateFull}

Clues:
📍 Federation: ${playerData.fideStats.country} (Born: ${playerData.fideStats.bYear})
📈 Active FIDE Rating: ${ratingClue}
👑 Title: ${playerData.fideStats.title}

Write your guess in the comments! Can you spot who ${genderTerm} is? 👇✍️

🏆 Subscribe to @puzzlegambit for Daily Chess Shorts, Checkmate Tactics & Chess Trivia!

#chess #puzzles #guessthegm #guesstheim #chesstrivia #grandmaster #chessplayer #chessgame #remotion #viralshorts`;

  const tags = [
    "chess", "guessthegm", "guesstheim", "chess trivia", "grandmaster", 
    "chess player", "checkmate", "remotion", "puzzles", "shorts", 
    "chess tactics", "chess strategy", "viral shorts", "magnus carlsen"
  ];

  return { title, description, tags, category: "24", formattedDate: dateShort.toUpperCase() };
}

// --- RENDERING LOGIC ---
async function renderPlayerVideo(playerData, formattedDate) {
  console.log(`🚀 Bundling and rendering vertical short for: ${playerData.name} (${formattedDate})...`);
  
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH !== 'ffmpeg') {
    process.env.FFMPEG_PATH = path.resolve(process.env.FFMPEG_PATH);
  }
  
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.jsx"),
    sourceMaps: false,
  });

  const inputProps = {
    name: playerData.name,
    flag: playerData.flag,
    achievements: playerData.achievements,
    playstyle: playerData.playstyle,
    fideStats: playerData.fideStats,
    formattedDate: formattedDate
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "PlayerStatsShort",
    inputProps,
  });

  const outputLocation = `output_player_${playerData.username}.mp4`;
  console.log(`🎬 Compiling vertical video to ${outputLocation}...`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    audioCodec: "aac",
    outputLocation,
    inputProps,
    videoBitrate: "50M",
    onProgress: ({ progress }) => {
      process.stdout.write(`⏳ Rendering progress: ${(progress * 100).toFixed(1)}%\r`);
    },
  });

  console.log(`\n✅ Render complete: ${outputLocation}`);
  return path.resolve(outputLocation);
}

// --- COMMENT POSTER ENGINE ---
async function postAnswerComment(youtube, videoId, playerName) {
  try {
    console.log(`💬 Posting answer comment on video ${videoId}...`);
    const commentText = `Answer: ${playerName} ♟️ Did you guess it correctly? Let us know in the comments! 👇`;
    
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
    console.log(`✅ Posted answer comment: "${commentText}"`);
  } catch (err) {
    console.error(`⚠️ Failed to post answer comment: ${err.message}`);
  }
}

// --- YOUTUBE UPLOADER ENGINE ---
async function uploadToYouTube(filePath, metadata, playerName) {
  if (!GOOGLE_AUTH_CONFIG.clientId || GOOGLE_AUTH_CONFIG.clientId.includes("YOUR_")) {
    console.warn("⚠️ Google client configuration is incomplete. Skipping YouTube upload.");
    return null;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    throw new Error("Target video file is missing or empty.");
  }

  const publishAt = parseScheduleTime();

  console.log("☁️ Uploading daily video to @puzzlegambit YouTube channel...");
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
    console.log(`\n🎉 Upload successful! Scheduled for: ${publishAt}. Video ID: ${response.data.id}`);
    console.log(`ℹ️ Skipping answer comment posting for scheduled video (private status). Comments can be posted once public.`);
  } else {
    console.log(`\n🎉 Upload successful! Published video ID: ${response.data.id}`);
    // Automatically post the answer comment
    await postAnswerComment(youtube, response.data.id, playerName);
  }

  return response.data;
}

const runDailyAutomation = async () => {
  // 1. Select a player (parse from args, or fallback to random)
  const playersPath = path.resolve("./players.json");
  const players = JSON.parse(fs.readFileSync(playersPath, "utf-8"));

  const usernameArg = process.argv.find(arg => arg.startsWith("--username="));
  let selectedPlayer;
  if (usernameArg) {
    const username = usernameArg.split("=")[1].toLowerCase();
    selectedPlayer = players.find(p => p.username.toLowerCase() === username);
    if (!selectedPlayer) {
      throw new Error(`Player username '${username}' not found in players.json`);
    }
  } else {
    selectedPlayer = players[Math.floor(Math.random() * players.length)];
  }

  console.log(`🎲 Selected Daily Player: ${selectedPlayer.name} (FIDE ID: ${selectedPlayer.fideId})`);

  const isDryRun = process.argv.includes("--dry-run");
  if (isDryRun) console.log("🧪 DRY RUN MODE ENABLED. No rendering or uploading.");

  // 2. Fetch monthly stats from FIDE & get Base64 photo
  const playerData = await getPlayerStats(selectedPlayer.username);

  // 3. Generate SEO Metadata with Upload Date
  const metadata = generateViralSEOMetadata(playerData);
  console.log(`✨ SEO Title: ${metadata.title}`);
  console.log(`📅 Formatted Date Badge: ${metadata.formattedDate}`);

  if (isDryRun) {
    console.log("⏭️ Skipping render and upload in dry run.");
    console.log("🏁 Dry run complete.");
    return;
  }

  // 4. Compile/Render the vertical 4K Short
  const videoPath = await renderPlayerVideo(playerData, metadata.formattedDate);

  // 5. Upload to @puzzlegambit YouTube channel & post pinned answer comment
  await uploadToYouTube(videoPath, metadata, playerData.name);
};

runDailyAutomation().catch(err => {
  console.error("\n❌ Daily Automation Failed:");
  console.error(err);
  process.exit(1);
});
