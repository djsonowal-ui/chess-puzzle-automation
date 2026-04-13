import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "path";

const start = async () => {
  console.log("🚀 Starting Remotion Programmatic Render...");

  // 1. Set FFmpeg path to our local binary
  process.env.FFMPEG_PATH = path.resolve("./ffmpeg");
  console.log(`✅ Using local FFmpeg at: ${process.env.FFMPEG_PATH}`);

  // 2. Bundle the React code
  console.log("📦 Bundling React code...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.jsx"),
    // Enable source maps for better debugging if needed
    sourceMaps: true,
  });
  console.log("✅ Bundle created at:", bundleLocation);

  // 3. Define dynamic data
  const inputProps = {
    // A fresh puzzle for the render test
    initialFen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
    puzzleMoves: ["f3g5", "O-O", "g5f7", "Rxf7", "c4f7", "Kxf7"],
    playerColor: "black",
  };

  // 4. Select the composition
  console.log("🔍 Selecting composition 'ChessShort'...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "ChessShort",
    inputProps,
  });
  console.log(`✅ Composition selected: ${composition.id} (${composition.width}x${composition.height})`);

  // 5. Render the video
  console.log("🎬 Rendering media to output.mp4...");
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: "output.mp4",
    inputProps,
    videoBitrate: "50M",
    onProgress: ({ progress }) => {
      console.log(`⏳ Rendering progress: ${(progress * 100).toFixed(1)}%`);
    },
  });

  console.log("🎉 Render complete! Check output.mp4");
};

start().catch((err) => {
  console.error("❌ Render failed:");
  console.error(err);
  process.exit(1);
});
