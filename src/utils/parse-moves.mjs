import { Chess } from "chess.js";

/**
 * Parses user provided move inputs in SAN, PGN, or UCI format into structured move data for Remotion rendering.
 * @param {string | string[]} inputMoves 
 * @param {string} [customInitialFen] 
 */
export function parseOpeningMoves(inputMoves, customInitialFen) {
  const initialFen = customInitialFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const game = new Chess(initialFen);

  let rawMoveList = [];

  if (typeof inputMoves === "string") {
    // Clean move numbers, dots, headers if PGN or SAN string format (e.g. "1. e4 e5 2. Nf3 Nc6")
    const cleaned = inputMoves
      .replace(/\[.*?\]/g, "") // Remove PGN tags
      .replace(/\d+\.\.\./g, "") // Remove 1...
      .replace(/\d+\./g, "") // Remove 1.
      .replace(/\{.*?\}/g, "") // Remove comments
      .trim();
    
    rawMoveList = cleaned.split(/\s+/).filter(m => m.length > 0);
  } else if (Array.isArray(inputMoves)) {
    rawMoveList = inputMoves;
  }

  const puzzleMoves = [];
  const sanList = [];
  const fenHistory = [initialFen];

  let moveNumber = 1;

  for (let i = 0; i < rawMoveList.length; i++) {
    const rawMove = rawMoveList[i];
    let moveObj = null;

    // Try parsing as SAN (e.g. "e4", "Nf3", "O-O")
    try {
      moveObj = game.move(rawMove);
    } catch (e1) {
      // Try parsing as UCI (e.g. "e2e4", "g1f3")
      if (rawMove.length >= 4) {
        try {
          moveObj = game.move({
            from: rawMove.substring(0, 2),
            to: rawMove.substring(2, 4),
            promotion: rawMove.substring(4, 5) || "q"
          });
        } catch (e2) {
          throw new Error(`Invalid move at position ${i + 1}: '${rawMove}'`);
        }
      } else {
        throw new Error(`Invalid move at position ${i + 1}: '${rawMove}'`);
      }
    }

    if (!moveObj) {
      throw new Error(`Illegal move at position ${i + 1}: '${rawMove}'`);
    }

    // Format UCI string
    const uciMove = moveObj.from + moveObj.to + (moveObj.promotion ? moveObj.promotion : "");
    puzzleMoves.push(uciMove);

    // Format SAN notation string (e.g., "1. e4", "1... e5")
    const isWhite = moveObj.color === "w";
    const currentMoveNum = Math.floor(i / 2) + 1;
    const sanFormatted = isWhite ? `${currentMoveNum}. ${moveObj.san}` : `${currentMoveNum}... ${moveObj.san}`;
    sanList.push(sanFormatted);

    fenHistory.push(game.fen());
  }

  return {
    initialFen,
    puzzleMoves,
    sanList,
    fenHistory,
    totalMoves: puzzleMoves.length,
    finalFen: game.fen()
  };
}
