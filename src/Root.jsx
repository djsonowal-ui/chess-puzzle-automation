import { Composition } from "remotion";
import { PuzzleVideo } from "./PuzzleVideo";

export const RemotionRoot = () => {
  // Logic to calculate duration based on moves
  const calculateDuration = (moves) => {
    const solutionMovesCount = Math.max(0, (moves?.length || 0) - 1);
    return 30 + 150 + solutionMovesCount * 60 + 60;
  };

  return (
    <>
      <Composition
        id="ChessShort"
        component={PuzzleVideo}
        fps={30}
        width={1080}
        height={1920}
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
