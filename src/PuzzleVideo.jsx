import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from "remotion";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { loadFont } from "@remotion/google-fonts/Outfit";
import Confetti from "remotion-confetti";

const { fontFamily } = loadFont();

export const PuzzleVideo = ({ 
  initialFen, 
  puzzleMoves, 
  playerColor,
  sessionTitle = "Sunrise Solve",
  mateCount = 2,
  colors = { dark: "#769656", light: "#eeeed2" }
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Solution moves now start from index 0
  const totalSolutionMoves = puzzleMoves?.length || 0;
  const lastMoveFrame = 120 + (totalSolutionMoves - 1) * 60; // Slightly faster start
  const isFinished = frame >= lastMoveFrame;

  const { currentFen, resultMetadata } = useMemo(() => {
    const game = new Chess(initialFen);

    // Initial pause (0-120)
    if (frame < 120) {
       return { currentFen: game.fen(), resultMetadata: null };
    }

    // Solution moves (120+)
    const solutionMovesCount = Math.floor((frame - 120) / 60);
    for (let i = 0; i <= solutionMovesCount && i < (puzzleMoves?.length || 0); i++) {
      try {
        const move = puzzleMoves[i];
        game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: "q" });
      } catch (e) {
        console.error("Invalid solution move at index", i, ":", puzzleMoves[i]);
      }
    }

    // Check for mate/win state
    let resultMetadata = null;
    if (frame >= lastMoveFrame) {
       if (game.isCheckmate()) {
          resultMetadata = { text: "CHECKMATE!", color: "#FFD700" };
       } else if (game.isDraw() || game.isStalemate()) {
          resultMetadata = { text: "STALEMATE", color: "#A9A9A9" };
       } else {
          resultMetadata = { text: "PUZZLE SOLVED!", color: colors.dark };
       }
    }

    return { currentFen: game.fen(), resultMetadata };
  }, [frame, initialFen, puzzleMoves, lastMoveFrame, colors]);

  // Animations
  const boardEntry = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const celebrationSpring = spring({
    frame: frame - lastMoveFrame,
    fps,
    config: { stiffness: 100, damping: 10 },
  });

  const showSolution = frame >= 120;
  
  const boardScale = interpolate(boardEntry, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0c",
        fontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, ${colors.dark}22 0%, transparent 70%)`,
        }}
      />
      
      {/* Confetti Effects */}
      {isFinished && (
        <>
          <Confetti
            particleCount={150}
            startVelocity={45}
            spread={70}
            x={width * 0.2}
            y={height * 0.4}
            colors={[colors.dark, '#FFD700', '#ffffff']}
            gravity={0.4}
          />
          <Confetti
            particleCount={150}
            startVelocity={45}
            spread={70}
            x={width * 0.8}
            y={height * 0.4}
            colors={[colors.dark, '#FFD700', '#ffffff']}
            gravity={0.4}
          />
        </>
      )}

      {/* Main Content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        zIndex: 1,
      }}>
        
        {/* Header Section */}
        <div style={{
          height: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: 80,
          opacity: interpolate(frame, [0, 30], [0, 1]),
        }}>
          {!isFinished && (
            <>
              <h2 style={{
                color: colors.dark,
                fontSize: 42,
                letterSpacing: 4,
                textTransform: "uppercase",
                margin: 0,
                opacity: 0.8,
              }}>
                {sessionTitle} — MATE IN {mateCount}
              </h2>
              <h1 style={{
                color: "white",
                fontSize: 84,
                fontWeight: 900,
                textAlign: "center",
                margin: "20px 0 0 0",
                textShadow: "0 0 30px rgba(255,255,255,0.2)",
              }}>
                {showSolution ? "SOLUTION REVEALED" : "CAN YOU FIND THE WIN?"}
              </h1>
            </>
          )}
        </div>

        {/* Board Container */}
        <div style={{
          position: "relative",
          width: width * 0.9,
          maxWidth: 900,
          transform: `scale(${boardScale})`,
          boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 40px ${colors.dark}22`,
          borderRadius: 16,
          overflow: "hidden",
          border: "4px solid rgba(255,255,255,0.05)",
        }}>
          <Chessboard
            position={currentFen}
            boardOrientation={playerColor}
            id="PremiumBoard"
            animationDuration={600}
            customDarkSquareStyle={{ backgroundColor: colors.dark }}
            customLightSquareStyle={{ backgroundColor: colors.light }}
          />
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: 100,
          height: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}>
          {!isFinished ? (
            <div style={{
              padding: "16px 40px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 100,
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              opacity: boardEntry,
            }}>
              <span style={{
                color: "white",
                fontSize: 32,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}>
                 {playerColor === "white" ? "⚪ White to Move" : "⚫ Black to Move"}
              </span>
            </div>
          ) : (
            <div style={{
              transform: `scale(${celebrationSpring})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
               <div style={{
                 padding: "24px 60px",
                 background: "rgba(255,215,0,0.1)",
                 borderRadius: 20,
                 border: `2px solid ${resultMetadata?.color || "#FFD700"}`,
                 backdropFilter: "blur(20px)",
                 boxShadow: `0 0 40px rgba(255,215,0,0.2)`,
               }}>
                 <span style={{
                   color: resultMetadata?.color || "white",
                   fontSize: 84,
                   fontWeight: 900,
                   letterSpacing: 8,
                   textTransform: "uppercase",
                 }}>
                   {resultMetadata?.text || "SOLVED"}
                 </span>
               </div>
            </div>
          )}
        </div>

      </div>

      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 12,
        backgroundColor: colors.dark,
        width: `${interpolate(frame, [0, lastMoveFrame + 60], [0, 100], { extrapolateRight: "clamp" })}%`,
        boxShadow: `0 0 20px ${colors.dark}88`,
      }} />
      
    </AbsoluteFill>
  );
};
