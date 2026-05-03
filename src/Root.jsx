import { Composition } from "remotion";
import { PuzzleVideo } from "./PuzzleVideo";

export const RemotionRoot = () => {
  // Logic to calculate duration based on moves
  // Phase 1: 1s, Phase 2: 2s, Phase 3: 4s, Phase 4: 1.5s per move
  const calculateDuration = (moves) => {
    const solutionMovesCount = Math.max(0, (moves?.length || 0) - 1);
    const totalDurationInSeconds = 1 + 2 + 4 + solutionMovesCount * 1.5 + 2; // +2s buffer at end
    return Math.ceil(totalDurationInSeconds * 30);
  };

  return (
    <>
      <Composition
        id="ChessShort"
        component={PuzzleVideo}
        fps={30}
        width={2160}
        height={3840}
        calculateMetadata={({ props }) => {
          const duration = calculateDuration(props.puzzleMoves);
          return {
            durationInFrames: duration,
          };
        }}
        defaultProps={{
          initialFen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
          puzzleMoves: ["f3g5", "O-O", "g5f7", "Rxf7", "c4f7", "Kxf7"],
          playerColor: "black",
          sessionTitle: "Sunrise Solve",
          colors: { dark: "#b58863", light: "#f0d9b5" }
        }}
      />
    </>
  );
};
