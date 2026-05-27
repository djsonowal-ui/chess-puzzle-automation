import fetch from "cross-fetch";

async function listSounds() {
  const url = "https://api.github.com/repos/lichess-org/lila/contents/public/sound/standard";
  console.log(`Fetching folder contents from GitHub API: ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "node-fetch"
      }
    });
    if (!res.ok) {
      throw new Error(`Status ${res.status}: ${res.statusText}`);
    }
    const files = await res.json();
    console.log("📂 Lichess Standard Sounds files list:");
    files.forEach(f => {
      console.log(`- ${f.name} (Size: ${f.size} bytes) -> Raw URL: ${f.download_url}`);
    });
  } catch (err) {
    console.error("❌ Error fetching from GitHub API:", err.message);
  }
}

listSounds();
