import fs from "fs";
import path from "path";
import { Chess } from "chess.js";

const PUZZLES_PATH = path.resolve("./puzzles.json");

function isValidMate(initialFen, moves) {
    const game = new Chess(initialFen);
    for (const move of moves) {
        try {
            // Support both object and string if needed, but let's be precise
            const res = game.move({ 
                from: move.substring(0, 2), 
                to: move.substring(2, 4), 
                promotion: move.length > 4 ? move.substring(4, 5) : "q" 
            });
            if (!res) return { valid: false, reason: `Invalid move: ${move}` };
            
            if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
                return { valid: false, reason: "Intermediate draw/stalemate" };
            }
        } catch (e) {
            return { valid: false, reason: e.message };
        }
    }
    return { valid: game.isCheckmate(), reason: game.isCheckmate() ? "Checkmate" : "Not a checkmate" };
}

const puzzles = JSON.parse(fs.readFileSync(PUZZLES_PATH, "utf-8"));
const results = puzzles.map(p => {
    const { valid, reason } = isValidMate(p.initialFen, p.puzzleMoves);
    return { id: p.id, valid, reason };
});

const invalid = results.filter(r => !r.valid);
console.log("Invalid Puzzles Found:");
console.table(invalid);
