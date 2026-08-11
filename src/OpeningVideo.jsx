import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill, Audio, staticFile } from "remotion";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { loadFont } from "@remotion/google-fonts/Outfit";

const { fontFamily } = loadFont();

export const OpeningVideo = ({
  openingName = "Italian Game",
  initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  puzzleMoves = ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
  sanList = ["1. e4", "1... e5", "2. Nf3", "2... Nc6", "3. Bc4"],
  colors = { dark: "#769656", light: "#eeeed2" },
  bg = "morning_bg.png",
  clubTitle = "CHOWKIDINGHEE CHESS CLUB",
  authorName = "by RAJNISH VERMA"
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Phase Definitions (at 30fps)
  const startDelay = 45; // 1.5s initial pause before moves start
  const moveInterval = 45; // 1.5s per move
  const totalHalfMoves = puzzleMoves.length;
  const totalFullMoves = Math.ceil(totalHalfMoves / 2); // 1 pair of moves = 1 move

  const { currentFen, solutionIndex, isCheck, lastMove } = useMemo(() => {
    const game = new Chess(initialFen);
    let solutionIndex = -1;
    let isCheck = false;
    let lastMove = null;

    if (frame >= startDelay) {
      solutionIndex = Math.floor((frame - startDelay) / moveInterval);
      for (let i = 0; i <= solutionIndex && i < puzzleMoves.length; i++) {
        try {
          const m = puzzleMoves[i];
          const result = game.move({
            from: m.substring(0, 2),
            to: m.substring(2, 4),
            promotion: m.substring(4, 5) || "q"
          });
          if (i === solutionIndex) {
            lastMove = result;
            isCheck = result.flags.includes("c") || result.flags.includes("k");
          }
        } catch (e) {
          console.error("Invalid opening move:", puzzleMoves[i]);
        }
      }
    }

    return { currentFen: game.fen(), solutionIndex, isCheck, lastMove };
  }, [frame, initialFen, puzzleMoves]);

  // Spring animation for board scale entry
  const boardEntry = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const boardScale = interpolate(boardEntry, [0, 1], [0.9, 1]);

  // Highlight colors
  const arrowColor = "rgba(255, 215, 0, 0.85)"; // Gold Arrow

  // Compute arrow tuple [from, to, color]
  const moveArrow = useMemo(() => {
    if (solutionIndex < 0) return null;
    const moveIdx = Math.min(solutionIndex, puzzleMoves.length - 1);
    const m = puzzleMoves[moveIdx];
    if (!m || m.length < 4) return null;
    return [m.substring(0, 2), m.substring(2, 4), arrowColor];
  }, [solutionIndex, puzzleMoves]);

  // Highlight squares for last move
  const moveSquareStyles = useMemo(() => {
    if (solutionIndex < 0) return {};
    const moveIdx = Math.min(solutionIndex, puzzleMoves.length - 1);
    const m = puzzleMoves[moveIdx];
    if (!m || m.length < 4) return {};

    const fromSquare = m.substring(0, 2);
    const toSquare = m.substring(2, 4);

    return {
      [fromSquare]: { backgroundColor: "rgba(255, 215, 0, 0.25)" },
      [toSquare]: { backgroundColor: "rgba(255, 215, 0, 0.35)" },
    };
  }, [solutionIndex, puzzleMoves]);

  const currentMoveText = solutionIndex >= 0 && solutionIndex < sanList.length ? sanList[solutionIndex] : "";
  const currentFullMoveNum = Math.floor(Math.max(0, solutionIndex) / 2) + 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080c14",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background Audio - Decreased volume by 50% (0.25 -> 0.12) */}
      <Audio key="bg-music" src={staticFile("lofi-music.mp3")} volume={0.12} loop />

      {/* Move Sound Trigger - Decreased volume by 50% (0.6 -> 0.3) */}
      {frame >= startDelay && (frame - startDelay) % moveInterval === 0 && solutionIndex < totalHalfMoves && (
        <Audio src={staticFile(isCheck ? "check.mp3" : "move.mp3")} volume={0.3} />
      )}

      {/* Background Image */}
      <img
        src={staticFile(bg)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.5,
          transform: `scale(${interpolate(frame, [0, 900], [1, 1.08])})`
        }}
        alt="background"
      />

      {/* Dark Vignette Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, rgba(8,12,20,0.95) 0%, rgba(8,12,20,0.4) 30%, rgba(8,12,20,0.4) 70%, rgba(8,12,20,0.95) 100%)`,
        }}
      />

      {/* HEADER SECTION - MOVED DOWN CLOSER TO BOARD & LARGER FONTS */}
      <div
        style={{
          position: "absolute",
          top: 340, // Moved down closer to the board (was 180)
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 50,
          padding: "0 40px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            background: "rgba(10, 16, 28, 0.88)",
            backdropFilter: "blur(24px)",
            padding: "42px 70px",
            borderRadius: 40,
            border: "3px solid rgba(255, 215, 0, 0.5)",
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.85), 0 0 50px rgba(255, 215, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            width: "92%"
          }}
        >
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: 84, // Increased font size (was 68)
              fontWeight: 900,
              margin: 0,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: "0 4px 25px rgba(255, 215, 0, 0.4)",
              lineHeight: 1.1
            }}
          >
            {clubTitle}
          </h1>

          <div
            style={{
              height: 4,
              width: 180,
              background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
              borderRadius: 2
            }}
          />

          <p
            style={{
              color: "#FFD700",
              fontSize: 58, // Increased font size (was 48)
              fontWeight: 800,
              margin: 0,
              letterSpacing: 7,
              textTransform: "uppercase"
            }}
          >
            {authorName}
          </p>
        </div>
      </div>

      {/* CHESSBOARD CONTAINER */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${boardScale})`,
          width: 1800,
          height: 1800,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 28,
          boxShadow: `0 30px 90px rgba(0, 0, 0, 0.9), 0 0 60px ${colors.dark}44`,
          padding: 24,
          background: "rgba(12, 18, 30, 0.9)",
          border: "3px solid rgba(255, 255, 255, 0.15)",
          zIndex: 40
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }}>
          <Chessboard
            position={currentFen}
            boardOrientation="white"
            customBoardStyle={{
              borderRadius: "16px",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
            }}
            customDarkSquareStyle={{ backgroundColor: colors.dark }}
            customLightSquareStyle={{ backgroundColor: colors.light }}
            customSquareStyles={moveSquareStyles}
            customArrows={moveArrow ? [moveArrow] : []}
            arePiecesDraggable={false}
            animationDuration={350}
          />
        </div>
      </div>

      {/* FOOTER SECTION - MOVED UP CLOSER TO BOARD & LARGER FONTS */}
      <div
        style={{
          position: "absolute",
          bottom: 380, // Moved up closer to board (was 220)
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 50,
          padding: "0 50px",
          gap: 24
        }}
      >
        {/* Opening Name Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(10, 16, 28, 0.9))",
            border: "3px solid #FFD700",
            padding: "24px 70px",
            borderRadius: 60,
            boxShadow: "0 15px 50px rgba(0, 0, 0, 0.8)",
            textAlign: "center"
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 66, // Increased font size (was 54)
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: "uppercase"
            }}
          >
            ♟️ {openingName}
          </span>
        </div>

        {/* Current Move Played Banner (1 pair of move = 1 move) */}
        {currentMoveText && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "2px solid rgba(255, 255, 255, 0.25)",
              padding: "20px 50px",
              borderRadius: 36,
              display: "flex",
              alignItems: "center",
              gap: 20
            }}
          >
            <span style={{ color: "#94A3B8", fontSize: 48, fontWeight: 700 }}>
              Move {currentFullMoveNum} of {totalFullMoves}:
            </span>
            <span style={{ color: "#38BDF8", fontSize: 54, fontWeight: 900, letterSpacing: 2 }}>
              {currentMoveText}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
