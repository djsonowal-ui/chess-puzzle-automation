import { Chess } from "chess.js";

function verify(id, initialFen, moves) {
    console.log(`\n--- Testing Puzzle: ${id} ---`);
    const game = new Chess(initialFen);
    moves.forEach((m, i) => {
        try {
            const res = game.move({ from: m.substring(0, 2), to: m.substring(2, 4), promotion: "q" });
            if (!res) throw new Error("Invalid move");
        } catch (e) {
            console.error(`Step ${i} (${m}) failed: ${e.message}`);
            return;
        }
    });
    console.log(`Is Checkmate? ${game.isCheckmate()}`);
    console.log(`Final FEN: ${game.fen()}`);
}

// Mate in 2 (00sHx)
verify("00sHx", "q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b - - 0 1", ["e8d7", "a2e6", "d7d8", "f7f8"]);

// Mate in 3 (DjmbO)
// Note: White just played f1g1. Black to move.
verify("DjmbO", "r1bq2k1/1p4pp/p2p4/3Np3/2P1P2r/8/PP2QP1P/R4RK1 w - - 0 1", ["f1g1", "h4h2", "h1h2", "d8h4", "h2g2", "h4h3"]);

// Mate in 4 (biIqt)
verify("biIqt", "k6r/ppB4p/6p1/3r1pP1/3pp3/1b6/P6P/R1R3K1 b - - 0 1", ["a4b3", "a1a7", "a8a7", "c1a1", "b3a2", "a1a2", "d5a5", "a2a5"]);
