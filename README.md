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
  game-client/          # Phaser 3 frontend with integrated lobby
  game-server/          # Socket.io multiplayer server
libs/
  shared/
    game-engine/        # Core game logic
    models/             # Data models & interfaces
    networking/         # Socket.io events
    utils/              # Shared utilities
```

## 🎯 Development Status

**Phase 1: MVP Core (COMPLETE ✅)**
- [x] NX monorepo setup with project.json configuration
- [x] Manager-based architecture implementation
- [x] Multiplayer server with room management
- [x] Phaser 3 client with integrated lobby
- [x] Core task system with interaction detection
- [x] Real-time player movement and synchronization
- [x] Ship layout with maze-like collision system
- [x] 8-directional player animations

**Current Focus:** Phase 2 - Decay System Implementation

**Recent Major Refactoring:**
- ✅ Modular manager architecture (RoomManager, GameManager, PlayerManager, etc.)
- ✅ Consolidated single-client architecture (removed separate lobby-web)
- ✅ TypeScript error resolution and DOM API support
- ✅ Proper NX project.json configuration
- ✅ Comprehensive documentation updates

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

Start applications:

```bash
# Start the game client (Phaser 3 frontend with integrated lobby)
npx nx serve game-client

# Start the game server (Socket.io backend)
npx nx serve game-server

# IMPORTANT: After making changes to shared libraries, sync the workspace
npx nx sync
```

Build applications:

```bash
# Build specific app
npx nx build game-client
npx nx build game-server

# Build all apps
npx nx run-many -t build
```

Run tests:

```bash
# Test specific project
npx nx test game-client

# Test all projects
npx nx run-many -t test

# Lint and typecheck
npx nx run-many -t lint
npx nx run-many -t typecheck
```

## 🏗 Architecture

### Manager-Based Design
The project uses a modular manager architecture for maintainability and separation of concerns:

**Server-Side Managers:**
- `RoomManager` - Room lifecycle and player management
- `GameManager` - Game state, task validation, win conditions
- `SocketHandlers` - Socket.io event handling

**Client-Side Managers:**
- `ShipLayoutManager` - Ship visual layout creation
- `PlayerManager` - Player sprites, animations, movement
- `TaskManager` - Task system and interaction detection
- `GameSocketManager` - Socket.io client communication
- `GameUI` - User interface management
- `WallCollisionManager` - Physics collision system

### Benefits
- **Maintainable**: Each manager has a single responsibility
- **Testable**: Smaller, focused classes are easier to unit test
- **Reusable**: Managers can be shared across different scenes
- **Debuggable**: Easier to isolate and fix issues
- **Collaborative**: Multiple developers can work on different systems

## 🎮 What Makes This Unique

Unlike traditional social deduction games, Last Light features:
- **Visual Decay**: Watch the ship deteriorate in real-time
- **Environmental Hazards**: Infected rooms affect gameplay directly
- **Entropy Pressure**: Global timer creates urgency for all players
- **Corruption Mechanics**: Spores and hallucinations blur reality

Built for game jams with rapid prototyping in mind while maintaining extensible architecture.
