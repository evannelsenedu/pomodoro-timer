# Security Policy

## Overview

POMMO (web and iOS) is designed to keep all user data on the device. There is no backend, no authentication, and no network data collection.

## Web App Security

### Content Security Policy (CSP)

The web app uses a strict Content-Security-Policy meta tag:

- **default-src 'self'** — Only load resources from the same origin by default
- **script-src 'self' https://cdn.jsdelivr.net** — Scripts from app and canvas-confetti CDN only
- **style-src 'self' 'unsafe-inline'** — Styles (inline needed for dynamic progress)
- **img-src 'self' data:** — Images from app and data URIs
- **base-uri 'self'** — Prevents base tag injection
- **form-action 'self'** — Forms submit only to same origin
- **frame-ancestors 'none'** — Prevents embedding in iframes (clickjacking)

### Subresource Integrity (SRI)

The canvas-confetti script from jsDelivr CDN is loaded with an `integrity` attribute (SHA-384). If the CDN is compromised or the file is altered, the browser will refuse to execute it.

### Data Storage

- **localStorage keys:** `pomodoroHistory`, `pomodoroWorkDurationMinutes`, `pomodoroQuoteFor`
- Data is plain JSON; no encryption (stats only, no sensitive data)
- Quote selector uses a whitelist (`''`, `'Lola'`) when persisting to prevent XSS via tampered localStorage

### No Network Requests

Except for loading the canvas-confetti script from jsDelivr (with SRI), the web app makes no network requests. No analytics, no tracking, no external APIs.

## iOS App Security

### Data Storage

- **UserDefaults keys:** `pomodoroHistory`, `pomodoroWorkDurationMinutes`, `pomodoroQuoteFor`
- All data is stored in the app sandbox; no Keychain (no credentials)
- No network access; app works fully offline

### Permissions

The iOS app does not request camera, microphone, location, or other sensitive permissions. No special Info.plist entries are required.

### App Transport Security

No network calls are made; ATS is not a factor.

## Reporting a Vulnerability

If you discover a security issue, please report it responsibly. Include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge receipt and work on a fix as appropriate.
