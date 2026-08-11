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
  const totalMoves = puzzleMoves.length;

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

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080c14",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background Audio */}
      <Audio key="bg-music" src={staticFile("lofi-music.mp3")} volume={0.25} loop />

      {/* Move Sound Trigger */}
      {frame >= startDelay && (frame - startDelay) % moveInterval === 0 && solutionIndex < totalMoves && (
        <Audio src={staticFile(isCheck ? "check.mp3" : "move.mp3")} volume={0.6} />
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

      {/* HEADER SECTION - CUSTOM BRANDING */}
      <div
        style={{
          position: "absolute",
          top: 180,
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
            background: "rgba(10, 16, 28, 0.85)",
            backdropFilter: "blur(20px)",
            padding: "36px 60px",
            borderRadius: 36,
            border: "2px solid rgba(255, 215, 0, 0.4)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            width: "90%"
          }}
        >
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: 68,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: "0 4px 20px rgba(255, 215, 0, 0.3)",
              lineHeight: 1.1
            }}
          >
            {clubTitle}
          </h1>

          <div
            style={{
              height: 3,
              width: 140,
              background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
              borderRadius: 2
            }}
          />

          <p
            style={{
              color: "#FFD700",
              fontSize: 48,
              fontWeight: 700,
              margin: 0,
              letterSpacing: 6,
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

      {/* BOTTOM OPENING NAME & MOVE TICKER */}
      <div
        style={{
          position: "absolute",
          bottom: 220,
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
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 0, 0, 0.7))",
            border: "2px solid #FFD700",
            padding: "20px 60px",
            borderRadius: 50,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
            textAlign: "center"
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 54,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase"
            }}
          >
            ♟️ {openingName}
          </span>
        </div>

        {/* Current Move Played Banner */}
        {currentMoveText && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "16px 44px",
              borderRadius: 30,
              display: "flex",
              alignItems: "center",
              gap: 16
            }}
          >
            <span style={{ color: "#94A3B8", fontSize: 40, fontWeight: 600 }}>
              Move {solutionIndex + 1} of {totalMoves}:
            </span>
            <span style={{ color: "#38BDF8", fontSize: 44, fontWeight: 800, letterSpacing: 1 }}>
              {currentMoveText}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
