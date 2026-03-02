# Pomodoro Timer

A web-based Pomodoro timer with 60-minute work sessions, 10-minute short breaks, and 30-minute long breaks after every 4 sessions. Session count is persisted in the browser.

## Features

- **60-minute work sessions** — Focus for a full hour
- **10-minute short breaks** — After sessions 1–3
- **30-minute long break** — After the 4th session
- **Pause/Resume** — Pause and resume both work and break timers
- **Session tracking** — Total completed sessions stored in localStorage
- **Phase-based styling** — Visual cues for work vs break phases

## Local Development

Open `index.html` in a browser, or serve the folder with any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g., `pomodoro-timer`).

2. Push the project files. Ensure `index.html` is at the repository root:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/pomodoro-timer.git
   git push -u origin main
   ```

3. In the repository, go to **Settings → Pages**.

4. Under "Build and deployment", choose **Deploy from a branch**.

5. Select the `main` branch and `/ (root)` folder.

6. Click **Save**. The site will be live at:

   `https://YOUR_USERNAME.github.io/pomodoro-timer/`

## Usage

- **Start** — Begin the countdown
- **Pause** — Pause the timer (time is preserved)
- **Reset** — Reset the current phase to its full duration
- **Reset session count** — Clear the total completed sessions
