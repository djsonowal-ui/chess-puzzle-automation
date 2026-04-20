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
    
    // Priority 1: Match BOTH session and mateCount
    let match = puzzles.filter(p => p.session === session && p.mateCount === requiredMateCount);
    
    // Priority 2: Match just mateCount
    if (match.length === 0) {
      match = puzzles.filter(p => p.mateCount === requiredMateCount);
    }

    if (match.length > 0) {
      const puzzle = match[Math.floor(Math.random() * match.length)];
      console.log(`✅ Selected Local Puzzle: ${puzzle.id} (Mate in ${puzzle.mateCount})`);
      return puzzle;
    }
  }

  // Fallback to Lichess Daily if no local match found
  console.log("⚠️ No matching mate-in-X puzzle found in local DB. Falling back to Lichess Daily.");
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
    id: `lichess_daily_${data.puzzle.id}`,
    mateCount: Math.floor(puzzleMoves.length / 2), // Rough estimate for display
  };
}
