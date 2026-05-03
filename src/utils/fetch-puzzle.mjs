import fetch from "cross-fetch";
import fs from "fs";
import path from "path";

/**
 * Fetches a puzzle for the given session and required mate count.
 * @param {'morning' | 'afternoon' | 'evening'} session
 * @param {number} requiredMateCount
 * @returns {Promise<{initialFen: string, puzzleMoves: string[], playerColor: string, id: string, mateCount: number}>}
 */
export async function getSessionPuzzle(session, requiredMateCount) {
  console.log(`🔍 Selecting puzzle for session: ${session} (Required: Mate in ${requiredMateCount})...`);
  
  // Try to use the local database
  const puzzlesPath = path.resolve("./puzzles.json");
  if (fs.existsSync(puzzlesPath)) {
    const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, "utf-8"));
    
    // Filter for UNUSED puzzles (handle cases where 'used' field might be missing)
    const unusedPuzzles = puzzles.filter(p => p.used === false || p.used === undefined);
    
    // Get all USED FENs to prevent repetition even if IDs differ
    const usedFens = new Set(puzzles.filter(p => p.used === true).map(p => p.initialFen));
    
    // Final pool: Unused AND FEN has never been seen in used set
    const finalPool = unusedPuzzles.filter(p => !usedFens.has(p.initialFen));
    
    console.log(`📊 Local pool: ${finalPool.length} unique unused puzzles available.`);

    // Priority 1: Match BOTH session and mateCount
    let match = finalPool.filter(p => p.session === session && p.mateCount === requiredMateCount);
    
    // Priority 2: Match just mateCount
    if (match.length === 0) {
      console.log(`ℹ️ No ${session}-specific puzzles. Looking for any Mate in ${requiredMateCount}...`);
      match = finalPool.filter(p => p.mateCount === requiredMateCount);
    }

    if (match.length > 0) {
      const puzzle = match[Math.floor(Math.random() * match.length)];
      console.log(`✅ Selected Local Puzzle: ${puzzle.id} (Mate in ${puzzle.mateCount})`);
      return puzzle;
    }
  }

  // Fallback to Lichess Daily if no local match found
  console.log("⚠️ CRITICAL: No matching puzzles found in local DB. Falling back to Lichess Daily.");
  console.log("📝 Note: Falling back to Lichess Daily may result in duplicate uploads if run multiple times today.");
  
  const response = await fetch("https://lichess.org/api/puzzle/daily");
  if (!response.ok) {
    throw new Error(`Failed to fetch Lichess puzzle: ${response.statusText}`);
  }

  const data = await response.json();
  const initialFen = data.puzzle.fen;
  const puzzleMoves = data.puzzle.solution;
  const sideToMove = initialFen.split(" ")[1];
  const playerColor = sideToMove === "w" ? "white" : "black";

  return {
    initialFen,
    puzzleMoves,
    playerColor,
    id: `lichess_daily_${data.puzzle.id}_${new Date().toISOString().split('T')[0]}`,
    mateCount: Math.floor(puzzleMoves.length / 2),
  };
}
