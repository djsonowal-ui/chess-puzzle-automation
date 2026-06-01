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

// --- VIRAL SEO METADATA GENERATOR ---
function generateViralSEOMetadata(playerData) {
  const ratingClue = playerData.fideStats.ratings.standard || playerData.fideStats.ratings.rapid || playerData.fideStats.ratings.blitz;
  const genderTerm = playerData.name.includes("Deshmukh") || playerData.name.includes("Sachdev") || playerData.name.includes("Agrawal") || playerData.name.includes("Rout") ? "she" : "he";
  const titleShort = playerData.fideStats.title?.toLowerCase().includes("grandmaster") || playerData.fideStats.title === "GM" ? "GM" : "IM";

  // Dynamic high-retention titles for the YouTube algorithm
  const titleOptions = [
    `Can you GUESS this Chess Legend? 🤯🏆 #shorts`,
    `99% of Chess Fans FAIL to Guess this ${titleShort}! ♟️😱 #shorts`,
    `Who is this active FIDE ${ratingClue} Rated Chess Star? 🌟🤯 #shorts`,
    `Guess the famous Chess ${titleShort}! 👇✍️ #shorts`
  ];
  const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];

  const description = `Clues:
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

  return { title, description, tags, category: "24" };
}

// --- RENDERING LOGIC ---
async function renderPlayerVideo(playerData) {
  console.log(`🚀 Bundling and rendering vertical short for: ${playerData.name}...`);
  
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
    fideStats: playerData.fideStats
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
        privacyStatus: "public",
        selfDeclaredMadeForKids: false
      },
    },
    media: { body: fs.createReadStream(filePath) },
  }).catch(err => {
    if (err.errors) {
      const details = err.errors[0];
      if (details.reason === "quotaExceeded") {
        throw new Error("🚀 YOUTUBE API QUOTA EXCEEDED: You have hit the daily API limit.");
      }
      if (details.reason === "invalid_grant" || details.reason === "unauthorized") {
        throw new Error("🔐 YOUTUBE AUTH FAILED: OAuth credentials expired or invalid.");
      }
      throw new Error(`📡 YOUTUBE API ERROR (${details.reason}): ${details.message}`);
    }
    throw err;
  });

  console.log(`\n🎉 Upload successful! Published video ID: ${response.data.id}`);

  // Automatically post the answer comment
  await postAnswerComment(youtube, response.data.id, playerName);

  return response.data;
}

const runDailyAutomation = async () => {
  // 1. Select a random player from the registry database
  const playersPath = path.resolve("./players.json");
  const players = JSON.parse(fs.readFileSync(playersPath, "utf-8"));
  const randomPlayer = players[Math.floor(Math.random() * players.length)];
  console.log(`🎲 Selected Daily Player: ${randomPlayer.name} (FIDE ID: ${randomPlayer.fideId})`);

  // 2. Fetch monthly stats from FIDE & get Base64 photo
  const playerData = await getPlayerStats(randomPlayer.username);

  // 3. Compile/Render the vertical 4K Short
  const videoPath = await renderPlayerVideo(playerData);

  // 4. Generate SEO Metadata
  const metadata = generateViralSEOMetadata(playerData);

  // 5. Upload to @puzzlegambit YouTube channel & post pinned answer comment
  await uploadToYouTube(videoPath, metadata, playerData.name);
};

runDailyAutomation().catch(err => {
  console.error("\n❌ Daily Automation Failed:");
  console.error(err);
  process.exit(1);
});
