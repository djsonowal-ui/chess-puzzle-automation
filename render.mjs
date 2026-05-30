import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "path";
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

const start = async () => {
  console.log("🚀 Starting Remotion Programmatic Render...");

  // Parse slot from args, default to "evening" (since user requested a night video)
  const slotArg = process.argv.find(arg => arg.startsWith("--slot="));
  let slot = "evening";
  if (slotArg) {
    slot = slotArg.split("=")[1].toLowerCase();
    if (!THEME_POOL[slot]) slot = "evening";
  }

  const variations = THEME_POOL[slot];
  const theme = variations[Math.floor(Math.random() * variations.length)];
  const mateCount = slot === "morning" ? 2 : 3;

  console.log(`✨ Selected Slot: ${slot} | Theme: ${theme.title} | Mate in: ${mateCount}`);

  // Set FFmpeg path - prefer system path if not specified in .env
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH !== 'ffmpeg') {
    process.env.FFMPEG_PATH = path.resolve(process.env.FFMPEG_PATH);
  }
  console.log(`✅ Using FFmpeg: ${process.env.FFMPEG_PATH || 'default system path'}`);

  // 1. Fetch Dynamic Puzzle
  let puzzleData;
  try {
    puzzleData = await getSessionPuzzle(slot, mateCount);
  } catch (e) {
    console.warn("⚠️ Failed to fetch puzzle, using fallback.");
    puzzleData = {
      initialFen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
      puzzleMoves: ["f3g5", "O-O", "g5f7", "Rxf7", "c4f7", "Kxf7"],
      playerColor: "black",
      mateCount,
    };
  }

  // 2. Bundle the React code
  console.log("📦 Bundling React code...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.jsx"),
    sourceMaps: true,
  });
  console.log("✅ Bundle created at:", bundleLocation);

  const hooks = [
    "INSANE", "BRILLIANT", "SHOCKING", "IMPOSSIBLE", "TRAPPED", 
    "UNBELIEVABLE", "SNEAKY", "HIDDEN", "SMART", "WICKED", "CRUSHING"
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  const hookText = `${hook} MATE IN ${mateCount}!`;

  const inputProps = {
    ...puzzleData,
    sessionTitle: theme.title,
    mateCount,
    colors: theme.colors,
    bg: theme.bg,
    hookText,
  };

  // 3. Select the composition
  console.log("🔍 Selecting composition 'ChessShort'...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "ChessShort",
    inputProps,
  });
  console.log(`✅ Composition selected: ${composition.id} (${composition.width}x${composition.height})`);

  // 4. Render the video
  const outputLocation = `output_${slot}.mp4`;
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
};

start().catch((err) => {
  console.error("\n❌ Render failed:");
  console.error(err);
  process.exit(1);
});
