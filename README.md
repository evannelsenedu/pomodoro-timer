# POMMO – Pomodoro Timer

A Pomodoro timer available as a **web app** (PWA) and **native iOS app**. Focus sessions, 10-minute breaks, progress circles, and stats—all data stays on your device.

## Project Structure

```
pomodoro-timer/
├── index.html          # Web app entry
├── app.js              # Web timer logic
├── styles.css          # Web styling
├── manifest.json       # PWA manifest
├── pommo-logo.png      # Shared logo
├── README.md           # This file
├── SECURITY.md         # Security policy
└── POMMO-iOS/          # Native iOS app
    └── README.md       # iOS build instructions
```

## Web App

### Features

- **Work sessions:** 30, 45, 60, 75, or 90 minutes (configurable)
- **10-minute breaks** between work sessions
- **6-session progress circles** — visual cycle indicator
- **Stats:** Today, this week, this year, all-time (minutes)
- **Confetti** on work completion
- **Sound feedback** (start, pause, reset, etc.)
- **"Do it for" quote selector** (e.g. Lola)
- **Duration picker** on first run and via "Change duration"
- **Pause/Resume, Reset, Skip Break**

### Local Development

Open `index.html` in a browser, or serve the folder with a static file server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Then visit `http://localhost:8000`.

### Deploy to GitHub Pages

1. Create a repository (e.g. `pomodoro-timer`).
2. Push the project files with `index.html` at the root.
3. **Settings → Pages** → Deploy from branch `main`, folder `/ (root)`.
4. Site will be at `https://YOUR_USERNAME.github.io/pomodoro-timer/`.

### Security

- **Content-Security-Policy** restricts scripts, styles, and resources.
- **Subresource Integrity (SRI)** verifies the canvas-confetti CDN script.
- **localStorage** stores history and settings locally; no server or network data.
- See [SECURITY.md](SECURITY.md) for details.

## iOS App

See [POMMO-iOS/README.md](POMMO-iOS/README.md) for build instructions, XcodeGen setup, and App Store checklist.

## Usage

| Action | Description |
|--------|-------------|
| **Start** | Begin the countdown |
| **Pause** | Pause the timer (time preserved) |
| **Reset** | Reset current phase to full duration |
| **Skip Break** | Skip break and start next work session |
| **Reset time stats** | Clear all history |
| **Change duration** | Pick a new work session length |

## License

See repository for license information.
