import { Chess } from 'chess.js';
import fs from 'fs';

const puzzles = JSON.parse(fs.readFileSync('puzzles.json', 'utf-8'));
const morning = puzzles.find(p => p.id === 'morning_mate_2');

console.log('--- Morning Puzzle Check ---');
console.log('Initial FEN:', morning.initialFen);
const game = new Chess(morning.initialFen);

morning.puzzleMoves.forEach((move, i) => {
    console.log(`Move ${i}: ${move}`);
    try {
        const result = game.move({
            from: move.substring(0, 2),
            to: move.substring(2, 4),
            promotion: 'q'
        });
        if (!result) {
            console.error(`Move ${i} (${move}) is ILLEGAL!`);
        } else {
            console.log(`Move ${i} (${move}) is valid. New FEN: ${game.fen()}`);
        }
    } catch (e) {
        console.error(`Error on move ${i}: ${e.message}`);
    }
});

console.log('Final State - isCheckmate:', game.isCheckmate());
