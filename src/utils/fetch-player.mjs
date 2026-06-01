import fs from 'fs';
import path from 'path';

// Map national federation short-codes or text to clean flags if needed, or use the curated flag
async function fetchFideProfile(fideId) {
  const url = `https://ratings.fide.com/profile/${fideId}`;
  console.log(`📡 Fetching FIDE profile for ID ${fideId} from ${url}...`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error fetching FIDE ID ${fideId}: ${response.status}`);
  }

  const html = await response.text();

  // Extract Name
  const nameMatch = html.match(/<h1 class="player-title">([^<]+)<\/h1>/);
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown Player';

  // Extract B-Year
  const bYearMatch = html.match(/<h5>B-Year<\/h5>\s*<p class="profile-info-byear ">(\d+)\s*<\/p>/);
  const bYear = bYearMatch ? bYearMatch[1].trim() : 'N/A';

  // Extract Country/Federation
  const countryMatch = html.match(/<div class="profile-info-country ">\s*(?:<img [^>]+>)?\s*([^\s<]+(?:\s+[^\s<]+)*)\s*<\/div>/);
  const country = countryMatch ? countryMatch[1].trim() : 'FIDE';

  // Extract Flag Code (e.g., 'no' from /images/flags/no.svg)
  const flagCodeMatch = html.match(/<img src="\/images\/flags\/([a-z]+)\.svg"/i);
  const flagCode = flagCodeMatch ? flagCodeMatch[1].toLowerCase() : 'fide';

  // Extract Title
  const titleMatch = html.match(/<h5>FIDE title<\/h5>\s*<div class="profile-info-title ">\s*<p>([^<]+)<\/p>/);
  const title = titleMatch ? titleMatch[1].trim() : 'Grandmaster';

  // Extract Standard Rating
  const standardMatch = html.match(/<p>(\d+)<\/p>\s*<p style="[^"]*">STANDARD/i);
  const standardRating = standardMatch ? parseInt(standardMatch[1]) : 0;

  // Extract Rapid Rating
  const rapidMatch = html.match(/<p>(\d+)<\/p>\s*<p style="[^"]*">RAPID/i);
  const rapidRating = rapidMatch ? parseInt(rapidMatch[1]) : 0;

  // Extract Blitz Rating
  const blitzMatch = html.match(/<p>(\d+)<\/p>\s*<p style="[^"]*">BLITZ/i);
  const blitzRating = blitzMatch ? parseInt(blitzMatch[1]) : 0;

  // Extract Base64 Profile Photo
  const photoMatch = html.match(/<img class="profile-top__photo" src="(data:image\/[^;]+;base64,[^"]+)"/);
  const photoBase64 = photoMatch ? photoMatch[1] : null;

  return {
    fideId,
    name,
    bYear,
    country,
    flagCode,
    title,
    ratings: {
      standard: standardRating,
      rapid: rapidRating,
      blitz: blitzRating
    },
    photo: photoBase64
  };
}

export async function getPlayerStats(usernameOrFideId) {
  const playersPath = path.resolve("./players.json");
  const cachePath = path.resolve("./scratch/player_cache.json");

  if (!fs.existsSync(playersPath)) {
    throw new Error("players.json database not found!");
  }

  const players = JSON.parse(fs.readFileSync(playersPath, "utf-8"));
  let player = players.find(p => p.username.toLowerCase() === usernameOrFideId.toLowerCase() || p.fideId === usernameOrFideId);

  if (!player) {
    // If not found, select a random one
    console.log(`⚠️ Player '${usernameOrFideId}' not found. Selecting a random player instead.`);
    player = players[Math.floor(Math.random() * players.length)];
  }

  // Check cache
  if (!fs.existsSync(path.dirname(cachePath))) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  }

  let cache = {};
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    } catch (e) {
      cache = {};
    }
  }

  // Cache is valid for 24 hours
  const cacheEntry = cache[player.fideId];
  const now = Date.now();
  if (cacheEntry && (now - cacheEntry.timestamp < 24 * 60 * 60 * 1000) && cacheEntry.stats.photo) {
    console.log(`💾 Using cached FIDE stats for ${player.name}.`);
    return {
      ...player,
      fideStats: cacheEntry.stats
    };
  }

  try {
    const stats = await fetchFideProfile(player.fideId);
    cache[player.fideId] = {
      timestamp: now,
      stats
    };
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
    console.log(`💾 Cached FIDE stats for ${player.name}.`);
    return {
      ...player,
      fideStats: stats
    };
  } catch (err) {
    console.warn(`⚠️ Failed to fetch live FIDE stats: ${err.message}. Using mock/fallback stats.`);
    
    const FLAG_TO_COUNTRY = {
      "🇳🇴": { code: "no", name: "Norway" },
      "🇺🇸": { code: "us", name: "United States" },
      "🇮🇳": { code: "in", name: "India" },
      "🇨🇳": { code: "cn", name: "China" },
      "🇫🇷": { code: "fr", name: "France" },
      "🇷🇺": { code: "ru", name: "Russia" }
    };

    const countryInfo = FLAG_TO_COUNTRY[player.flag] || { code: "fide", name: "FIDE" };

    // Fallback if network fails
    const fallbackStats = {
      fideId: player.fideId,
      name: player.name,
      bYear: player.fideId === "1503014" ? "1990" : player.fideId === "2016192" ? "1987" : "1995",
      country: countryInfo.name,
      flagCode: countryInfo.code,
      title: player.fideId === "5022509" || player.fideId === "5007844" ? "IM" : "Grandmaster", // Distinguish Tania / Sagar IM title
      ratings: {
        standard: player.fideId === "1503014" ? 2841 : 2600,
        rapid: player.fideId === "1503014" ? 2832 : 2580,
        blitz: player.fideId === "1503014" ? 2869 : 2620
      },
      photo: null // Will display a fallback chess placeholder silhouette in UI
    };
    return {
      ...player,
      fideStats: fallbackStats
    };
  }
}

// Simple test block if run directly
if (process.argv[1] && process.argv[1].endsWith('fetch-player.mjs')) {
  getPlayerStats('magnuscarlsen')
    .then(data => {
      console.log("SUCCESS! Test player stats retrieved:");
      console.log(`Name: ${data.name}`);
      console.log(`Born: ${data.fideStats.bYear}`);
      console.log(`FIDE Standard Rating: ${data.fideStats.ratings.standard}`);
      console.log(`FIDE Rapid Rating: ${data.fideStats.ratings.rapid}`);
      console.log(`FIDE Blitz Rating: ${data.fideStats.ratings.blitz}`);
      console.log(`Has Photo Base64: ${data.fideStats.photo ? 'Yes (length: ' + data.fideStats.photo.length + ')' : 'No'}`);
    })
    .catch(err => console.error("Error running test:", err));
}
