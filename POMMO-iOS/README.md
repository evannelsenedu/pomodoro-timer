# POMMO iOS App

Native Swift/SwiftUI iOS version of the Pomodoro timer, ready for the Apple App Store.

## Quick Start

### Option A: XcodeGen (if installed)

```bash
brew install xcodegen   # if not installed
cd POMMO-iOS
xcodegen generate
open POMMO.xcodeproj
```

### Option B: Manual Xcode Setup

1. Open Xcode and create a new project:
   - **File → New → Project**
   - Choose **App** under iOS
   - Product Name: `POMMO`
   - Team: Your development team
   - Organization Identifier: e.g. `com.yourname`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Minimum Deployments: **iOS 15.0**
   - Save in the `POMMO-iOS` folder (or replace the generated files)

2. Replace the default files:
   - Delete the auto-generated `ContentView.swift` and `POMMOApp.swift` if Xcode created them
   - In the Project Navigator, right-click the `POMMO` group → **Add Files to "POMMO"...**
   - Select the entire `POMMO` folder (containing `POMMOApp.swift`, `ContentView.swift`, `Models/`, `Views/`, `Services/`, `Extensions/`, `Assets.xcassets`)
   - Ensure **Copy items if needed** is unchecked (files are already in place)
   - Ensure **Create groups** is selected
   - Ensure the POMMO target is checked

3. Verify the target includes:
   - All Swift files under `POMMO/`
   - `Assets.xcassets` (with `pommo-logo` image set)

4. Build and run (⌘R) on a simulator or device.

## Project Structure

```
POMMO-iOS/
├── POMMO/
│   ├── POMMOApp.swift           # App entry point
│   ├── ContentView.swift       # Root view, modals, overlays
│   ├── Models/
│   │   └── TimerState.swift    # Timer state, mode, persistence
│   ├── Views/
│   │   ├── MainTimerView.swift
│   │   ├── DurationPickerView.swift
│   │   ├── ModalView.swift
│   │   ├── ProgressCirclesView.swift
│   │   └── ConfettiView.swift
│   ├── Services/
│   │   ├── SoundService.swift
│   │   └── HistoryService.swift
│   ├── Extensions/
│   │   └── TimeFormatting.swift
│   └── Assets.xcassets/
│       └── pommo-logo.imageset
└── README.md
```

## App Store Checklist

Before submitting to the App Store:

1. **App Icons**
   - Add a 1024×1024 app icon in `Assets.xcassets/AppIcon.appiconset`
   - Xcode can generate required sizes from the 1024×1024 image

2. **Signing & Capabilities**
   - Select your Team in **Signing & Capabilities**
   - Enable **Automatically manage signing** or configure manual signing

3. **Info.plist**
   - No special permissions required (no network, camera, etc.)
   - App uses `UserDefaults` for local storage only

4. **Version & Build**
   - Set **Version** (e.g. 1.0) and **Build** (e.g. 1) in the target’s General tab

5. **Archive & Upload**
   - **Product → Archive**
   - **Distribute App → App Store Connect**

## Features

- Work sessions: 30, 45, 60, 75, or 90 minutes
- 10-minute breaks between work sessions
- 6-session progress circles
- Stats: today, week, year, all-time minutes
- Confetti on work session completion
- Sound feedback (start, pause, reset, etc.)
- “Do it for” quote selector (e.g. Lola)
- Duration picker on first launch and via “Change duration”

## Security & Privacy

- **No network access** — App works fully offline
- **Local storage only** — UserDefaults (`pomodoroHistory`, `pomodoroWorkDurationMinutes`, `pomodoroQuoteFor`)
- **No permissions** — No camera, microphone, location, or other sensitive APIs
- See [SECURITY.md](../SECURITY.md) for the full security policy

## Requirements

- Xcode 14+
- iOS 15.0+
- Swift 5.5+
