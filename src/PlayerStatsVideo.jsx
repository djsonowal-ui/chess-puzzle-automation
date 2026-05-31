import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill, Audio, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Outfit";
import Confetti from "remotion-confetti";

const { fontFamily } = loadFont();

export const PlayerStatsVideo = ({
  name = "Magnus Carlsen",
  flag = "🇳🇴",
  achievements = [
    "🏆 5x Classical World Champion",
    "🎯 Highest FIDE rating in history: 2882",
    "🔥 Holds a 125-game unbeaten streak",
    "👑 Undisputed World Blitz & Rapid King"
  ],
  playstyle = {
    tactics: 96,
    endgame: 99,
    positional: 99,
    speed: 98
  },
  fideStats = {
    bYear: "1990",
    country: "Norway",
    flagCode: "no",
    title: "Grandmaster",
    ratings: {
      standard: 2841,
      rapid: 2832,
      blitz: 2869
    },
    photo: null
  }
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Phase Definitions (at 30fps)
  const clue1Start = 0;   // 0s: Hook + Flag & Country
  const clue2Start = 90;  // 3s: Playstyle attributes
  const clue3Start = 210; // 7s: FIDE standard, rapid, blitz ratings
  const clue4Start = 330; // 11s: Curated achievements
  const revealStart = 450; // 15s: Name + Photo reveal + Outro CTA (Total: 22s)

  // Spring animations for clues entering
  const entry1 = spring({ frame: frame - clue1Start, fps, config: { damping: 15 } });
  const entry2 = spring({ frame: frame - clue2Start, fps, config: { damping: 15 } });
  const entry3 = spring({ frame: frame - clue3Start, fps, config: { damping: 15 } });
  const entry4 = spring({ frame: frame - clue4Start, fps, config: { damping: 15 } });
  const revealProgress = spring({ frame: frame - revealStart, fps, config: { damping: 15 } });

  const isRevealed = frame >= revealStart;

  // Silhouette brightness and blur filter animation on reveal
  const brightness = interpolate(revealProgress, [0, 1], [0, 1]);
  const blur = interpolate(revealProgress, [0, 1], [20, 0]);
  const photoScale = interpolate(revealProgress, [0, 1], [0.9, 1]);
  const questionMarkOpacity = interpolate(revealProgress, [0, 1], [0.8, 0]);

  // General theme accent colors derived from federation
  const accentColor = "#FFD700"; // Elegant Gold
  const panelBg = "rgba(255, 255, 255, 0.08)";
  const panelBorder = "rgba(255, 255, 255, 0.12)";

  // Slow Ken Burns background scale
  const bgScale = interpolate(frame, [0, 660], [1, 1.12]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080710",
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Audio Engine */}
      <Audio key="lofi-bg" src={staticFile("lofi-music.mp3")} volume={0.14} loop />

      {/* Tension Clock Ticking during guessing phase */}
      {frame >= 0 && frame < revealStart && (frame % 30 === 0) && (
        <Audio src={staticFile("tick.mp3")} volume={0.18} />
      )}

      {/* Win Reveal Sound */}
      {frame === revealStart && (
        <Audio src={staticFile("win.mp3")} volume={0.5} />
      )}

      {/* Background Graphic Zoom */}
      <img
        src={staticFile("midnight_bg.png")}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.55,
          transform: `scale(${bgScale})`,
        }}
        alt="background"
      />

      {/* Premium Ambient Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)`,
        }}
      />

      {/* Celebration Confetti */}
      {isRevealed && (
        <>
          <Confetti
            particleCount={180}
            startVelocity={50}
            spread={90}
            x={width * 0.25}
            y={height * 0.4}
            colors={['#FFD700', '#ffffff', '#FF5733']}
            gravity={0.45}
          />
          <Confetti
            particleCount={180}
            startVelocity={50}
            spread={90}
            x={width * 0.75}
            y={height * 0.4}
            colors={['#FFD700', '#ffffff', '#FF5733']}
            gravity={0.45}
          />
        </>
      )}

      {/* Main Layout Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          padding: "160px 80px 1000px 80px",
          zIndex: 10,
        }}
      >
        {/* Header Block */}
        <div style={{ textAlign: "center", width: "100%" }}>
          <h2
            style={{
              color: accentColor,
              fontSize: 85,
              fontWeight: 900,
              letterSpacing: 10,
              textTransform: "uppercase",
              margin: 0,
              textShadow: `0 0 40px ${accentColor}88`,
            }}
          >
            {fideStats.title?.toLowerCase().includes("grandmaster") || fideStats.title === "GM" ? "GUESS THE CHESS GM!" : "GUESS THE CHESS IM!"}
          </h2>
          <h1
            style={{
              color: "white",
              fontSize: isRevealed ? 120 : 110,
              fontWeight: 900,
              margin: "30px 0 0 0",
              textShadow: "0 10px 40px rgba(0,0,0,0.9)",
              transition: "font-size 0.5s ease-in-out",
            }}
          >
            {isRevealed ? "GUESS THIS CHESS LEGEND! 👇" : "CAN YOU SOLVE THE CLUES?"}
          </h1>
        </div>

        {/* Dynamic Card & Stats Visualizer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            gap: 70,
          }}
        >
          {/* Main Character Showcase Panel */}
          <div
            style={{
              position: "relative",
              width: 1000,
              height: 1100,
              borderRadius: 48,
              overflow: "hidden",
              border: `12px solid ${isRevealed ? accentColor : "rgba(255,255,255,0.15)"}`,
              boxShadow: `0 80px 160px rgba(0,0,0,0.8), 0 0 80px ${isRevealed ? accentColor + '66' : 'transparent'}`,
              backgroundColor: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${photoScale})`,
              transition: "border-color 0.5s ease",
            }}
          >
            {/* The Photo Base64 Reveal */}
            {fideStats.photo ? (
              <img
                src={fideStats.photo}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: isRevealed ? `brightness(1) blur(0px)` : `brightness(0) blur(${blur}px)`,
                  opacity: isRevealed ? 1 : 0.9,
                  transition: "opacity 0.5s ease",
                }}
                alt="GM Profile"
              />
            ) : (
              // Silhouette Fallback SVG
              <svg
                viewBox="0 0 24 24"
                style={{
                  width: "70%",
                  height: "70%",
                  fill: isRevealed ? accentColor : "rgba(255,255,255,0.15)",
                  filter: isRevealed ? "none" : `brightness(0)`,
                }}
              >
                <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5zm0 10c-4.42 0-8 2.24-8 5v5h16v-5c0-2.76-3.58-5-8-5z" />
              </svg>
            )}

            {/* Silhouette Mystery Glowing Question Mark */}
            {!isRevealed && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 320,
                  fontWeight: 900,
                  color: accentColor,
                  textShadow: `0 0 100px ${accentColor}`,
                  opacity: questionMarkOpacity,
                }}
              >
                ?
              </div>
            )}
          </div>

          {/* Interactive Info Panels Container */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 40,
            }}
          >
            {/* Clue 1: Nationality & Identity */}
            {!isRevealed && frame >= clue1Start && (
              <div
                style={{
                  background: panelBg,
                  border: `4px solid ${panelBorder}`,
                  borderRadius: 40,
                  padding: "50px 80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backdropFilter: "blur(30px)",
                  transform: `translateY(${(1 - entry1) * 80}px)`,
                  opacity: entry1,
                  boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 75, fontWeight: 700 }}>
                  Clue 1: Federation & Age
                </span>
                <span style={{ color: "white", fontSize: 85, fontWeight: 900, display: "flex", alignItems: "center", gap: 30 }}>
                  <img src={`https://flagcdn.com/w160/${fideStats.flagCode || 'no'}.png`} style={{ width: 100, height: 65, borderRadius: 10, border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", objectFit: "cover" }} /> {fideStats.country} (Born: {fideStats.bYear})
                </span>
              </div>
            )}

            {/* Clue 2: Playstyle Attributes (Interactive Graph Bars) */}
            {!isRevealed && frame >= clue2Start && (
              <div
                style={{
                  background: panelBg,
                  border: `4px solid ${panelBorder}`,
                  borderRadius: 40,
                  padding: "50px 80px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 30,
                  backdropFilter: "blur(30px)",
                  transform: `translateY(${(1 - entry2) * 80}px)`,
                  opacity: entry2,
                  boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 75, fontWeight: 700 }}>
                    Clue 2: Playstyle Matrix
                  </span>
                  <span style={{ color: accentColor, fontSize: 75, fontWeight: 900 }}>
                    {fideStats.title}
                  </span>
                </div>
                
                {/* Tactical Strength */}
                <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                  <span style={{ color: "white", fontSize: 60, fontWeight: 800, width: 300 }}>Tactical:</span>
                  <div style={{ flex: 1, height: 35, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${playstyle.tactics}%`, background: `linear-gradient(90deg, ${accentColor} 0%, #FF8D1A 100%)` }} />
                  </div>
                  <span style={{ color: "white", fontSize: 60, fontWeight: 900, width: 120, textAlign: "right" }}>{playstyle.tactics}</span>
                </div>

                {/* Endgame Mastery */}
                <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
                  <span style={{ color: "white", fontSize: 60, fontWeight: 800, width: 300 }}>Endgame:</span>
                  <div style={{ flex: 1, height: 35, background: "rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${playstyle.endgame}%`, background: `linear-gradient(90deg, ${accentColor} 0%, #FF8D1A 100%)` }} />
                  </div>
                  <span style={{ color: "white", fontSize: 60, fontWeight: 900, width: 120, textAlign: "right" }}>{playstyle.endgame}</span>
                </div>
              </div>
            )}

            {/* Clue 3: Official FIDE Ratings */}
            {!isRevealed && frame >= clue3Start && (
              <div
                style={{
                  background: panelBg,
                  border: `4px solid ${panelBorder}`,
                  borderRadius: 40,
                  padding: "50px 80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backdropFilter: "blur(30px)",
                  transform: `translateY(${(1 - entry3) * 80}px)`,
                  opacity: entry3,
                  boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 75, fontWeight: 700 }}>
                  Clue 3: FIDE Ratings
                </span>
                <div style={{ display: "flex", gap: 50 }}>
                  {/* Classical standard */}
                  <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)", padding: "20px 40px", borderRadius: 20 }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 45, fontWeight: 700 }}>STD.</div>
                    <div style={{ color: "white", fontSize: 80, fontWeight: 900 }}>{fideStats.ratings.standard}</div>
                  </div>
                  {/* Rapid */}
                  <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)", padding: "20px 40px", borderRadius: 20 }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 45, fontWeight: 700 }}>RAPID</div>
                    <div style={{ color: "white", fontSize: 80, fontWeight: 900 }}>{fideStats.ratings.rapid}</div>
                  </div>
                  {/* Blitz */}
                  <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)", padding: "20px 40px", borderRadius: 20 }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 45, fontWeight: 700 }}>BLITZ</div>
                    <div style={{ color: "white", fontSize: 80, fontWeight: 900 }}>{fideStats.ratings.blitz}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Clue 4: Curated Career Highlights */}
            {!isRevealed && frame >= clue4Start && (
              <div
                style={{
                  background: panelBg,
                  border: `4px solid ${panelBorder}`,
                  borderRadius: 40,
                  padding: "50px 80px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 30,
                  backdropFilter: "blur(30px)",
                  transform: `translateY(${(1 - entry4) * 80}px)`,
                  opacity: entry4,
                  boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 75, fontWeight: 700 }}>
                  Clue 4: Legendary Achievements
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {achievements.slice(0, 2).map((achievement, idx) => (
                    <div
                      key={idx}
                      style={{
                        color: "white",
                        fontSize: 65,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: 30,
                      }}
                    >
                      {achievement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outro CTA Box: Displayed below photo when revealed */}
            {isRevealed && (
              <div
                style={{
                  background: "rgba(0,0,0,0.85)",
                  padding: "45px 90px",
                  borderRadius: 50,
                  boxShadow: `0 40px 80px rgba(0,0,0,0.9), 0 0 60px ${accentColor}66`,
                  border: `4px solid ${accentColor}`,
                  textAlign: "center",
                  opacity: revealProgress,
                  transform: `translateY(${(1 - revealProgress) * 100}px)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 25,
                  width: "100%",
                }}
              >
                <h2 style={{ color: accentColor, fontSize: 65, fontWeight: 900, margin: 0, letterSpacing: 4 }}>
                  💬 WHO IS THIS PLAYER?
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 15, textAlign: "left", paddingLeft: 30 }}>
                  {achievements.map((achievement, idx) => (
                    <div key={idx} style={{ color: "white", fontSize: 55, fontWeight: 800, display: "flex", alignItems: "center", gap: 20 }}>
                      {achievement}
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "4px dashed rgba(255,255,255,0.15)", marginTop: 10 }} />
                <p style={{ color: accentColor, fontSize: 60, fontWeight: 900, margin: "10px 0 0 0", letterSpacing: 2 }}>
                  WRITE HIS NAME IN THE COMMENTS!
                </p>
                <div style={{ fontSize: 75, display: "flex", justifyContent: "center", gap: 10 }}>
                  ✍️👇
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA / Outro Section */}
        <div style={{ height: 420, display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%" }}>
          {!isRevealed && (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 60, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>
              Answers revealed in {Math.max(0, Math.ceil((revealStart - frame) / 30))}s...
            </div>
          )}
        </div>
      </div>

      {/* Top Progress Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 32,
          backgroundColor: accentColor,
          width: `${(frame / useVideoConfig().durationInFrames) * 100}%`,
          boxShadow: `0 0 60px ${accentColor}`,
        }}
      />
    </AbsoluteFill>
  );
};
