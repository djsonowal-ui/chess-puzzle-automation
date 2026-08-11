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

function generateSEOMetadata(openingName, sanList) {
  const movesSummary = sanList.slice(0, 4).join(" ");
  const title = `${openingName} (${movesSummary}...) ♟️ Chowkidinghee Chess Club #shorts`;

  const description = `🏆 CHOWKIDINGHEE CHESS CLUB
by RAJNISH VERMA

♟️ Opening: ${openingName}
📝 Moves Played: ${sanList.join(" ")}

Learn classic chess openings, tactics, and strategies with Chowkidinghee Chess Club!

#chowkidingheechessclub #rajnishverma #chess #puzzles #chessopenings #guessthemove #guessthegm #remotion #shorts`;

  const tags = [
    "chowkidinghee chess club", "rajnish verma", "chess", "chess openings", 
    openingName.toLowerCase(), "remotion", "shorts", "daily chess", "chess strategy"
  ];

  return { title, description, tags, category: "24" };
}

async function uploadToYouTube(filePath, metadata) {
  if (!GOOGLE_AUTH_CONFIG.clientId || GOOGLE_AUTH_CONFIG.clientId.includes("YOUR_")) {
    console.warn("⚠️ Google credentials missing. Skipping YouTube upload.");
    return null;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    throw new Error("Target video file is missing or empty.");
  }

  console.log("☁️ Uploading Chess Opening Short to YouTube...");
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
    const nameArg = getArg("--name=");
    const movesArg = getArg("--moves=");
    const isDryRun = args.includes("--dry-run");

    let openingName = nameArg || "Italian Game";
    let movesInput = movesArg;

    const openingsPath = path.resolve("./openings.json");
    const openings = fs.existsSync(openingsPath) ? JSON.parse(fs.readFileSync(openingsPath, "utf-8")) : [];

    if (!movesInput) {
      if (idArg) {
        const found = openings.find(o => o.id === idArg || o.name.toLowerCase() === idArg.toLowerCase());
        if (found) {
          openingName = found.name;
          movesInput = found.moves;
        }
      } else {
        // Pick a random opening from openings.json
        const randomOpening = openings[Math.floor(Math.random() * openings.length)];
        if (randomOpening) {
          openingName = randomOpening.name;
          movesInput = randomOpening.moves;
        }
      }
    }

    if (!movesInput) {
      movesInput = "1. e4 e5 2. Nf3 Nc6 3. Bc4";
    }

    console.log(`♟️ Selected Opening: "${openingName}"`);
    console.log(`📝 Moves Input: "${movesInput}"`);

    const parsedData = parseOpeningMoves(movesInput);
    const metadata = generateSEOMetadata(openingName, parsedData.sanList);

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
      openingName,
      initialFen: parsedData.initialFen,
      puzzleMoves: parsedData.puzzleMoves,
      sanList: parsedData.sanList,
      colors: { dark: "#769656", light: "#eeeed2" },
      bg: "morning_bg.png",
      clubTitle: "CHOWKIDINGHEE CHESS CLUB",
      authorName: "by RAJNISH VERMA"
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "ChessOpeningShort",
      inputProps,
    });

    const safeFilename = openingName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const outputLocation = `output_opening_${safeFilename || "custom"}.mp4`;

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

    const shouldUpload = args.includes("--upload");
    if (shouldUpload) {
      // Upload to YouTube
      await uploadToYouTube(videoPath, metadata);
    } else {
      console.log("ℹ️ Local video saved. Skipping upload (pass --upload when ready to publish).");
    }

  } catch (err) {
    console.error("\n❌ Opening Automation Failed:");
    console.error(err);
    process.exit(1);
  }
}

main();
