import { Chess } from 'chess.js';
import fs from 'fs';

const puzzles = JSON.parse(fs.readFileSync('./puzzles.json', 'utf8'));

console.log('--- Starting Puzzle Verification ---');

puzzles.forEach((puzzle) => {
    console.log(`\n--- Testing Puzzle: ${puzzle.id} (${puzzle.session}) ---`);
    const game = new Chess(puzzle.initialFen);
    
    puzzle.puzzleMoves.forEach((move, index) => {
        try {
            // Support both object and string format if needed, but here we expect UCI string
            const result = game.move({
                from: move.substring(0, 2),
                to: move.substring(2, 4),
                promotion: 'q'
            });
            
            if (result) {
                console.log(`Step ${index} (${move}): OK`);
            } else {
                console.log(`Step ${index} (${move}): FAILED! (Illegal move)`);
            }
        } catch (err) {
            console.log(`Step ${index} (${move}): ERROR - ${err.message}`);
        }
    });

    if (game.isCheckmate()) {
        console.log(`✅ Result: CHECKMATE`);
    } else {
        console.log(`❌ Result: NOT CHECKMATE`);
        console.log(`Current FEN: ${game.fen()}`);
        console.log(`Is Check: ${game.isCheck()}`);
    }
});
