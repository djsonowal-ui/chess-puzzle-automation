import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { parseOpeningMoves } from "./src/utils/parse-moves.mjs";

dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const getArg = (prefix) => {
    const found = args.find(a => a.startsWith(prefix));
    return found ? found.substring(prefix.length) : null;
  };

  const id = getArg("--id=");
  const name = getArg("--name=");
  const movesStr = getArg("--moves=");
  const club = getArg("--club=") || "CHOWKIDINGHEE CHESS CLUB";
  const author = getArg("--author=") || "by RAJNISH VERMA";
  const dryRun = args.includes("--dry-run");

  return { id, name, movesStr, club, author, dryRun };
}

async function main() {
  try {
    const { id, name, movesStr, club, author, dryRun } = parseArgs();

    let openingName = name || "Chess Opening";
    let movesInput = movesStr;

    // If ID is provided, look up in openings.json
    if (id && !movesInput) {
      const openingsPath = path.resolve("./openings.json");
      if (fs.existsSync(openingsPath)) {
        const openings = JSON.parse(fs.readFileSync(openingsPath, "utf-8"));
        const found = openings.find(o => o.id === id || o.name.toLowerCase() === id.toLowerCase());
        if (found) {
          openingName = name || found.name;
          movesInput = found.moves;
        }
      }
    }

    // Default fallback if no moves provided
    if (!movesInput) {
      console.log("ℹ️ No custom moves provided. Using default Italian Game (1. e4 e5 2. Nf3 Nc6 3. Bc4)...");
      openingName = name || "Italian Game";
      movesInput = "1. e4 e5 2. Nf3 Nc6 3. Bc4";
    }

    console.log(`♟️ Processing Opening: "${openingName}"`);
    console.log(`📝 Raw Moves Input: "${movesInput}"`);

    // Parse moves with chess.js validation
    const parsedData = parseOpeningMoves(movesInput);
    console.log(`✅ Move sequence validated! (${parsedData.totalMoves} moves)`);
    console.log(`📋 SAN Moves:`, parsedData.sanList.join(", "));

    if (dryRun) {
      console.log("🧪 DRY RUN ENABLED. Skipping bundle & render.");
      console.log(`🏆 Header Branding: ${club} / ${author}`);
      return;
    }

    console.log(`🚀 Bundling Remotion video project...`);
    if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH !== 'ffmpeg') {
      process.env.FFMPEG_PATH = path.resolve(process.env.FFMPEG_PATH);
    }

    const bundleLocation = await bundle({
      entryPoint: path.resolve("./src/index.jsx"),
      sourceMaps: false,
    });

    const inputProps = {
      openingName,
      initialFen: parsedData.initialFen,
      puzzleMoves: parsedData.puzzleMoves,
      sanList: parsedData.sanList,
      colors: { dark: "#769656", light: "#eeeed2" },
      bg: "morning_bg.png",
      clubTitle: club,
      authorName: author
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "ChessOpeningShort",
      inputProps,
    });

    const safeFilename = openingName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const outputLocation = `output_opening_${safeFilename || "custom"}.mp4`;

    console.log(`🎬 Rendering 4K short video to: ${outputLocation}...`);

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

    console.log(`\n\n🎉 SUCCESS! Rendered video: ${path.resolve(outputLocation)}`);
    console.log(`✨ Header: "${club}" | "${author}"`);
  } catch (err) {
    console.error("\n❌ Opening Render Failed:");
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
