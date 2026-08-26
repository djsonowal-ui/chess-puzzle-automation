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
  let title = getArg("--title=");
  let fen = getArg("--fen=");
  let movesStr = getArg("--moves=");
  let evaluation = getArg("--eval=");
  let sideToPlay = getArg("--side=");
  const club = getArg("--club=") || "CHOWKIDINGHEE CHESS CLUB";
  const author = getArg("--author=") || "by RAJNISH VERMA";
  const dryRun = args.includes("--dry-run");

  let rawSolutions = null;

  if (id || (!fen && !movesStr)) {
    const solvedPath = path.resolve("./solved_puzzles.json");
    if (fs.existsSync(solvedPath)) {
      const puzzles = JSON.parse(fs.readFileSync(solvedPath, "utf-8"));
      const found = id 
        ? puzzles.find(p => p.id === id || p.title.toLowerCase() === id.toLowerCase())
        : puzzles[0];
      if (found) {
        title = title || found.title;
        fen = fen || found.initialFen;
        movesStr = movesStr || found.moves;
        evaluation = evaluation || found.evaluation;
        sideToPlay = sideToPlay || found.sideToPlay;
        if (found.solutions && Array.isArray(found.solutions)) {
          rawSolutions = found.solutions;
        }
      }
    }
  }

  title = title || "Solved Puzzles";
  fen = fen || "2n1r2k/ppp3pp/2n3q1/3Q2N1/3P1p2/2P4P/PP3PP1/R4NK1 w - - 0 1";
  movesStr = movesStr || "1. Nf7+ Kg8 2. Ne5+ Kh8 3. Nxg6+ hxg6";
  evaluation = evaluation || "+-";
  sideToPlay = sideToPlay || (fen.includes(" w ") ? "White to Play" : "Black to Play");

  return { title, fen, movesStr, evaluation, sideToPlay, club, author, dryRun, rawSolutions };
}

async function main() {
  try {
    const { title, fen, movesStr, evaluation, sideToPlay, club, author, dryRun, rawSolutions } = parseArgs();

    console.log(`🧩 Processing Solved Puzzle: "${title}"`);
    console.log(`♟️ Initial FEN: "${fen}"`);

    let parsedSolutions = null;
    let primaryMovesData = null;

    if (rawSolutions && rawSolutions.length > 0) {
      console.log(`🔀 Found ${rawSolutions.length} Solution Lines in catalog:`);
      parsedSolutions = rawSolutions.map((sol, index) => {
        const parsed = parseOpeningMoves(sol.moves, fen);
        console.log(`   └─ Line ${index + 1} (${sol.title}): ${parsed.sanList.join(" ")}`);
        return {
          title: sol.title || `Line ${index + 1}`,
          puzzleMoves: parsed.puzzleMoves,
          sanList: parsed.sanList,
          evaluation: sol.evaluation || "#"
        };
      });
      primaryMovesData = {
        puzzleMoves: parsedSolutions[0].puzzleMoves,
        sanList: parsedSolutions[0].sanList
      };
    } else {
      console.log(`📝 Solution Moves Input: "${movesStr}"`);
      primaryMovesData = parseOpeningMoves(movesStr, fen);
      console.log(`✅ Move sequence validated! (${primaryMovesData.totalMoves} half-moves)`);
      console.log(`📋 SAN Moves:`, primaryMovesData.sanList.join(", "));
    }

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

    const playerColor = fen.includes(" w ") ? "white" : "black";

    const inputProps = {
      puzzleTitle: title,
      initialFen: fen,
      puzzleMoves: primaryMovesData.puzzleMoves,
      sanList: primaryMovesData.sanList,
      solutions: parsedSolutions,
      evaluation,
      sideToPlay,
      playerColor,
      colors: { dark: "#769656", light: "#eeeed2" },
      bg: "morning_bg.png",
      clubTitle: club,
      authorName: author
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "ChessSolvedPuzzleShort",
      inputProps,
    });

    const outputLocation = `output_solved_puzzle.mp4`;

    console.log(`🎬 Rendering 4K vertical short video to: ${outputLocation}...`);

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
    console.error("\n❌ Solved Puzzle Render Failed:");
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
