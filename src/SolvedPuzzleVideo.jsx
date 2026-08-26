import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill, Audio, staticFile } from "remotion";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { loadFont } from "@remotion/google-fonts/Outfit";
import Confetti from "remotion-confetti";

const { fontFamily } = loadFont();

export const SolvedPuzzleVideo = ({
  puzzleTitle = "Solved Puzzles",
  initialFen = "r3r3/5qpk/ppR2B1p/3p3P/n2P4/P2P2Q1/5PP1/2R3K1 w - - 0 1",
  puzzleMoves = ["f6g7", "f7g7", "c6c7", "g7c7", "c1c7", "h7h8", "g3g7"],
  sanList = ["1. Bxg7", "1... Qxg7", "2. Rc7", "2... Qxc7", "3. Rxc7+", "3... Kh8", "4. Qg7#"],
  solutions = null, // Optional array of { title, puzzleMoves, sanList, evaluation } for multi-line puzzles
  evaluation = "#",
  sideToPlay = "White to Play",
  playerColor = "white",
  colors = { dark: "#769656", light: "#eeeed2" },
  bg = "morning_bg.png",
  clubTitle = "CHOWKIDINGHEE CHESS CLUB",
  authorName = "by RAJNISH VERMA"
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Normalize solutions list: fallback to single solution if solutions prop not provided
  const activeSolutions = useMemo(() => {
    if (solutions && Array.isArray(solutions) && solutions.length > 0) {
      return solutions;
    }
    return [
      {
        title: "Main Solution",
        puzzleMoves,
        sanList,
        evaluation
      }
    ];
  }, [solutions, puzzleMoves, sanList, evaluation]);

  // Phase & Timing Definitions (at 30fps)
  const startDelay = 300; // 10.0s initial pause for viewer to read position/prompt
  const moveInterval = 45; // 1.5s per half-move
  const rewindInterval = 30; // 1.0s rewind pause between solutions

  const secondsLeft = Math.max(1, Math.ceil((startDelay - frame) / fps));

  // Compute solution timeline ranges
  const solutionRanges = useMemo(() => {
    let currentStart = startDelay;
    return activeSolutions.map((sol) => {
      const movesCount = sol.puzzleMoves ? sol.puzzleMoves.length : 0;
      const duration = movesCount * moveInterval;
      const range = {
        title: sol.title || "Solution",
        puzzleMoves: sol.puzzleMoves || [],
        sanList: sol.sanList || [],
        evaluation: sol.evaluation || "#",
        startFrame: currentStart,
        endFrame: currentStart + duration,
      };
      currentStart = range.endFrame + rewindInterval;
      return range;
    });
  }, [activeSolutions, startDelay, moveInterval, rewindInterval]);

  const totalSolutionsEndFrame = solutionRanges[solutionRanges.length - 1].endFrame;

  // Determine current timeline state
  const { currentFen, activeSol, solutionIndex, isCheck, isFinished, isRewinding, nextSolTitle } = useMemo(() => {
    let currentFen = initialFen;
    let activeSol = null;
    let solutionIndex = -1;
    let isCheck = false;
    let isFinished = false;
    let isRewinding = false;
    let nextSolTitle = "";

    if (frame < startDelay) {
      // Phase 1: Thinking / Initial Position View
      return { currentFen: initialFen, activeSol: null, solutionIndex: -1, isCheck: false, isFinished: false, isRewinding: false, nextSolTitle: "" };
    }

    if (frame >= totalSolutionsEndFrame) {
      // Final Phase: All solutions finished
      const lastSol = solutionRanges[solutionRanges.length - 1];
      const game = new Chess(initialFen);
      lastSol.puzzleMoves.forEach((m) => {
        try {
          game.move({ from: m.substring(0, 2), to: m.substring(2, 4), promotion: m.substring(4, 5) || "q" });
        } catch (e) {}
      });
      return { currentFen: game.fen(), activeSol: lastSol, solutionIndex: lastSol.puzzleMoves.length - 1, isCheck: false, isFinished: true, isRewinding: false, nextSolTitle: "" };
    }

    // Check inside solution ranges or rewind gaps
    for (let i = 0; i < solutionRanges.length; i++) {
      const sol = solutionRanges[i];
      if (frame >= sol.startFrame && frame < sol.endFrame) {
        activeSol = sol;
        const subFrame = frame - sol.startFrame;
        solutionIndex = Math.floor(subFrame / moveInterval);
        const game = new Chess(initialFen);

        for (let mIdx = 0; mIdx <= solutionIndex && mIdx < sol.puzzleMoves.length; mIdx++) {
          try {
            const m = sol.puzzleMoves[mIdx];
            const res = game.move({ from: m.substring(0, 2), to: m.substring(2, 4), promotion: m.substring(4, 5) || "q" });
            if (mIdx === solutionIndex) {
              isCheck = res.flags.includes("c") || res.flags.includes("k");
            }
          } catch (e) {}
        }
        currentFen = game.fen();
        return { currentFen, activeSol, solutionIndex, isCheck, isFinished: false, isRewinding: false, nextSolTitle: "" };
      }

      // Check rewind gap between sol[i] and sol[i+1]
      if (i < solutionRanges.length - 1 && frame >= sol.endFrame && frame < solutionRanges[i + 1].startFrame) {
        isRewinding = true;
        nextSolTitle = solutionRanges[i + 1].title;
        return { currentFen: initialFen, activeSol: null, solutionIndex: -1, isCheck: false, isFinished: false, isRewinding: true, nextSolTitle };
      }
    }

    return { currentFen: initialFen, activeSol: null, solutionIndex: -1, isCheck: false, isFinished: false, isRewinding: false, nextSolTitle: "" };
  }, [frame, initialFen, solutionRanges, startDelay, totalSolutionsEndFrame, moveInterval]);

  // Spring animation for board scale entry
  const boardEntry = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const celebrationSpring = spring({
    frame: frame - (totalSolutionsEndFrame + 10),
    fps,
    config: { stiffness: 100, damping: 10 },
  });

  const boardScale = interpolate(boardEntry, [0, 1], [0.9, 1]);

  // Dynamic Highlight & Arrow Colors
  const arrowColor = "rgba(255, 215, 0, 0.85)"; // Gold Arrow

  // Compute move arrow [from, to, color]
  const moveArrow = useMemo(() => {
    if (!activeSol || solutionIndex < 0) return null;
    const m = activeSol.puzzleMoves[solutionIndex];
    if (!m || m.length < 4) return null;
    return [m.substring(0, 2), m.substring(2, 4), arrowColor];
  }, [activeSol, solutionIndex]);

  // Highlight squares for active move
  const moveSquareStyles = useMemo(() => {
    if (!activeSol || solutionIndex < 0) return {};
    const m = activeSol.puzzleMoves[solutionIndex];
    if (!m || m.length < 4) return {};

    const fromSquare = m.substring(0, 2);
    const toSquare = m.substring(2, 4);

    return {
      [fromSquare]: { backgroundColor: "rgba(255, 215, 0, 0.25)" },
      [toSquare]: { backgroundColor: "rgba(255, 215, 0, 0.35)" },
    };
  }, [activeSol, solutionIndex]);

  const currentMoveText = activeSol && solutionIndex >= 0 && solutionIndex < activeSol.sanList.length ? activeSol.sanList[solutionIndex] : "";
  const currentFullMoveNum = Math.floor(Math.max(0, solutionIndex) / 2) + 1;
  const totalFullMoves = activeSol ? Math.ceil(activeSol.puzzleMoves.length / 2) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080c14",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Background Audio */}
      <Audio key="bg-music" src={staticFile("lofi-music.mp3")} volume={0.15} loop />

      {/* Ticking Sound during initial prompt phase */}
      {frame < startDelay && frame % 30 === 0 && (
        <Audio src={staticFile("tick.mp3")} volume={0.2} />
      )}

      {/* Rewind Sound Effect */}
      {isRewinding && (frame - startDelay) % rewindInterval === 0 && (
        <Audio src={staticFile("tick.mp3")} volume={0.4} />
      )}

      {/* Move Sound Trigger */}
      {activeSol && solutionIndex >= 0 && (frame - activeSol.startFrame) % moveInterval === 0 && (
        <Audio src={staticFile(isCheck ? "check.mp3" : "move.mp3")} volume={0.4} />
      )}

      {/* Win / Solved Sound Effect */}
      {isFinished && frame === totalSolutionsEndFrame + 5 && (
        <Audio src={staticFile("win.mp3")} volume={0.7} />
      )}

      {/* Confetti Explosion on Puzzle Solved */}
      {isFinished && (
        <>
          <Confetti
            particleCount={180}
            startVelocity={55}
            spread={90}
            x={width * 0.25}
            y={height * 0.35}
            colors={[colors.dark, "#FFD700", "#FFFFFF", "#38BDF8"]}
            gravity={0.35}
          />
          <Confetti
            particleCount={180}
            startVelocity={55}
            spread={90}
            x={width * 0.75}
            y={height * 0.35}
            colors={[colors.dark, "#FFD700", "#FFFFFF", "#38BDF8"]}
            gravity={0.35}
          />
        </>
      )}

      {/* Background Image with subtle Ken Burns zoom */}
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

      {/* HEADER SECTION - Brand Identity */}
      <div
        style={{
          position: "absolute",
          top: 540,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 50,
          padding: "0 30px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            background: "rgba(10, 16, 28, 0.90)",
            backdropFilter: "blur(28px)",
            padding: "48px 80px",
            borderRadius: 44,
            border: "4px solid rgba(255, 215, 0, 0.6)",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.9), 0 0 60px rgba(255, 215, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            width: "94%"
          }}
        >
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: 104,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: "0 4px 30px rgba(255, 215, 0, 0.45)",
              lineHeight: 1.05
            }}
          >
            {clubTitle}
          </h1>

          <div
            style={{
              height: 5,
              width: 220,
              background: "linear-gradient(90deg, transparent, #FFD700, transparent)",
              borderRadius: 3
            }}
          />

          <p
            style={{
              color: "#FFD700",
              fontSize: 72,
              fontWeight: 900,
              margin: 0,
              letterSpacing: 8,
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
            boardOrientation={playerColor}
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

      {/* FOOTER SECTION - Solved Puzzle Info & Real-Time Move Tracker */}
      <div
        style={{
          position: "absolute",
          bottom: 520,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 50,
          padding: "0 40px",
          gap: 24
        }}
      >
        {/* Template Series Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.35), rgba(10, 16, 28, 0.95))",
            border: "4px solid #FFD700",
            padding: "26px 85px",
            borderRadius: 70,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.85)",
            textAlign: "center"
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 82,
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: "uppercase"
            }}
          >
            🧩 {puzzleTitle} {solutionRanges.length > 1 ? `(${solutionRanges.length} SOLUTIONS)` : ""}
          </span>
        </div>

        {/* Dynamic Status / Move Display */}
        {frame < startDelay ? (
          // Initial Prompt: Side to move
          <div
            style={{
              background: "rgba(15, 23, 42, 0.96)",
              border: "3px solid rgba(255, 215, 0, 0.5)",
              padding: "24px 60px",
              borderRadius: 40,
              display: "flex",
              alignItems: "center",
              gap: 24,
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)"
            }}
          >
            <span style={{ color: "#FFD700", fontSize: 64, fontWeight: 900, letterSpacing: 2 }}>
              ⚪ {sideToPlay} — FIND BOTH WINNING LINES! (⏱️ {secondsLeft}s)
            </span>
          </div>
        ) : isRewinding ? (
          // Rewind Transition between solution lines
          <div
            style={{
              background: "rgba(15, 23, 42, 0.96)",
              border: "3px solid #38BDF8",
              padding: "24px 60px",
              borderRadius: 40,
              display: "flex",
              alignItems: "center",
              gap: 24,
              boxShadow: "0 10px 40px rgba(56, 189, 248, 0.4)"
            }}
          >
            <span style={{ color: "#38BDF8", fontSize: 64, fontWeight: 900, letterSpacing: 2 }}>
              🔄 NEXT: {nextSolTitle || "Alternative Line"}
            </span>
          </div>
        ) : !isFinished ? (
          // Active Solution Step
          <div
            style={{
              background: "rgba(15, 23, 42, 0.96)",
              border: "3px solid rgba(255, 255, 255, 0.3)",
              padding: "24px 60px",
              borderRadius: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)"
            }}
          >
            {activeSol && (
              <span style={{ color: "#FFD700", fontSize: 52, fontWeight: 800, letterSpacing: 2 }}>
                🔹 {activeSol.title}
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{ color: "#94A3B8", fontSize: 58, fontWeight: 700 }}>
                Move {currentFullMoveNum} of {totalFullMoves}:
              </span>
              <span style={{ color: "#38BDF8", fontSize: 68, fontWeight: 900, letterSpacing: 2 }}>
                {currentMoveText}
              </span>
            </div>
          </div>
        ) : (
          // Solution Complete Banner
          <div
            style={{
              transform: `scale(${celebrationSpring})`,
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(10, 16, 28, 0.98))",
              border: "4px solid #10B981",
              padding: "30px 60px",
              borderRadius: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 20px 80px rgba(16, 185, 129, 0.4)",
              maxWidth: "92%",
              textAlign: "center"
            }}
          >
            <span style={{ color: "#10B981", fontSize: 72, fontWeight: 900, letterSpacing: 4 }}>
              🎉 ALL SOLUTIONS COMPLETE!
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {solutionRanges.map((sol, sIdx) => (
                <span key={sIdx} style={{ color: "#FFFFFF", fontSize: 52, fontWeight: 800, letterSpacing: 2 }}>
                  {sol.title}: {sol.sanList.join(" ")} ({sol.evaluation})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
