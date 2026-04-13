import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { loadFont } from "@remotion/google-fonts/Outfit";

const { fontFamily } = loadFont();

export const PuzzleVideo = ({ initialFen, puzzleMoves, playerColor }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const currentFen = useMemo(() => {
    const game = new Chess(initialFen);

    // Phase 1: Pause (0-30)
    if (frame < 30) return initialFen;

    // Phase 2: First move (30-150) - Opponent's mistake
    if (puzzleMoves && puzzleMoves.length > 0) {
      try {
        game.move(puzzleMoves[0]);
      } catch (e) {
        console.error("Invalid move:", puzzleMoves[0]);
      }
    }
    if (frame < 150) return game.fen();

    // Phase 3: Solution moves (150+)
    const solutionMovesCount = Math.floor((frame - 150) / 45);
    for (let i = 1; i <= solutionMovesCount + 1 && i < (puzzleMoves?.length || 0); i++) {
      try {
        game.move(puzzleMoves[i]);
      } catch (e) {
        console.error("Invalid move at index", i, ":", puzzleMoves[i]);
      }
    }
    return game.fen();
  }, [frame, initialFen, puzzleMoves]);

  // Spring animation for board entry
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 12,
    },
  });

  const boardScale = interpolate(entrance, [0, 1], [0.8, 1]);
  const boardOpacity = interpolate(entrance, [0, 1], [0, 1]);

  const showThinkingText = frame >= 30 && frame < 150;

  // Responsive scaling
  const boardContainerWidth = Math.min(width * 0.85, 1800);
  const titleFontSize = Math.max(width * 0.045, 48);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle, #2c2c34 0%, #1a1a1d 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        fontFamily,
      }}
    >
      {/* Thinking Header */}
      <div
        style={{
          height: titleFontSize * 2.5,
          display: "flex",
          alignItems: "center",
          marginBottom: width * 0.08,
          opacity: showThinkingText ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <h1
          style={{
            color: "white",
            fontSize: titleFontSize,
            fontWeight: 800,
            textAlign: "center",
            margin: 0,
            textShadow: "0 0 20px rgba(255,255,255,0.3)",
            letterSpacing: "-0.02em",
          }}
        >
          FIND THE BEST MOVE
        </h1>
      </div>

      {/* Main Board Container */}
      <div
        style={{
          width: boardContainerWidth,
          transform: `scale(${boardScale})`,
          opacity: boardOpacity,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Chessboard
          position={currentFen}
          boardOrientation={playerColor}
          id="PremiumBoard"
          animationDuration={300}
          customDarkSquareStyle={{ backgroundColor: "#779556" }}
          customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
        />
      </div>

      {/* Player Indicator */}
      <div
        style={{
          marginTop: width * 0.1,
          padding: `${width * 0.02}px ${width * 0.05}px`,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: titleFontSize * 0.4,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {playerColor === "white" ? "White to Move" : "Black to Move"}
        </span>
      </div>
    </div>
  );
};
