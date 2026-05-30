import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "path";
import dotenv from "dotenv";
import { getSessionPuzzle } from "./src/utils/fetch-puzzle.mjs";

dotenv.config();

const start = async () => {
  console.log("🚀 Starting Remotion Programmatic Render...");

  // Set FFmpeg path - prefer system path if not specified in .env
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH !== 'ffmpeg') {
    process.env.FFMPEG_PATH = path.resolve(process.env.FFMPEG_PATH);
  }
  console.log(`✅ Using FFmpeg: ${process.env.FFMPEG_PATH || 'default system path'}`);

  // 1. Fetch Dynamic Puzzle
  let puzzleData;
  try {
    puzzleData = await getSessionPuzzle("morning", 2);
  } catch (e) {
    console.warn("⚠️ Failed to fetch Lichess puzzle, using fallback.");
    puzzleData = {
      initialFen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
      puzzleMoves: ["f3g5", "O-O", "g5f7", "Rxf7", "c4f7", "Kxf7"],
      playerColor: "black",
    };
  }

  // 2. Bundle the React code
  console.log("📦 Bundling React code...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.jsx"),
    sourceMaps: true,
  });
  console.log("✅ Bundle created at:", bundleLocation);

  // 3. Select the composition
  console.log("🔍 Selecting composition 'ChessShort'...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "ChessShort",
    inputProps: puzzleData,
  });
  console.log(`✅ Composition selected: ${composition.id} (${composition.width}x${composition.height})`);

  // 4. Render the video
  console.log("🎬 Rendering media to output.mp4...");
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    audioCodec: "aac",
    outputLocation: "output.mp4",
    inputProps: puzzleData,
    videoBitrate: "50M",
    onProgress: ({ progress }) => {
      process.stdout.write(`⏳ Rendering progress: ${(progress * 100).toFixed(1)}%\r`);
    },
  });

  console.log("\n🎉 Render complete! Check output.mp4");
};

start().catch((err) => {
  console.error("\n❌ Render failed:");
  console.error(err);
  process.exit(1);
});
