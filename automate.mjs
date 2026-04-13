import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

// --- CONFIGURATION (FILL THESE IN) ---
const CLIENT_ID = "YOUR_CLIENT_ID";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REFRESH_TOKEN = "YOUR_REFRESH_TOKEN";

const GOOGLE_AUTH_CONFIG = {
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  refreshToken: REFRESH_TOKEN,
};

const VIDEO_DETAILS = {
  title: "Daily Chess Puzzle #1 ♟️ | Can you find the win? #shorts #chess",
  description: "Can you solve this chess puzzle? Watch the opponent's mistake and find the best move! \n\n#chess #puzzles #chessshorts #checkmate #remotion",
  tags: ["chess", "puzzles", "shorts", "remotion", "chesscom", "lichess"],
  category: "24", // Entertainment
};

// --- RENDERING LOGIC ---
async function renderPuzzle() {
  console.log("🚀 Starting Remotion Render...");
  process.env.FFMPEG_PATH = path.resolve("./ffmpeg");
  
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.jsx"),
    sourceMaps: true,
  });

  const inputProps = {
    initialFen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
    puzzleMoves: ["f3g5", "O-O", "g5f7", "Rxf7", "c4f7", "Kxf7"],
    playerColor: "black",
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "ChessShort",
    inputProps,
  });

  const outputLocation = "output.mp4";
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps,
    videoBitrate: "50M",
    onProgress: ({ progress }) => {
      process.stdout.write(`⏳ Rendering: ${(progress * 100).toFixed(1)}%\r`);
    },
  });

  console.log("\n✅ Render complete: output.mp4");
  return path.resolve(outputLocation);
}

// --- UPLOAD LOGIC ---
async function uploadToYouTube(filePath) {
  console.log("☁️ Starting YouTube Upload...");

  if (CLIENT_ID === "YOUR_CLIENT_ID") {
    console.warn("⚠️ Placeholder credentials detected. Upload will likely fail.");
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_AUTH_CONFIG.clientId,
    GOOGLE_AUTH_CONFIG.clientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_AUTH_CONFIG.refreshToken,
  });

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  const fileSize = fs.statSync(filePath).size;

  const response = await youtube.videos.insert(
    {
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: VIDEO_DETAILS.title,
          description: VIDEO_DETAILS.description,
          tags: VIDEO_DETAILS.tags,
          categoryId: VIDEO_DETAILS.category,
          defaultLanguage: "en",
          defaultAudioLanguage: "en",
        },
        status: {
          privacyStatus: "private", // Set to private for review
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    },
    {
      // Handle upload progress
      onUploadProgress: (evt) => {
        const progress = (evt.bytesRead / fileSize) * 100;
        process.stdout.write(`⏳ Uploading: ${progress.toFixed(1)}%\r`);
      },
    }
  );

  console.log("\n✅ Upload successful!");
  console.log(`🔗 Video URL: https://www.youtube.com/watch?v=${response.data.id}`);
  return response.data;
}

// --- MAIN AUTOMATION ---
async function main() {
  try {
    const videoPath = await renderPuzzle();
    await uploadToYouTube(videoPath);
    console.log("🏁 Automation workflow complete!");
  } catch (err) {
    console.error("\n❌ Automation failed:");
    console.error(err);
    process.exit(1);
  }
}

main();
