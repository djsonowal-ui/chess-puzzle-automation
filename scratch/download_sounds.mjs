import fs from "fs";
import path from "path";
import fetch from "cross-fetch";

const SOUNDS = {
  "tick.mp3": "https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune/tick.mp3",
  "move.mp3": "https://github.com/lichess-org/lila/raw/master/public/sound/standard/Move.mp3",
  "check.mp3": "https://github.com/lichess-org/lila/raw/master/public/sound/standard/GenericNotify.mp3",
  "win.mp3": "https://github.com/lichess-org/lila/raw/master/public/sound/standard/Confirmation.mp3"
};

const PUBLIC_DIR = path.resolve("./public");

async function downloadSounds() {
  console.log("📥 Starting download of chess audio assets into /public...");
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  for (const [filename, url] of Object.entries(SOUNDS)) {
    const dest = path.join(PUBLIC_DIR, filename);
    
    // Always overwrite to fix 17-byte LFS stubs if present
    console.log(`🔄 Downloading ${filename} from ${url}...`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: Status ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(dest, buffer);
      console.log(`✅ Successfully downloaded ${filename} (${buffer.length} bytes).`);
    } catch (error) {
      console.error(`❌ Error downloading ${filename}:`, error.message);
    }
  }
  console.log("🏁 Download process complete!");
}

downloadSounds();
