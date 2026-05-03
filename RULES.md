# Chess Automation: Best Practices & Rules

To ensure the stability and quality of the automated chess puzzle system, follow these rules and guidelines.

## 1. Chess Puzzle Logic
- **Initial FEN**: The `initialFen` represents the board position **before** the opponent makes their mistake.
- **Move Sequence**: 
  - `puzzleMoves[0]` is always the **opponent's move**. It must be applied first before showing the puzzle to the user.
  - `puzzleMoves[1+]` are the **solution moves** to be animated after the thinking phase.
- **Format**: All moves must be in **UCI format** (e.g., `e2e4`, `d7d5`).
- **Promotions**: Always include a promotion character (`q`) as a fallback for pawn promotion moves (e.g., `a7a8q`).

## 2. Move Validation & Deduplication
- **Legality Check**: Load the `initialFen` into `chess.js` and apply every move in `puzzleMoves` sequentially.
- **FEN-based Deduplication**: NEVER add a puzzle to the database if its board position (`initialFen`) has already been used. This prevents repetition even if IDs are different.
- **Immediate Persistence**: Mark a puzzle as `used` **immediately after successful validation**, before rendering begins. This prevents repetition if the render/upload fails mid-process.

## 3. Video Rendering Rules (YouTube Shorts)
- **Resolution**: Always render at **4K vertical resolution** (2160 x 3840).
- **Framerate**: Always render at **30 fps**.
- **Audio**: Always include `audioCodec: "aac"` and move the `Audio` component to the top of the React tree to ensure it initializes correctly.
- **Background Assets**: Use the custom background images (`morning_bg.png`, `afternoon_bg.png`, `evening_bg.png`, `midnight_bg.png`) corresponding to the theme.
- **Timeline**: The initial board position (after the opponent's mistake) MUST be displayed for exactly **4 seconds** before the solution moves begin animating.

## 4. Automation & Scheduling
- **Run Schedule**: The automation runs once daily at **6:00 AM IST** (00:30 UTC).
- **Triple Upload**: A single run generates and uploads all 3 videos for the day.
- **YouTube Scheduling**: Videos must be scheduled for:
  - **Morning**: 9:00 AM IST
  - **Afternoon**: 2:00 PM IST
  - **Evening**: 7:00 PM IST
- **Visibility**: Set videos to `private` during scheduling; they will automatically flip to `public` at the scheduled time.

## 5. Theme Variety (Dynamic Theme Engine)
- **Variations**: Do not use the same title or colors every day. Use the `THEME_POOL` in `automate.mjs` to rotate titles and board colors.
- **Metadata**: Titles and descriptions must include unique hooks (e.g., "INSANE", "BRILLIANT") and relevant hashtags.

## 6. Stock & Database Management
- **Target Buffer**: Maintain at least **15 unused puzzles** per session slot (45 total).
- **ID Uniqueness**: Prefix external IDs (e.g., `polgar_123`) to avoid collisions.
- **Replenishment**: Run `node replenish.mjs` daily to maintain stock health.

## 7. GitHub Actions
- **Permissions**: The workflow must have `contents: write` permissions to commit `puzzles.json` changes back to the repository.
- **Persistence**: Ensure `puzzles.json` is committed and pushed after every successful run.

## 8. Debugging Tools
- Use `scratch/verify_puzzles.mjs` to scan the database for invalid sequences.
- Use `node automate.mjs --dry-run` to test selection and metadata generation without spending resources.
