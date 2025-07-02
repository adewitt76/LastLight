# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Last Light** is a multiplayer social deduction game where players are crew members on a decaying deep-space colony ship. Players must complete tasks to stabilize the ship while "Decayers" (mutated crew) secretly sabotage systems and spread decay.

## Game Specification

### Core Mechanics
- **Tasks:** Repair power, decontaminate food, reroute oxygen to stabilize ship
- **Decay System:** Rooms visually decay (lighting fails, mold spreads, panels fall off)
- **Entropy Meter:** Global decay timer - if it fills, everyone dies
- **Infected Rooms:** Standing in decayed rooms causes vision blur, slower tasks, hallucinations
- **Spores:** Decayers plant spores to corrupt tasks or infect players
- **Emergency Meetings:** Players vote on suspected Decayers, but decay affects communication

### Victory Conditions
- **Crew:** Repair critical systems and jettison infected zones OR eject all Decayers
- **Decayers:** Max out decay meter, infect all players, OR kill enough crew

## Tech Stack

- **Monorepo:** NX workspace
- **Backend:** Node.js + Socket.io for real-time multiplayer
- **Frontend:** Phaser 3.x game engine + HTML5 Canvas
- **State Management:** Custom game state + Socket.io events
- **Database:** In-memory for sessions (Redis later for persistence)

## Project Structure (NX Monorepo)

```
apps/
  game-client/          # Phaser 3 frontend
  game-server/          # Socket.io backend
  lobby-web/            # Web lobby interface
libs/
  shared/
    game-engine/        # Core game logic
    models/             # Data models & types
    networking/         # Socket.io event definitions
    utils/              # Shared utilities
```

## Core Systems

### 1. Game State Management
- Player states (position, health, infection level, role)
- Room states (decay level, lighting, spore presence)
- Global entropy meter tracking
- Task system with decay effects

### 2. Multiplayer Architecture
- Room-based lobbies (4-10 players)
- Real-time position synchronization
- Task completion validation
- Voting/meeting system with decay interference

### 3. Decay System
- Progressive visual decay (lighting, textures, particle effects)
- Room infection spread mechanics
- Spore placement and propagation
- Entropy meter progression and triggers

### 4. Role System
- **Crewmate:** Complete repair/maintenance tasks
- **Decayer:** Sabotage systems, place spores, eliminate crew

## Development Commands

```bash
# Install dependencies
npm install

# IMPORTANT: After making changes to shared libraries, sync the workspace
npx nx sync

# Start applications
npx nx serve game-client    # Phaser 3 game client
npx nx serve game-server    # Socket.io backend server  
npx nx serve lobby-web      # Web lobby interface

# Build applications
npx nx build game-client
npx nx build game-server
npx nx build lobby-web
npx nx run-many -t build    # Build all

# Run tests
npx nx test game-client
npx nx run-many -t test     # Test all

# Lint and typecheck
npx nx run-many -t lint
npx nx run-many -t typecheck
```

## Game Development Priorities

1. **MVP Core:** Basic multiplayer lobby + simple task system
2. **Decay Mechanics:** Visual decay + entropy meter
3. **Role System:** Crewmate/Decayer gameplay
4. **Advanced Features:** Spores, hallucinations, complex sabotage

See [GAME_PLAN.md](./GAME_PLAN.md) for detailed development phases, milestones, and implementation order.

## Development Guidelines & Lessons Learned

### NX Workspace Management
- **Always run `npx nx sync`** after modifying shared library dependencies or imports
- Use proper package names for imports (e.g., `@lastlight/shared-models` not `@./shared/models`)
- The workspace will automatically sync TypeScript project references when needed

### Code Organization
- **Shared Libraries:** Use for type definitions, networking interfaces, and shared utilities
- **Import Paths:** Use the full package names defined in package.json for cross-library imports
- **Event Definitions:** Keep all Socket.io events in `@lastlight/shared-networking` for consistency

### Game Development Patterns
- **Scene Management:** Each major game state (Lobby, Main Game) should be a separate Phaser scene
- **Socket Handling:** Initialize socket connections in scenes and pass between scenes via init data
- **State Synchronization:** Server is authoritative; clients emit events and receive state updates
- **UI Feedback:** Always provide visual feedback for user actions (progress bars, error messages, etc.)

### Testing & Debugging
- **Minimum Players:** Set to 1 for testing (change `room.players.length < 1` in game-server)
- **Error Handling:** Implement client-side error messages for better UX
- **Room Management:** Auto-refresh room lists when players join/leave for real-time updates

### Task System Implementation
- **Task Areas:** Use Phaser zones for interaction detection
- **Visual Indicators:** Blinking indicators help players locate tasks
- **Progress Feedback:** Show task completion with animations for better game feel
- **State Management:** Update both local and server state for task completion

### Multiplayer Synchronization
- **Position Updates:** Server sends all existing player positions to new joiners
- **Game State Sync:** Late joiners receive current game state if game is in progress
- **Visual Updates:** Client graphics update in real-time with player movement
- **Room Cleanup:** Automatic room reset after game completion and proper player leave handling

### Map Design & Strategic Gameplay
- **Large Isolated Sections:** Power, Oxygen, and Communications areas are well separated for privacy
- **Central Hub:** Players spawn in center hub (2400, 1600) with corridors leading to different sections
- **Privacy for Tasks:** Cannot see other sections from any task location - good isolation for social deduction
- **Camera System:** Follows individual players with 0.75x zoom for optimal navigation
- **World Bounds:** 4800x3200 world size - 2x larger than original for good separation without being overwhelming
- **Travel Time:** Moderate time required to move between sections creates strategic decisions
- **Section Distances:** 
  - Power Core: (800, 600) - North-West
  - Life Support: (4000, 600) - North-East  
  - Communications: (2400, 2800) - South

## Notes

- Game jam focus: prioritize core gameplay loop over polish
- Prototype-friendly: start with basic graphics, add visual flair later
- Emphasize the unique decay mechanics that differentiate from Among Us
- **Phase 1 (MVP Core) is COMPLETE** - ready for Phase 2 (Decay System)