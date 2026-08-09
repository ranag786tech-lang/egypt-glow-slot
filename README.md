# egypt-glow-slot
Ancient Egypt Cascading Slot Game PWA.
# 𓂀 DIGI Gaming — Egypt's Glow Slot PWA 𓅃

An immersive, high-performance **5x5 Cascading Reel Slot Game** built with modern web technologies (**PixiJS**, **GSAP**, and **Web Audio API**). Inspired by top-tier casino slots, **Egypt's Glow** brings dynamic multipliers, wild expansions, custom particle celebrations, and full Progressive Web App (PWA) support.

> **Branding:** Presented by **DIGI / Digitaldairy786**

---

## ✨ Features & Game Mechanics

- 🎰 **5x5 Cascading Grid Engine:** Winning combinations explode and disappear, allowing new symbols to drop from above for infinite potential cascades in a single spin.
- ⚡ **Turbo Mode:** Toggle ultra-fast spin dynamics and symbol drop durations ($0.12\text{s}$ per reel drop).
- 🔄 **Auto-Spin Support:** Automated uninterrupted game loop for continuous play.
- ☀️ **Expanding Solar Orb Wilds:** Landing a Wild symbol triggers a full-column golden solar beam expansion across all 5 rows.
- 𓇳 **Free Spins Round:** Landing 3 or more Pyramid Scatters unlocks 8 Free Spins with accumulated multiplier bonuses.
- 🪙 **2D Canvas Physics Engine:** Real-time tumbling gold coin particle rain effect on Big Wins ($10\times+$) and Free Spins completion.
- 𓃥 **Egyptian Temple Intro:** High-tech **DIGI** splash screen paired with animated sliding temple doors transition.
- 🔊 **Synthesized Audio Engine:** Built-in Web Audio API sound generator providing dynamic ambient background motifs, spin loops, win chimes, and fanfare without external MP3 dependencies.

---

## 🛠️ Tech Stack & Dependencies

- **HTML5 / CSS3:** Custom responsive layout, CSS grid dynamics, and glowing Egyptian UI elements.
- **JavaScript (ES6+):** Pure object-oriented game logic and state management.
- **[PixiJS v7](https://pixijs.com/):** WebGL/Canvas high-performance 2D renderer for grid symbols and animations.
- **[GSAP 3](https://greensock.com/gsap/):** Smooth easing animations for reel drops, symbol scaling, and screen shakes.
- **Web Audio API:** Real-time procedural audio synthesis.

---

## 📱 PWA & Offline Installation

This game is fully configured as a **Progressive Web App (PWA)**. 

### Key Manifest Configuration:
- **Display:** `standalone` (Fullscreen, native-app feel with no browser bars).
- **Orientation:** `portrait`
- **Service Worker (`sw.js`):** Caches core assets locally for instant offline loading upon subsequent visits.

### How to Install on Mobile:
1. Open the hosted GitHub Pages link in **Google Chrome** (Android) or **Safari** (iOS).
2. Tap the browser menu (**⋮** / Share button).
3. Select **"Add to Home Screen"** or **"Install App"**.

---

## 📁 Repository Structure

```text
├── index.html        # Main application file (HTML5 + CSS + Game Logic)
├── manifest.json     # PWA Web App Manifest settings
├── sw.js             # Service Worker for offline asset caching
├── icon-192.png      # Mobile App Icon (192x192 px)
├── icon-512.png      # High-Res App Icon / Splash Image (512x512 px)
└── README.md         # Documentation
