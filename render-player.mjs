import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { getPlayerStats } from "./src/utils/fetch-player.mjs";

dotenv.config();

const start = async () => {
  console.log("🚀 Starting Player Stats Remotion Render...");

  // Parse player from args, or fallback to random
  const usernameArg = process.argv.find(arg => arg.startsWith("--username="));
  let username = "magnuscarlsen";
  if (usernameArg) {
    username = usernameArg.split("=")[1];
  } else {
    // Select a random player from the database
    const fs = await import("fs");
    const players = JSON.parse(fs.readFileSync(path.resolve("./players.json"), "utf-8"));
    username = players[Math.floor(Math.random() * players.length)].username;
  }

  // 1. Fetch live or cached FIDE player stats
  const playerData = await getPlayerStats(username);
  console.log(`✨ Player Loaded: ${playerData.name} | Federation: ${playerData.fideStats.country} | FIDE Standard Rating: ${playerData.fideStats.ratings.standard}`);

  // Set FFmpeg path - prefer system path if not specified in .env
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH !== 'ffmpeg') {
    process.env.FFMPEG_PATH = path.resolve(process.env.FFMPEG_PATH);
  }
  console.log(`✅ Using FFmpeg: ${process.env.FFMPEG_PATH || 'default system path'}`);

  // 2. Bundle the React code
  console.log("📦 Bundling React code...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.jsx"),
    sourceMaps: true,
  });
  console.log("✅ Bundle created at:", bundleLocation);

  const inputProps = {
    name: playerData.name,
    flag: playerData.flag,
    achievements: playerData.achievements,
    playstyle: playerData.playstyle,
    fideStats: playerData.fideStats
  };

  // 3. Select the composition
  console.log("🔍 Selecting composition 'PlayerStatsShort'...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "PlayerStatsShort",
    inputProps,
  });
  console.log(`✅ Composition selected: ${composition.id} (${composition.width}x${composition.height})`);

  // 4. Render the video
  const outputLocation = `output_player_${playerData.username}.mp4`;
  console.log(`🎬 Rendering media to ${outputLocation}...`);
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

  console.log(`\n🎉 Render complete! Check ${outputLocation}`);

  // 5. Generate SEO companion metadata file
  const metaLocation = `output_player_${playerData.username}_meta.txt`;
  const ratingClue = playerData.fideStats.ratings.standard || playerData.fideStats.ratings.rapid || playerData.fideStats.ratings.blitz;
  
  const seoTitle = `Can you GUESS this Chess Legend? 🤯🏆 #shorts`;
  const seoDescription = `Clues:
📍 Federation: ${playerData.fideStats.country} (${playerData.fideStats.bYear})
📈 Active FIDE Rating: ${ratingClue}
👑 Title: ${playerData.fideStats.title}

Write his/her name in the comments! 👇✍️

🏆 Subscribe for Daily Chess Shorts, Tactics & GM Trivia!

#chess #guessthegm #chesstrivia #grandmaster #chessplayer #remotion #puzzles`;

  const metaContent = `=================================================
🔥 CHESS INTERACTIVE QUIZ VIDEO COMPANION INFO 🔥
=================================================
Correct Answer : ${playerData.name} (Username: ${playerData.username})
FIDE Profile   : https://ratings.fide.com/profile/${playerData.fideId}
Output Video   : ${outputLocation}

-------------------------------------------------
🎥 OPTIMIZED UPLOAD METADATA (COPY/PASTE)
-------------------------------------------------
[Title]:
${seoTitle}

[Description]:
${seoDescription}
=================================================`;

  fs.writeFileSync(path.resolve(metaLocation), metaContent, "utf-8");
  console.log(`📝 SEO Companion metadata file created: ${metaLocation}\n`);
};

start().catch((err) => {
  console.error("\n❌ Render failed:");
  console.error(err);
  process.exit(1);
});
