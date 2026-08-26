import { Composition } from "remotion";
import { PuzzleVideo } from "./PuzzleVideo";
import { PlayerStatsVideo } from "./PlayerStatsVideo";
import { OpeningVideo } from "./OpeningVideo";
import { SolvedPuzzleVideo } from "./SolvedPuzzleVideo";

export const RemotionRoot = () => {
  // Logic to calculate duration based on moves
  // Phase 1: 2s (Hook), Phase 2: 4s (Pause), Phase 3: 1.5s per move, Phase 4: 2s buffer at end
  const calculateDuration = (moves) => {
    const solutionMovesCount = Math.max(0, (moves?.length || 0));
    const totalDurationInSeconds = 2 + 4 + solutionMovesCount * 1.5 + 2; 
    return Math.ceil(totalDurationInSeconds * 30);
  };

  const calculateOpeningDuration = (moves) => {
    const movesCount = Math.max(0, (moves?.length || 0));
    const totalDurationInSeconds = 1.5 + movesCount * 1.5 + 3.0; // 1.5s intro + 1.5s/move + 3s buffer
    return Math.ceil(totalDurationInSeconds * 30);
  };

  const calculateSolvedPuzzleDuration = (props) => {
    if (props && props.solutions && Array.isArray(props.solutions) && props.solutions.length > 0) {
      let totalMoves = 0;
      props.solutions.forEach((s) => {
        totalMoves += s.puzzleMoves ? s.puzzleMoves.length : 0;
      });
      const rewindCount = props.solutions.length - 1;
      const totalDurationInSeconds = 10.0 + totalMoves * 1.5 + rewindCount * 1.0 + 3.5;
      return Math.ceil(totalDurationInSeconds * 30);
    }
    const movesCount = Math.max(0, (props?.puzzleMoves?.length || 0));
    const totalDurationInSeconds = 10.0 + movesCount * 1.5 + 3.5;
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

      <Composition
        id="PlayerStatsShort"
        component={PlayerStatsVideo}
        fps={30}
        width={2160}
        height={3840}
        durationInFrames={660} // Fixed 22 seconds
        defaultProps={{
          name: "Magnus Carlsen",
          flag: "🇳🇴",
          achievements: [
            "🏆 5x Classical World Champion",
            "🎯 Highest FIDE rating in history: 2882",
            "🔥 Holds a 125-game unbeaten streak",
            "👑 Undisputed World Blitz & Rapid King"
          ],
          playstyle: {
            tactics: 96,
            endgame: 99,
            positional: 99,
            speed: 98
          },
          fideStats: {
            bYear: "1990",
            country: "Norway",
            title: "Grandmaster",
            ratings: {
              standard: 2841,
              rapid: 2832,
              blitz: 2869
            },
            photo: null
          }
        }}
      />

      <Composition
        id="OpeningSeries"
        component={OpeningVideo}
        fps={30}
        width={2160}
        height={3840}
        calculateMetadata={({ props }) => {
          const duration = calculateOpeningDuration(props.puzzleMoves);
          return {
            durationInFrames: duration,
          };
        }}
        defaultProps={{
          openingName: "Italian Game",
          initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          puzzleMoves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
          sanList: ["1. e4", "1... e5", "2. Nf3", "2... Nc6", "3. Bc4"],
          colors: { dark: "#769656", light: "#eeeed2" },
          bg: "morning_bg.png",
          clubTitle: "CHOWKIDINGHEE CHESS CLUB",
          authorName: "by RAJNISH VERMA"
        }}
      />

      <Composition
        id="ChessOpeningShort"
        component={OpeningVideo}
        fps={30}
        width={2160}
        height={3840}
        calculateMetadata={({ props }) => {
          const duration = calculateOpeningDuration(props.puzzleMoves);
          return {
            durationInFrames: duration,
          };
        }}
        defaultProps={{
          openingName: "Italian Game",
          initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          puzzleMoves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
          sanList: ["1. e4", "1... e5", "2. Nf3", "2... Nc6", "3. Bc4"],
          colors: { dark: "#769656", light: "#eeeed2" },
          bg: "morning_bg.png",
          clubTitle: "CHOWKIDINGHEE CHESS CLUB",
          authorName: "by RAJNISH VERMA"
        }}
      />

      <Composition
        id="SolvedPuzzles"
        component={SolvedPuzzleVideo}
        fps={30}
        width={2160}
        height={3840}
        calculateMetadata={({ props }) => {
          const duration = calculateSolvedPuzzleDuration(props);
          return {
            durationInFrames: duration,
          };
        }}
        defaultProps={{
          puzzleTitle: "Solved Puzzles",
          initialFen: "2n1r2k/ppp3pp/2n3q1/3Q2N1/3P1p2/2P4P/PP3PP1/R4NK1 w - - 0 1",
          puzzleMoves: ["g5f7", "h8g8", "f7e5", "g8h8", "e5g6", "h7g6"],
          sanList: ["1. Nf7+", "1... Kg8", "2. Ne5+", "2... Kh8", "3. Nxg6+", "3... hxg6"],
          evaluation: "+-",
          sideToPlay: "White to Play",
          playerColor: "white",
          colors: { dark: "#769656", light: "#eeeed2" },
          bg: "morning_bg.png",
          clubTitle: "CHOWKIDINGHEE CHESS CLUB",
          authorName: "by RAJNISH VERMA"
        }}
      />

      <Composition
        id="ChessSolvedPuzzleShort"
        component={SolvedPuzzleVideo}
        fps={30}
        width={2160}
        height={3840}
        calculateMetadata={({ props }) => {
          const duration = calculateSolvedPuzzleDuration(props);
          return {
            durationInFrames: duration,
          };
        }}
        defaultProps={{
          puzzleTitle: "Solved Puzzles",
          initialFen: "2n1r2k/ppp3pp/2n3q1/3Q2N1/3P1p2/2P4P/PP3PP1/R4NK1 w - - 0 1",
          puzzleMoves: ["g5f7", "h8g8", "f7e5", "g8h8", "e5g6", "h7g6"],
          sanList: ["1. Nf7+", "1... Kg8", "2. Ne5+", "2... Kh8", "3. Nxg6+", "3... hxg6"],
          evaluation: "+-",
          sideToPlay: "White to Play",
          playerColor: "white",
          colors: { dark: "#769656", light: "#eeeed2" },
          bg: "morning_bg.png",
          clubTitle: "CHOWKIDINGHEE CHESS CLUB",
          authorName: "by RAJNISH VERMA"
        }}
      />
    </>
  );
};


