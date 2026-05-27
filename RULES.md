# Chess Automation: Viral Instantly Protocol

To ensure 100% virality and "scroll-stopping" quality for chess content, follow these high-performance rules.

## 1. Chess Puzzle Logic (The Challenge)
- **Initial FEN**: Must represent the critical position **before** the blunder.
- **Forced Mate**: Only use puzzles with forced checkmate sequences.
- **Complexity**: Prefer "Mate in 2" or "Mate in 3" for quick social media consumption.

## 2. Visual Excellence (The Aesthetic)
- **Resolution**: ALWAYS render at **4K Vertical (2160 x 3840)**.
- **Board Pulsing**: Use a subtle glow animation during the "thinking" phase to maintain visual interest.
- **Motion**: Apply a slow Ken Burns zoom to the background image.
- **Board Colors**: Rotate board colors using the `THEME_POOL` to keep the feed fresh.

## 3. Audio Engineering (The Retention)
- **Satisfying Sounds**: Use high-quality "Click" or "Thud" sounds for moves.
- **Check/Mate Sounds**: Use distinct, impactful sounds for checks and checkmates.
- **Tension Ticking**: Add an audible clock tick during the 4-second "thinking" phase.
- **Celebration**: Play a "Win" sound effect when the puzzle is solved.

## 4. Rendering Timeline
- **Hook Overlay**: 0s - 2s (Display "BRILLIANT MATE IN X" with intense glow).
- **Thinking Phase**: 2s - 6s (Board displayed with ticking sound and pulsing glow).
- **Solution Phase**: 6s - Finish (Moves animate with sounds).
- **Outro CTA**: Show "DID YOU FIND IT? SUBSCRIBE!" during the final celebration.

## 5. Metadata Strategy (SEO Hooks)
- **Titles**: Use "Hook-First" titles (e.g., "99% MISS THIS BRILLIANT MATE 🧠 #chess #shorts").
- **Description**: Include the FEN and full move sequence for searchability.

## 6. Automation & Persistence
- **State**: Mark puzzles as `used` immediately after successful validation.
- **Stock**: Maintain 45+ unused puzzles to ensure a 15-day buffer.
- **Run**: Automated 6:00 AM IST daily via GitHub Actions.

## 7. Execution
- **Preview**: `npm run dev`
- **Viral Render**: `node automate.mjs` (Generates 3x daily videos).

