import { Chess } from 'chess.js';

function test(initialFen, moves) {
    const game = new Chess(initialFen);
    for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        const res = game.move({ from: m.substring(0, 2), to: m.substring(2, 4), promotion: "q" });
        if (!res) {
            console.log(`Move ${i} (${m}) is ILLEGAL`);
            return false;
        }
    }
    return game.isCheckmate();
}

console.log("Morning M2:", test("4k3/8/8/8/8/8/8/1R1R2K1 w - - 0 1", ["d1d8", "e8e7", "b1b7"]));
console.log("Afternoon M3:", test("4k3/8/8/8/8/8/8/1R1R1R1K w - - 0 1", ["d1d8", "e8e7", "b1b7", "e7e6", "f1f6"]));
console.log("Evening M4:", test("4k3/8/8/8/8/8/8/1R1R1R1R w - - 0 1", ["d1d8", "e8e7", "b1b7", "e7e6", "f1f6", "e6e5", "h1h5"]));
