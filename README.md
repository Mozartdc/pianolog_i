Here’s an English README draft tailored for your Pianolog PWA project. It explains clearly what the app does, its features, tech stack, and how to set it up, instead of the default Vite boilerplate.

---

# Pianolog – Digital Piano Practice Log PWA

Pianolog is a Progressive Web App designed for digital piano players to track, analyze, and improve their practice sessions. It combines session logging, statistics, and motivation tools in a clean, mobile-friendly interface.

This project was created by members of the Digital Piano Gallery on DC Inside (디지털피아노 갤러리, 디시인사이드).
Community link: https://gall.dcinside.com/mgallery/board/lists/?id=digitalpiano

## Features

* **Practice Session Tracking** – Start, pause, resume, and complete practice timers.
* **Memo & Note Management** – Add notes or memos to any session for later review.
* **Statistics Dashboard** – View daily, weekly, and monthly stats with charts and calendars.
* **Metronome Tool** – Built-in metronome with customizable tempo.
* **Special Events** – Track and celebrate milestones with event badges and animations.
* **Profile Management** – Upload and update your practice profile image.
* **Offline-Ready PWA** – Installable on desktop or mobile, works offline with service worker caching.

## Tech Stack

* **Frontend**: React + TypeScript
* **Build Tool**: Vite
* **Routing**: React Router
* **State Management**: React Context API
* **PWA**: vite-plugin-pwa with Workbox
* **Styling**: CSS Modules & global variables
* **Animations**: Lottie JSON assets

## Project Structure

```
src/
  assets/          # Icons, images, Lottie animations
  components/      # Reusable UI components
  contexts/        # Global state (PracticeDataContext)
  screens/         # Main screens & modals
  styles/          # CSS variables, base, and layout styles
  utils/           # Utility functions
public/            # Static assets for PWA (icons, manifest)
```

## Installation

```bash
git clone https://github.com/Mozartdc/pianolog.git
cd pianolog
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## PWA Usage

1. Visit the deployed URL in Chrome, Edge, or Safari.
2. Use the “Install App” option from the browser menu.
3. Pianolog will work offline after the first load.

## License

MIT License – see the [LICENSE](LICENSE) file for details.

---

If you want, I can also add **badges** (e.g., PWA Ready, Made with Vite, React, etc.) and **screenshots** sections to make it look more professional on GitHub. That would make the README more engaging.
Do you want me to extend it with those visual elements?
