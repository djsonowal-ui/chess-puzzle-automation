import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill, Audio, staticFile } from "remotion";
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
  colors = { dark: "#769656", light: "#eeeed2" },
  bg = "morning_bg.png",
  hookText = "BRILLIANT MATE IN 2!"
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Phase Definitions (at 30fps)
  const hookEnd = 60;  // 2s Hook
  const pauseEnd = 180; // 4s Pause (Total 6s before moves)
  const moveInterval = 45; // 1.5s per move

  const { currentFen, phase, resultMetadata, solutionIndex, isCheck } = useMemo(() => {
    const game = new Chess(initialFen);
    let currentPhase = "HOOK";
    let solutionIndex = -1;
    let isCheck = false;

    // Phase 1: Hook (0-2s)
    if (frame < hookEnd) {
      currentPhase = "HOOK";
      solutionIndex = -1;
    } 
    // Phase 2: Pause / Challenge (2-6s)
    else if (frame < pauseEnd) {
      currentPhase = "PAUSE";
      solutionIndex = -1;
    } 
    // Phase 3: Solution Moves (6s+)
    else {
      currentPhase = "SOLUTION";
      // Apply solution moves (starting from index 0)
      solutionIndex = Math.floor((frame - pauseEnd) / moveInterval);
      for (let i = 0; i <= solutionIndex && i < puzzleMoves.length; i++) {
        try {
          const m = puzzleMoves[i];
          const result = game.move({ from: m.substring(0, 2), to: m.substring(2, 4), promotion: "q" });
          isCheck = result.flags.includes("c") || result.flags.includes("k");
        } catch (e) {
          console.error("Invalid move:", puzzleMoves[i]);
        }
      }
    }

    let resultMetadata = null;
    const isFinished = solutionIndex >= puzzleMoves.length - 1 && solutionIndex !== -1;
    if (isFinished) {
       if (game.isCheckmate()) {
          resultMetadata = { text: "CHECKMATE!", color: "#FFD700" };
       } else {
          resultMetadata = { text: "SOLVED!", color: colors.dark };
       }
    }

    return { currentFen: game.fen(), phase: currentPhase, resultMetadata, solutionIndex, isCheck };
  }, [frame, initialFen, puzzleMoves, colors.dark]);

  const isFinished = !!resultMetadata;

  // Animations
  const boardEntry = spring({
    frame: frame - hookEnd,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const celebrationSpring = spring({
    frame: frame - (pauseEnd + (puzzleMoves.length - 1) * moveInterval + 15),
    fps,
    config: { stiffness: 100, damping: 10 },
  });

  const boardScale = interpolate(boardEntry, [0, 1], [0.85, 1]);
  
  // Board Pulsing Glow (Viral tension)
  const boardPulse = phase === "PAUSE" ? interpolate(Math.sin(frame / 5), [-1, 1], [0.1, 0.4]) : 0;

  // Calculate dynamic arrow color based on active theme
  const arrowColor = useMemo(() => {
    if (bg.includes("morning")) {
      return "rgba(255, 110, 0, 0.85)"; // Warm Sunrise Orange
    }
    if (bg.includes("afternoon")) {
      return "rgba(255, 215, 0, 0.85)"; // Premium Golden Yellow
    }
    return "rgba(0, 255, 255, 0.85)"; // Electric Cyan
  }, [bg]);

  // Compute arrow tuple [from, to, color]
  const lastMoveArrow = useMemo(() => {
    if (phase !== "SOLUTION" || solutionIndex < 0) return null;
    const moveIdx = Math.min(solutionIndex, puzzleMoves.length - 1);
    const m = puzzleMoves[moveIdx];
    if (!m || m.length < 4) return null;
    return [m.substring(0, 2), m.substring(2, 4), arrowColor];
  }, [phase, solutionIndex, puzzleMoves, arrowColor]);

  // Compute soft square highlights for the last move
  const lastMoveSquareStyles = useMemo(() => {
    if (phase !== "SOLUTION" || solutionIndex < 0) return {};
    const moveIdx = Math.min(solutionIndex, puzzleMoves.length - 1);
    const m = puzzleMoves[moveIdx];
    if (!m || m.length < 4) return {};
    
    const fromSquare = m.substring(0, 2);
    const toSquare = m.substring(2, 4);
    
    const highlightColor = arrowColor.replace("0.85", "0.15"); // Soften opacity for highlight

    return {
      [fromSquare]: { backgroundColor: highlightColor },
      [toSquare]: { backgroundColor: highlightColor },
    };
  }, [phase, solutionIndex, puzzleMoves, arrowColor]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Audio Engine */}
      <Audio key="bg-music" src={staticFile("lofi-music.mp3")} volume={0.25} loop />
      
      {/* Tension Ticking (Phase 2) */}
      {frame >= hookEnd && frame < pauseEnd && (frame % 30 === 0) && (
        <Audio src={staticFile("tick.mp3")} volume={0.15} />
      )}

      {/* Move Sounds */}
      {phase === "SOLUTION" && (frame - pauseEnd) % moveInterval === 0 && (
        <Audio src={staticFile(isCheck ? "check.mp3" : "move.mp3")} volume={0.5} />
      )}

      {/* Win Sound */}
      {isFinished && (frame === pauseEnd + (puzzleMoves.length - 1) * moveInterval + 15) && (
        <Audio src={staticFile("win.mp3")} volume={0.7} />
      )}

      {/* Dynamic Background Image */}
      <img 
        src={staticFile(bg)} 
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.6,
          transform: `scale(${interpolate(frame, [0, 600], [1, 1.1])})` // Slow Ken Burns
        }}
        alt="background"
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 40%, rgba(0,0,0,0.8) 100%)`,
        }}
      />
      
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, ${colors.dark}${Math.floor(boardPulse * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        }}
      />
      
      {/* Confetti */}
      {isFinished && (
        <>
          <Confetti
            particleCount={200}
            startVelocity={60}
            spread={80}
            x={width * 0.2}
            y={height * 0.4}
            colors={[colors.dark, '#FFD700', '#ffffff']}
            gravity={0.4}
          />
          <Confetti
            particleCount={200}
            startVelocity={60}
            spread={80}
            x={width * 0.8}
            y={height * 0.4}
            colors={[colors.dark, '#FFD700', '#ffffff']}
            gravity={0.4}
          />
          
          <div style={{
            position: "absolute",
            bottom: 400,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            zIndex: 100,
            opacity: celebrationSpring,
            transform: `translateY(${(1 - celebrationSpring) * 100}px)`
          }}>
            <h2 style={{
              color: "white",
              fontSize: 100,
              fontWeight: 900,
              background: "rgba(0,0,0,0.85)",
              padding: "60px 120px",
              borderRadius: 60,
              boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 60px ${colors.dark}66`,
              border: "6px solid rgba(255,255,255,0.1)",
              textShadow: "0 10px 20px rgba(0,0,0,0.5)"
            }}>
              DID YOU FIND IT? SUBSCRIBE! 👇
            </h2>
          </div>
        </>
      )}

      {/* The Hook Overlay */}
      {phase === "HOOK" && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          background: `radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,1) 100%)`,
        }}>
           <h1 style={{
             color: "#FFD700",
             fontSize: 220,
             fontWeight: 900,
             textAlign: "center",
             padding: "0 100px",
             textTransform: "uppercase",
             lineHeight: 1.1,
             textShadow: "0 0 100px rgba(255,215,0,0.6)",
             transform: `scale(${interpolate(frame, [0, 60], [0.8, 1])})`
           }}>{hookText}</h1>
        </div>
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
          height: 600,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: 150,
          opacity: boardEntry,
        }}>
          {!isFinished && (
            <>
              <h2 style={{
                color: colors.dark,
                fontSize: 100,
                fontWeight: 900,
                letterSpacing: 12,
                textTransform: "uppercase",
                margin: 0,
                opacity: 0.9,
              }}>
                {sessionTitle} — MATE IN {mateCount}
              </h2>
              <h1 style={{
                color: "white",
                fontSize: 140,
                fontWeight: 900,
                textAlign: "center",
                margin: "40px 0 0 0",
                textShadow: "0 10px 40px rgba(0,0,0,0.8)",
              }}>
                {phase === "SOLUTION" ? "SOLUTION REVEALED" : 
                 phase === "PAUSE" ? "PAUSE AND FIND THE MATE!" : ""}
              </h1>
            </>
          )}
        </div>

        {/* Board Container */}
        <div style={{
          position: "relative",
          width: width * 0.9,
          transform: `scale(${boardScale})`,
          boxShadow: `0 100px 200px rgba(0,0,0,0.8), 0 0 100px ${colors.dark}44`,
          borderRadius: 48,
          overflow: "hidden",
          border: "12px solid rgba(255,255,255,0.08)",
        }}>
          <Chessboard
            position={currentFen}
            boardOrientation={playerColor}
            id="PremiumBoard4K"
            animationDuration={300}
            customDarkSquareStyle={{ backgroundColor: colors.dark }}
            customLightSquareStyle={{ backgroundColor: colors.light }}
            customArrows={lastMoveArrow ? [lastMoveArrow] : []}
            customSquareStyles={lastMoveSquareStyles}
          />
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: 200,
          height: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}>
          {!isFinished ? (
            <div style={{
              padding: "48px 120px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 200,
              border: "4px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(40px)",
              opacity: boardEntry,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
            }}>
              <span style={{
                color: "white",
                fontSize: 80,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 6,
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
                 padding: "60px 140px",
                 background: "rgba(255,215,0,0.15)",
                 borderRadius: 60,
                 border: `8px solid ${resultMetadata?.color || "#FFD700"}`,
                 backdropFilter: "blur(60px)",
                 boxShadow: `0 0 120px rgba(255,215,0,0.4)`,
               }}>
                 <span style={{
                   color: resultMetadata?.color || "white",
                   fontSize: 200,
                   fontWeight: 900,
                   letterSpacing: 20,
                   textTransform: "uppercase",
                 }}>
                   {resultMetadata?.text || "SOLVED"}
                 </span>
               </div>
            </div>
          )}
        </div>

      </div>

      {/* Progress Bar */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 32,
        backgroundColor: colors.dark,
        width: `${(frame / useVideoConfig().durationInFrames) * 100}%`,
        boxShadow: `0 0 60px ${colors.dark}`,
      }} />
      
    </AbsoluteFill>
  );
};

