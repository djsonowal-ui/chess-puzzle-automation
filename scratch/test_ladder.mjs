import { Chess } from "chess.js";

function test(initialFen, moves) {
    const game = new Chess(initialFen);
    for (const m of moves) {
        const res = game.move({ from: m.substring(0, 2), to: m.substring(2, 4), promotion: "q" });
        if (!res) return false;
    }
    return game.isCheckmate();
}

// Afternoon Mate in 3 (6 half-moves)
// W Rooks: a1, c1, e1. King: h8 (Black)
const m3_fen = "7k/8/8/8/8/8/8/R1R1R2K w - - 0 1";
const m3_moves = ["a1a8", "h8h7", "c1c7", "h7h6", "e1e6"];
console.log("M3 (5 half-moves):", test(m3_fen, m3_moves)); // White-Black-White-Black-White

// Evening Mate in 4 (7 half-moves)
const m4_fen = "7k/8/8/8/8/8/8/R1R1R1RK w - - 0 1";
const m4_moves = ["a1a8", "h8h7", "c1c7", "h7h6", "e1e6", "h6h5", "g1g5"];
console.log("M4 (7 half-moves):", test(m4_fen, m4_moves));

// Morning Mate in 2 (3 half-moves)
const m2_fen = "7k/8/8/8/8/8/8/R1R4K w - - 0 1";
const m2_moves = ["a1a8", "h8h7", "c1c7"];
console.log("M2 (3 half-moves):", test(m2_fen, m2_moves));
