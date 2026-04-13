import { Composition } from "remotion";
import { PuzzleVideo } from "./PuzzleVideo";

export const RemotionRoot = () => {
  const puzzle = {
    initialFen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
    puzzleMoves: ["f3g5", "O-O", "g5f7", "Rxf7", "b4f7", "Kxf7"],
    playerColor: "black",
  };

  const calculateDuration = (moves) => {
    const solutionMovesCount = Math.max(0, moves.length - 1);
    return 150 + solutionMovesCount * 45 + 60;
  };

  return (
    <>
      <Composition
        id="ChessPuzzle"
        component={PuzzleVideo}
        durationInFrames={calculateDuration(puzzle.puzzleMoves)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={puzzle}
      />
      <Composition
        id="ChessShort"
        component={PuzzleVideo}
        durationInFrames={300}
        fps={30}
        width={2160}
        height={3840}
        defaultProps={{
          initialFen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
          puzzleMoves: ["e1g1", "d7d6", "h2h3", "h7h6"],
          playerColor: "white",
        }}
      />
    </>
  );
};
