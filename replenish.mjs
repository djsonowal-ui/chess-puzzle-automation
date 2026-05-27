import fs from "fs";
import path from "path";
import fetch from "cross-fetch";
import { Chess } from "chess.js";

const PUZZLES_PATH = path.resolve("./puzzles.json");
const POLGAR_URL = "https://raw.githubusercontent.com/denialromeo/4462-chess-problems/master/problems.json";

/**
 * Normalizes moves from "e2-e4" to UCI format "e2e4"
 */
function normalizeMove(move) {
  return move.replace("-", "");
}

/**
 * Verifies if the move sequence leads to a checkmate without intermediate draws
 */
function isPerfectMate(initialFen, moves) {
  const game = new Chess(initialFen);
  for (const move of moves) {
    try {
      const res = game.move({
        from: move.substring(0, 2),
        to: move.substring(2, 4),
        promotion: "q"
      });
      if (!res) return false;
      // Exclude draws or stalemates during the sequence
      if (game.isDraw() || game.isStalemate()) return false;
    } catch (e) {
      return false;
    }
  }
  return game.isCheckmate();
}

async function replenish() {
  console.log("🔄 Starting puzzle replenishment...");

  // 1. Load current puzzles
  let localPuzzles = [];
  if (fs.existsSync(PUZZLES_PATH)) {
    localPuzzles = JSON.parse(fs.readFileSync(PUZZLES_PATH, "utf-8"));
  }

  const unused = localPuzzles.filter(p => !p.used);
  console.log(`📊 Current Stock: ${unused.length} unused puzzles.`);

  // 2. Fetch Polgar Dataset
  console.log("📥 Fetching Polgár dataset...");
  const response = await fetch(POLGAR_URL);
  if (!response.ok) throw new Error("Failed to fetch Polgár dataset");
  const data = await response.json();
  const polgarProblems = data.problems;

  // 3. Replenish logic
  const sessions = [
    { name: "morning", mateCount: 2, polgarType: "Mate in Two" },
    { name: "afternoon", mateCount: 3, polgarType: "Mate in Three" },
    { name: "evening", mateCount: 3, polgarType: "Mate in Three" }
  ];

  let addedCount = 0;
  
  for (const session of sessions) {
    const sessionUnused = unused.filter(p => p.session === session.name);
    
    // We want at least 15 unused per session (15 * 3 = 45 total)
    const targetStock = 15; 
    const needed = targetStock - sessionUnused.length;

    if (needed > 0) {
      console.log(`➕ Slot [${session.name}]: Need ${needed} more puzzles.`);
      
      // Find candidate puzzles from Polgar that aren't already in our local DB
      // Added FEN-based deduplication to prevent same position with different IDs
      const potential = polgarProblems.filter(p => 
        p.type === session.polgarType && 
        !localPuzzles.some(lp => lp.id === `polgar_${p.problemid}` || lp.initialFen === p.fen)
      );

      // Shuffle and pick valid ones
      const shuffled = potential.sort(() => 0.5 - Math.random());
      const selected = [];
      
      for (const p of shuffled) {
        if (selected.length >= needed) break;
        
        const moves = p.moves.split(";").map(normalizeMove);
        if (isPerfectMate(p.fen, moves)) {
          selected.push(p);
        } else {
          console.warn(`⚠️ Skipping Polgar ${p.problemid}: Not a clean checkmate.`);
        }
      }

      selected.forEach(p => {
        localPuzzles.push({
          id: `polgar_${p.problemid}`,
          session: session.name,
          mateCount: session.mateCount,
          initialFen: p.fen,
          puzzleMoves: p.moves.split(";").map(normalizeMove),
          playerColor: p.first.toLowerCase().includes("white") ? "white" : "black",
          used: false,
          addedDate: new Date().toISOString()
        });
        addedCount++;
      });
    } else {
      console.log(`✅ Slot [${session.name}]: Adequate stock (${sessionUnused.length}).`);
    }
  }

  // 4. Save updated database
  if (addedCount > 0) {
    fs.writeFileSync(PUZZLES_PATH, JSON.stringify(localPuzzles, null, 2));
    console.log(`💾 Successfully added ${addedCount} new puzzles to puzzles.json.`);
  } else {
    console.log("⏭️ No new puzzles added.");
  }
}

replenish().catch(console.error);
