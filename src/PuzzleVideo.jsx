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
  hookText = "BRILLIANT MATE IN 2!",
  eloRating = mateCount === 2 ? "1200-1400" : "1500-1700",
  formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Phase Definitions (at 30fps)
  const hookEnd = 60;  // 2s Hook (Header overlay phase)
  const pauseEnd = 180; // 4s Pause (Total 6s before moves)
  const moveInterval = 45; // 1.5s per move

  const { currentFen, phase, resultMetadata, solutionIndex, isCheck } = useMemo(() => {
    const game = new Chess(initialFen);
    let currentPhase = "HOOK";
    let solutionIndex = -1;
    let isCheck = false;

    // Phase 1: Hook Overlay (0-2s) - Board IS visible!
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

  // Animations - Start board entry immediately at Frame 0 so board is visible instantly
  const boardEntry = spring({
    frame: frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const celebrationSpring = spring({
    frame: frame - (pauseEnd + (puzzleMoves.length - 1) * moveInterval + 15),
    fps,
    config: { stiffness: 100, damping: 10 },
  });

  const boardScale = interpolate(boardEntry, [0, 1], [0.88, 1]);
  
  // Board Pulsing Glow (Viral tension)
  const boardPulse = phase === "PAUSE" ? interpolate(Math.sin(frame / 5), [-1, 1], [0.15, 0.45]) : 0;

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
          background: `linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 35%, rgba(0,0,0,0.85) 100%)`,
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
            bottom: 440,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 100,
            opacity: celebrationSpring,
            transform: `translateY(${(1 - celebrationSpring) * 100}px)`
          }}>
            <div style={{
              background: "rgba(0,0,0,0.9)",
              padding: "40px 80px",
              borderRadius: 50,
              boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 60px ${colors.dark}66`,
              border: "4px solid rgba(255,215,0,0.4)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20
            }}>
              <h2 style={{
                color: "#FFD700",
                fontSize: 80,
                fontWeight: 900,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: 4
              }}>
                DID YOU FIND IT IN UNDER 5s? 👇
              </h2>
              <span style={{
                color: "white",
                fontSize: 60,
                fontWeight: 700,
                opacity: 0.95
              }}>
                Comment your ELO rating & time! 🏆 Subscribe for daily puzzles!
              </span>
            </div>
          </div>
        </>
      )}

      {/* Main Content (Board is ALWAYS rendered instantly at Frame 0) */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        zIndex: 1,
      }}>
        
        {/* Header Section with Date Badge, ELO Difficulty Badge and Animated Hook */}
        <div style={{
          height: 650,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: 100,
          opacity: boardEntry,
        }}>
          {/* Header Badges Row */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 30,
            marginBottom: 30,
          }}>
            {/* Date Badge */}
            <div style={{
              padding: "20px 50px",
              background: "rgba(255, 255, 255, 0.12)",
              borderRadius: 100,
              backdropFilter: "blur(20px)",
              border: "2px solid rgba(255, 255, 255, 0.25)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
            }}>
              <span style={{
                color: "#FFD700",
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: 4,
                textTransform: "uppercase",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)"
              }}>
                📅 {formattedDate}
              </span>
            </div>

            {/* ELO Rating Badge */}
            <div style={{
              padding: "20px 50px",
              background: "linear-gradient(90deg, #ff416c, #ff4b2b)",
              borderRadius: 100,
              boxShadow: "0 10px 30px rgba(255, 65, 108, 0.5)",
              border: "2px solid rgba(255,255,255,0.3)"
            }}>
              <span style={{
                color: "white",
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: 4,
                textTransform: "uppercase",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)"
              }}>
                ⚡ ~{eloRating} ELO
              </span>
            </div>
          </div>

          {!isFinished && (
            <>
              <h2 style={{
                color: colors.dark,
                fontSize: 80,
                fontWeight: 900,
                letterSpacing: 10,
                textTransform: "uppercase",
                margin: 0,
                opacity: 0.9,
              }}>
                {sessionTitle} — MATE IN {mateCount}
              </h2>
              <h1 style={{
                color: phase === "HOOK" ? "#FFD700" : "white",
                fontSize: phase === "HOOK" ? 130 : 120,
                fontWeight: 900,
                textAlign: "center",
                margin: "30px 0 0 0",
                padding: "0 40px",
                textShadow: phase === "HOOK" ? "0 0 50px rgba(255,215,0,0.6)" : "0 10px 40px rgba(0,0,0,0.8)",
                transform: phase === "HOOK" ? `scale(${interpolate(frame, [0, 60], [0.95, 1.05])})` : "scale(1)",
                lineHeight: 1.1,
              }}>
                {phase === "HOOK" ? hookText :
                 phase === "PAUSE" ? "PAUSE & SOLVE THE MATE!" : 
                 "SOLUTION REVEALED"}
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
          marginTop: 180,
          height: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
        }}>
          {!isFinished ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20
            }}>
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
              {phase === "PAUSE" && (
                <span style={{
                  color: "#FFD700",
                  fontSize: 54,
                  fontWeight: 800,
                  letterSpacing: 4,
                  opacity: 0.9
                }}>
                  ⏱️ 4 SECONDS TO THINK
                </span>
              )}
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


