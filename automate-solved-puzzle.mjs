import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { parseOpeningMoves } from "./src/utils/parse-moves.mjs";

dotenv.config();

const GOOGLE_AUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};

function generateSEOMetadata(title, sanList, evaluation) {
  const movesSummary = sanList.slice(0, 4).join(" ");
  const videoTitle = `${title}: ${movesSummary}... ${evaluation || ""} ♟️ Chowkidinghee Chess Club #shorts`;

  const description = `🏆 CHOWKIDINGHEE CHESS CLUB
by RAJNISH VERMA

🧩 ${title}
📝 Moves Played: ${sanList.join(" ")} ${evaluation || ""}

Learn chess tactics, puzzle solutions, and strategy with Chowkidinghee Chess Club!

#chowkidingheechessclub #rajnishverma #chess #puzzles #guessthemove #guessthegm #remotion #shorts`;

  const tags = [
    "chowkidinghee chess club", "rajnish verma", "chess", "chess puzzles", 
    "solved puzzles", "chess tactics", "remotion", "shorts", "daily chess"
  ];

  return { title: videoTitle, description, tags, category: "24" };
}

async function uploadToYouTube(filePath, metadata) {
  if (!GOOGLE_AUTH_CONFIG.clientId || GOOGLE_AUTH_CONFIG.clientId.includes("YOUR_")) {
    console.warn("⚠️ Google credentials missing. Skipping YouTube upload.");
    return null;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    throw new Error("Target video file is missing or empty.");
  }

  console.log("☁️ Uploading Solved Puzzle Short to YouTube...");
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
    const errMsg = err.message || "";
    const errDetails = err.errors?.[0] || {};
    const reason = errDetails.reason || "";

    if (reason === "quotaExceeded" || errMsg.includes("quotaExceeded")) {
      throw new Error("🚀 YOUTUBE QUOTA EXCEEDED: Daily limit reached for Google Cloud project.");
    }
    if (reason === "invalid_grant" || reason === "unauthorized" || errMsg.includes("invalid_grant")) {
      throw new Error("🔐 YOUTUBE AUTH FAILED: Refresh token is expired or invalid.");
    }
    throw new Error(`📡 YOUTUBE API ERROR (${reason || "unknown"}): ${errMsg}`);
  });

  console.log(`\n🎉 Upload successful! Published Video ID: ${response.data.id}`);
  return response.data;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const getArg = (prefix) => {
      const found = args.find(a => a.startsWith(prefix));
      return found ? found.substring(prefix.length) : null;
    };

    const idArg = getArg("--id=");
    let titleArg = getArg("--title=");
    let fenArg = getArg("--fen=");
    let movesArg = getArg("--moves=");
    let evalArg = getArg("--eval=");
    const isDryRun = args.includes("--dry-run");
    const shouldUpload = args.includes("--upload");

    let rawSolutions = null;

    const solvedPath = path.resolve("./solved_puzzles.json");
    if (fs.existsSync(solvedPath)) {
      const puzzles = JSON.parse(fs.readFileSync(solvedPath, "utf-8"));
      const found = idArg 
        ? puzzles.find(p => p.id === idArg || p.title.toLowerCase() === idArg.toLowerCase())
        : puzzles[0];
      if (found) {
        titleArg = titleArg || found.title;
        fenArg = fenArg || found.initialFen;
        movesArg = movesArg || found.moves;
        evalArg = evalArg || found.evaluation;
        if (found.solutions && Array.isArray(found.solutions)) {
          rawSolutions = found.solutions;
        }
      }
    }

    titleArg = titleArg || "Solved Puzzles";
    fenArg = fenArg || "2n1r2k/ppp3pp/2n3q1/3Q2N1/3P1p2/2P4P/PP3PP1/R4NK1 w - - 0 1";
    movesArg = movesArg || "1. Nf7+ Kg8 2. Ne5+ Kh8 3. Nxg6+ hxg6";
    evalArg = evalArg || "+-";

    let parsedSolutions = null;
    let primaryMovesData = null;

    if (rawSolutions && rawSolutions.length > 0) {
      parsedSolutions = rawSolutions.map((sol, index) => {
        const parsed = parseOpeningMoves(sol.moves, fenArg);
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
      primaryMovesData = parseOpeningMoves(movesArg, fenArg);
    }

    const playerColor = fenArg.includes(" w ") ? "white" : "black";
    const sideToPlay = playerColor === "white" ? "White to Play" : "Black to Play";

    console.log(`🧩 Selected Solved Puzzle: "${titleArg}"`);
    console.log(`♟️ FEN: "${fenArg}"`);

    const metadata = generateSEOMetadata(titleArg, primaryMovesData.sanList, evalArg);

    console.log(`✨ Generated SEO Title: ${metadata.title}`);

    if (isDryRun) {
      console.log("🧪 DRY RUN MODE ENABLED. No rendering or uploading.");
      console.log("🏁 Dry run complete.");
      return;
    }

    if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH !== 'ffmpeg') {
      process.env.FFMPEG_PATH = path.resolve(process.env.FFMPEG_PATH);
    }

    const bundleLocation = await bundle({
      entryPoint: path.resolve("./src/index.jsx"),
      sourceMaps: false,
    });

    const inputProps = {
      puzzleTitle: titleArg,
      initialFen: fenArg,
      puzzleMoves: primaryMovesData.puzzleMoves,
      sanList: primaryMovesData.sanList,
      solutions: parsedSolutions,
      evaluation: evalArg,
      sideToPlay,
      playerColor,
      colors: { dark: "#769656", light: "#eeeed2" },
      bg: "morning_bg.png",
      clubTitle: "CHOWKIDINGHEE CHESS CLUB",
      authorName: "by RAJNISH VERMA"
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "ChessSolvedPuzzleShort",
      inputProps,
    });

    const outputLocation = `output_solved_puzzle.mp4`;

    console.log(`🎬 Rendering 4K vertical short video to ${outputLocation}...`);

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

    const videoPath = path.resolve(outputLocation);
    console.log(`\n✅ Render complete: ${videoPath}`);

    if (shouldUpload) {
      await uploadToYouTube(videoPath, metadata);
    } else {
      console.log("ℹ️ Local video saved. Skipping upload (pass --upload when ready to publish).");
    }

  } catch (err) {
    console.error("\n❌ Solved Puzzle Automation Failed:");
    console.error(err);
    process.exit(1);
  }
}

main();
