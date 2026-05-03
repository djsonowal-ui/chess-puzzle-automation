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

  const { currentFen, phase, resultMetadata, solutionIndex } = useMemo(() => {
    const game = new Chess(initialFen);
    let currentPhase = "HOOK";
    let solutionIndex = -1;

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
          game.move({ from: m.substring(0, 2), to: m.substring(2, 4), promotion: "q" });
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

    return { currentFen: game.fen(), phase: currentPhase, resultMetadata, solutionIndex };
  }, [frame, initialFen, puzzleMoves, colors.dark]);

  const isFinished = !!resultMetadata;

  // Animations
  const boardEntry = spring({
    frame: frame - hookEnd,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const celebrationSpring = spring({
    frame: frame - (pauseEnd + (puzzleMoves.length - 1) * moveInterval + 15), // Starts right after last move finishes
    fps,
    config: { stiffness: 100, damping: 10 },
  });

  const boardScale = interpolate(boardEntry, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background Music - Moved to top for robustness */}
      <Audio
        key="bg-music"
        src={staticFile("lofi-music.mp3")}
        volume={0.4}
        startFrom={0}
      />

      {/* Dynamic Background Image */}
      <img 
        src={staticFile(bg)} 
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.6,
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
          background: `radial-gradient(circle at center, ${colors.dark}33 0%, transparent 70%)`,
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
          
          {/* Outro CTA */}
          <div style={{
            position: "absolute",
            bottom: 300,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            zIndex: 100,
            opacity: interpolate(frame, [pauseEnd + (puzzleMoves.length - 1) * moveInterval + 30, pauseEnd + (puzzleMoves.length - 1) * moveInterval + 45], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame, [pauseEnd + (puzzleMoves.length - 1) * moveInterval + 30, pauseEnd + (puzzleMoves.length - 1) * moveInterval + 45], [50, 0], { extrapolateRight: "clamp" })}px)`
          }}>
            <h2 style={{
              color: "white",
              fontSize: 70,
              fontWeight: 800,
              background: "rgba(0,0,0,0.8)",
              padding: "40px 80px",
              borderRadius: 40,
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              border: "4px solid rgba(255,255,255,0.2)"
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
             fontSize: 160,
             fontWeight: 900,
             textAlign: "center",
             padding: "0 100px",
             textTransform: "uppercase",
             lineHeight: 1.2,
             textShadow: "0 0 100px rgba(255,215,0,0.5)",
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
          opacity: interpolate(frame, [0, 30], [0, 1]),
        }}>
          {!isFinished && (
            <>
              <h2 style={{
                color: colors.dark,
                fontSize: 80,
                letterSpacing: 8,
                textTransform: "uppercase",
                margin: 0,
                opacity: 0.8,
              }}>
                {sessionTitle} — MATE IN {mateCount}
              </h2>
              <h1 style={{
                color: "white",
                fontSize: 120,
                fontWeight: 900,
                textAlign: "center",
                margin: "40px 0 0 0",
                textShadow: "0 0 50px rgba(255,255,255,0.3)",
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
          maxWidth: 1800,
          transform: `scale(${boardScale})`,
          boxShadow: `0 80px 160px rgba(0,0,0,0.7), 0 0 80px ${colors.dark}33`,
          borderRadius: 32,
          overflow: "hidden",
          border: "8px solid rgba(255,255,255,0.05)",
        }}>
          <Chessboard
            position={currentFen}
            boardOrientation={playerColor}
            id="PremiumBoard4K"
            animationDuration={400}
            customDarkSquareStyle={{ backgroundColor: colors.dark }}
            customLightSquareStyle={{ backgroundColor: colors.light }}
          />
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: 180,
          height: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}>
          {!isFinished ? (
            <div style={{
              padding: "32px 80px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 200,
              border: "2px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              opacity: boardEntry,
            }}>
              <span style={{
                color: "white",
                fontSize: 64,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 4,
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
                 padding: "40px 100px",
                 background: "rgba(255,215,0,0.1)",
                 borderRadius: 40,
                 border: `4px solid ${resultMetadata?.color || "#FFD700"}`,
                 backdropFilter: "blur(40px)",
                 boxShadow: `0 0 80px rgba(255,215,0,0.3)`,
               }}>
                 <span style={{
                   color: resultMetadata?.color || "white",
                   fontSize: 160,
                   fontWeight: 900,
                   letterSpacing: 16,
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
        height: 24,
        backgroundColor: colors.dark,
        width: `${(frame / useVideoConfig().durationInFrames) * 100}%`,
        boxShadow: `0 0 40px ${colors.dark}AA`,
      }} />
      
    </AbsoluteFill>
  );
};
