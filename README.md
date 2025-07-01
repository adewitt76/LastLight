# Last Light

A multiplayer social deduction game where players are crew members aboard a decaying deep-space colony ship. Work together to complete critical repairs while "Decayers" secretly sabotage systems and spread entropy throughout the ship.

## 🚀 Game Overview

You're part of a failing colony ship's crew with critical systems breaking down. Complete tasks to stabilize the ship before the **Entropy Meter** maxes out and destroys everyone. But beware - some crew members have mutated into **Decayers** who accelerate decay and eliminate the crew.

### Core Mechanics
- **Tasks**: Repair power systems, decontaminate food supplies, reroute oxygen
- **Decay System**: Rooms visually deteriorate - lighting fails, mold spreads, panels fall off
- **Entropy Meter**: Global countdown to ship destruction
- **Infected Rooms**: Staying too long causes vision blur, slower tasks, hallucinations
- **Spores**: Decayers plant spores to corrupt tasks and infect players
- **Emergency Meetings**: Vote out suspected Decayers, but decay affects communication

### Victory Conditions
- **Crew Wins**: Repair critical systems and jettison infected zones OR eliminate all Decayers
- **Decayers Win**: Max out the entropy meter, infect all players, OR kill enough crew

## 🛠 Tech Stack

- **NX Monorepo** - Project management and build system
- **Node.js + Socket.io** - Real-time multiplayer backend
- **Phaser 3** - Game engine and client rendering
- **TypeScript** - Shared data models and type safety

## 📁 Project Structure

```
apps/
  game-client/          # Phaser 3 frontend game
  game-server/          # Socket.io multiplayer server
  lobby-web/            # Web-based lobby interface
libs/
  shared/
    game-engine/        # Core game logic
    models/             # Data models & interfaces
    networking/         # Socket.io events
    utils/              # Shared utilities
```

## 🎯 Development Status

**Phase 1: Foundation (In Progress)**
- [x] NX monorepo setup
- [x] Basic multiplayer server
- [ ] Simple Phaser 3 client
- [ ] Core task system

**Current Focus:** Basic Phaser 3 client implementation

**Recent Milestones:**
- ✅ Socket.io server with room management (4-10 players)
- ✅ TypeScript data models and networking interfaces
- ✅ Health monitoring and error handling

See [GAME_PLAN.md](./GAME_PLAN.md) for detailed roadmap.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone git@github.com:adewitt76/LastLight.git
cd LastLight

# Install dependencies
npm install
```

### Development

Start individual applications:

```bash
# Start the game client (Phaser 3 frontend)
npx nx serve game-client

# Start the game server (Socket.io backend)
npx nx serve game-server

# Start the lobby web interface
npx nx serve lobby-web
```

Build applications:

```bash
# Build specific app
npx nx build game-client
npx nx build game-server
npx nx build lobby-web

# Build all apps
npx nx run-many -t build
```

Run tests:

```bash
# Test specific project
npx nx test game-client

# Test all projects
npx nx run-many -t test
```

## 🎮 What Makes This Unique

Unlike traditional social deduction games, Last Light features:
- **Visual Decay**: Watch the ship deteriorate in real-time
- **Environmental Hazards**: Infected rooms affect gameplay directly
- **Entropy Pressure**: Global timer creates urgency for all players
- **Corruption Mechanics**: Spores and hallucinations blur reality

Built for game jams with rapid prototyping in mind while maintaining extensible architecture.
