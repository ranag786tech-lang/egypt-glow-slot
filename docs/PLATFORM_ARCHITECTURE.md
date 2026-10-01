# 🏛️ EGYPT GLOW SLOT PLATFORM — ARCHITECTURE & TECHNICAL SPECIFICATION

**Author:** Senior Product Director & Slot Platform Architect
**Version:** 2.0.0 (Platform Edition)
**Status:** Approved for Implementation

---

## 📑 TABLE OF CONTENTS
1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [Platform System Architecture](#2-platform-system-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema (Relational & NoSQL)](#4-database-schema-relational--nosql)
5. [API Specifications (REST & WebSockets)](#5-api-specifications-rest--websockets)
6. [Platform Features Deep Dive](#6-platform-features-deep-dive)
   - Player Wallet & Multi-Currency Engine
   - VIP Loyalty & Tier System
   - Achievement & Quest Engine
   - Reward Center & Promotions Engine
   - Weekly & Seasonal Live Ops Events
   - RTP & Math Configuration Manager
   - Feature Flag Engine
   - Localization (i18n) & Dynamic Themes
   - Backoffice Admin Panel & Analytics Dashboard
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. EXECUTIVE SUMMARY & VISION

The **Egypt Glow Slot Platform** transforms the standalone slot game into an enterprise-grade casino platform backend and frontend framework. Built for high scalability, regulatory compliance, dynamic RTP configuration, multi-jurisdiction operator integration, real-time player retention mechanics, and live operations management.

### Key Objectives
* **Modular Multi-Game Architecture:** Support modular game engines loading seamlessly inside a shared platform wrapper.
* **Real-Money & Social Casino Support:** Unified wallet engine supporting fiat, cryptocurrency, and virtual sweepstakes currencies.
* **Configurable Game Economy & RTP:** Real-time RTP adjustments (88% to 98%), volatility tuning, and dynamic feature triggers without code redeployment.
* **Live Ops & Gamification Engine:** Built-in VIP tiers, seasonal tournaments, weekly leaderboards, achievement trees, and personalized promotional bonusing.
* **Operator Backoffice & BI:** Real-time analytics, GGR/NGR dashboards, risk management, fraud detection, and player management tools.

---

## 2. PLATFORM SYSTEM ARCHITECTURE

```text
                                +---------------------------------------+
                                |      CLIENT LAYERS (HTML5 / PWA)      |
                                | Mobile iOS/Android, Desktop, Web View |
                                +-------------------+-------------------+
                                                    |
                                                    | HTTPS / WebSocket
                                                    v
+---------------------------------------------------------------------------------------------------+
|                                      API GATEWAY & LOAD BALANCER                                  |
|                              (NGINX / Cloudflare Gateway / OAuth2 + JWT)                         |
+-------------------+-------------------------------+-------------------------------+---------------+
                    |                               |                               |
                    v                               v                               v
+-------------------+-------+       +---------------+-------+       +---------------+-------+
|  GAME ENGINE SERVICE      |       |  PLAYER WALLET SERVICE|       | GAME CONFIG & RTP SERVICE|
|  - Slot Math Engine       |       |  - Balance Ledger     |       |  - Dynamic RTP Control |
|  - RNG Verification       |       |  - Transactions       |       |  - Paytable Overrides  |
|  - Cascade & Free Spins   |       |  - Bonus Wallets      |       |  - Volatility Tuning   |
+-------------------+-------+       +---------------+-------+       +---------------+-------+
                    |                               |                               |
                    v                               v                               v
+-------------------+-------+       +---------------+-------+       +---------------+-------+
| GAMIFICATION SERVICE      |       | PROMOTIONS ENGINE     |       | LIVE OPS & EVENTS     |
| - VIP Tiers & Progression |       | - Deposit Matches     |       | - Weekly Tournaments  |
| - Daily Missions & Quests |       | - Free Spins Drops    |       | - Seasonal Events     |
| - Achievement Engine      |       | - Cashback System     |       | - Leaderboards        |
+-------------------+-------+       +---------------+-------+       +---------------+-------+
                    |                               |                               |
                    +-------------------------------+-------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------+
|                                      PERSISTENCE & CACHING LAYER                                  |
|   +--------------------------+    +--------------------------+    +---------------------------+   |
|   | PostgreSQL (Primary DB)  |    |  Redis Cluster (Cache)   |    | ClickHouse / Firebase DB  |   |
|   | - Users, Wallet Ledger,  |    |  - Real-time Sessions,   |    | - Real-time Spin Events,  |   |
|   |   RTP Config, VIP Specs  |    |    Leaderboards, RNG     |    |   Analytics & Telemetry   |   |
|   +--------------------------+    +--------------------------+    +---------------------------+   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. FOLDER STRUCTURE

```text
egypt-glow-platform/
├── assets/                       # Audio, visual, and UI texture assets
├── css/
│   ├── platform.css              # Platform wrapper & backoffice theme styles
│   └── style.css                 # Game UI layout & mobile-first styling
├── js/
│   ├── platform/                 # PLATFORM CORE MODULES
│   │   ├── adminPanel.js         # Backoffice UI & Operator Controls
│   │   ├── analyticsDashboard.js # Real-time player BI & metrics visualizer
│   │   ├── configEngine.js       # Dynamic RTP, feature flags & math specs
│   │   ├── eventEngine.js        # Weekly tournaments & seasonal live ops
│   │   ├── i18nEngine.js         # Multi-language localization service
│   │   ├── promotionsEngine.js   # Bonus codes, deposit matches & free spins drops
│   │   ├── rewardCenter.js       # Daily reward wheel, quest hub & claim center
│   │   ├── themeEngine.js        # Dynamic theme switcher (Dark Egypt, Ruby Gold, Obsidian)
│   │   ├── vipEngine.js          # VIP Tier calculation, benefits & XP scale
│   │   └── walletEngine.js       # Multi-currency wallet ledger & transactions
│   ├── analytics.js              # Event telemetry dispatcher
│   ├── app.js                    # Core platform initialization & routing
│   ├── audio.js                  # Web Audio API sound synthesizer
│   ├── bonusEngine.js            # Mini-game bonus features
│   ├── engagement.js             # Quests, missions & achievements bridge
│   ├── pixiRenderer.js           # PixiJS WebGL graphics engine
│   ├── slotMath.js               # Slot RNG & cascading payout math
│   └── ui.js                     # Win celebrations & HUD controller
├── docs/
│   └── PLATFORM_ARCHITECTURE.md # Architecture specification & database schema
├── index.html                    # Unified platform & game launcher HTML
├── manifest.json                 # PWA configuration
├── sw.js                         # Service worker for offline asset caching
└── README.md                     # Overview & Quick Start
```

---

## 4. DATABASE SCHEMA (RELATIONAL & NOSQL)

### PostgreSQL Database Schema (Core Platform Ledger)

```sql
-- 1. USERS & PROFILES TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vip_level INT DEFAULT 1,
    vip_xp BIGINT DEFAULT 0,
    preferred_language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(30) DEFAULT 'egypt_gold',
    status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE, SUSPENDED, SELF_EXCLUDED
);

-- 2. WALLET LEDGER TABLE
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'GC', -- GC (Gold Coins), SC (Sweeps), USD, EUR, BTC
    real_balance NUMERIC(18, 4) NOT NULL DEFAULT 1000.00,
    bonus_balance NUMERIC(18, 4) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_currency UNIQUE(user_id, currency)
);

-- 3. GAME CONFIGURATION & RTP TABLE
CREATE TABLE game_configurations (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(50) NOT NULL UNIQUE,
    rtp_target NUMERIC(4,2) NOT NULL DEFAULT 96.50, -- e.g. 96.50%
    volatility_rating VARCHAR(20) DEFAULT 'HIGH', -- LOW, MEDIUM, HIGH, EXTREME
    max_multiplier INT DEFAULT 5000,
    free_spins_enabled BOOLEAN DEFAULT TRUE,
    pick_bonus_enabled BOOLEAN DEFAULT TRUE,
    ras_blessing_rate NUMERIC(4,3) DEFAULT 0.050,
    min_bet NUMERIC(18,2) DEFAULT 1.00,
    max_bet NUMERIC(18,2) DEFAULT 500.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS LEDGER (AUDIT TRAIL)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(30) NOT NULL, -- SPIN_BET, SPIN_WIN, BONUS_CLAIM, DEPOSIT, WITHDRAWAL
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    balance_after NUMERIC(18, 4) NOT NULL,
    reference_id VARCHAR(100), -- Spin ID or Promo ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ACHIEVEMENTS & PROGRESSION
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    achievement_id VARCHAR(50) NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

-- 6. PROMOTIONS & BONUS CAMPAIGNS
CREATE TABLE promotions (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    promo_code VARCHAR(30) UNIQUE,
    type VARCHAR(30) NOT NULL, -- DEPOSIT_MATCH, FREE_SPINS, CASHBACK, REWARD_DROP
    reward_amount NUMERIC(18,2) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Redis Key Structure (Real-time Operations & Caching)

* `session:{user_id}`: Active session token, websocket connection state.
* `leaderboard:weekly:{tournament_id}`: Sorted Set (`ZADD`) storing player scores for real-time tournament standings.
* `rtp:cache:{game_id}`: Hash containing active math weights and RTP settings.
* `wallet:cache:{user_id}`: Cached balance for ultra-low latency spin evaluation (< 10ms response time).

---

## 5. API SPECIFICATIONS (REST & WEBSOCKETS)

### REST endpoints

#### 1. Wallet API
* `GET /api/v1/wallet/balance` — Returns user's multi-currency balance.
* `POST /api/v1/wallet/transaction` — Processes bet, win, or deposit.

#### 2. VIP & Gamification API
* `GET /api/v1/vip/status` — Retrieves VIP level, current XP, and next tier requirements.
* `POST /api/v1/rewards/claim` — Claims daily login bonus or quest payout.

#### 3. Promotions & Events API
* `GET /api/v1/promotions/active` — Lists active promotions & deposit offers.
* `POST /api/v1/promotions/redeem` — Redeems promo code or accepts bonus drop.
* `GET /api/v1/events/leaderboard` — Retrieves live event standings.

#### 4. Backoffice Admin & Configuration API
* `GET /api/v1/admin/analytics/summary` — Returns GGR, NGR, RTP, spin volume, and active player counts.
* `POST /api/v1/admin/config/rtp` — Dynamically updates target RTP and hit frequencies.
* `POST /api/v1/admin/feature-flags` — Enables/disables game features in real time.

---

## 6. PLATFORM FEATURES DEEP DIVE

1. **Player Wallet & Multi-Currency Engine:** Handles Gold Coins (GC), Sweeps Coins (SC), or real money with bonus balance separation and full transaction history logging.
2. **VIP Loyalty & Tier System:** 6 Tiers (Neophyte, Bronze Scarab, Silver Ankh, Gold Pharaoh, Diamond Isis, Obsidian Ra) with escalating cashback, bet multipliers, and personal account perks.
3. **Reward Center & Missions:** Daily spin wheel, 3 daily rotating missions, and achievement milestone unlocks.
4. **Weekly & Seasonal Events:** Scheduled tournaments with real-time leaderboard aggregation and automated payout drops.
5. **RTP Configuration & Feature Engine:** Allows operators to tune RTP from 88% to 98% with dynamic paytable weight scaling.
6. **Localization & Theme Engine:** Multi-language support (English, Spanish, German, Japanese, Egyptian Arabic) and customizable dynamic visual themes.
7. **Backoffice Admin Panel:** Interactive dashboard for monitoring real-time game telemetry, overriding feature flags, and managing players.

---

## 7. IMPLEMENTATION ROADMAP

```text
Phase 1: Architecture & Platform Core Infrastructure (Completed)
  [x] Design slot platform architecture, schemas & API specifications.
  [x] Create platform wrapper file structure and UI modular containers.

Phase 2: Platform Engine Implementation (Completed)
  [x] Wallet Engine & Multi-currency balance ledger.
  [x] VIP Loyalty Engine & XP progression.
  [x] Reward Center & Daily Missions.
  [x] Promotions Engine & Bonus Codes.
  [x] Weekly & Seasonal Events System.
  [x] Config Engine & Dynamic RTP Manager.
  [x] Localization (i18n) & Theme Engine.

Phase 3: Admin Backoffice & Analytics Visualizer (Completed)
  [x] Backoffice Admin Control Panel.
  [x] Real-time Analytics Dashboard (GGR, RTP, Volume, Active Players).

Phase 4: Verification & Delivery (In Progress)
  [x] Integrated pre-commit checks, verification, and code review.
  [x] Final submission & deployment package.
```
