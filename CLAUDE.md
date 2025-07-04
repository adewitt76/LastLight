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
- **Frontend:** Phaser 3.x game engine + HTML5 Canvas (with integrated lobby)
- **State Management:** Custom game state + Socket.io events
- **Database:** In-memory for sessions (Redis later for persistence)

## Project Structure (NX Monorepo)

```
apps/
  game-client/          # Phaser 3 frontend with integrated lobby
  game-server/          # Socket.io backend
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
npx nx serve game-client    # Phaser 3 game client (includes lobby)
npx nx serve game-server    # Socket.io backend server  

# Build applications
npx nx build game-client
npx nx build game-server
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

### Code Organization & Architecture
- **Shared Libraries:** Use for type definitions, networking interfaces, and shared utilities
- **Import Paths:** Use the full package names defined in package.json for cross-library imports
- **Event Definitions:** Keep all Socket.io events in `@lastlight/shared-networking` for consistency
- **Manager Pattern:** Large scenes should be broken down into specialized manager classes for maintainability
- **Interface-based Callbacks:** Use callback interfaces for loose coupling between managers and scenes
- **Single Responsibility:** Each manager should handle one specific aspect of game functionality

### TypeScript Configuration
- **Module System:** Use CommonJS (`"module": "commonjs"`) with ES module interop for Socket.io compatibility
- **Definite Assignment:** Use `!` assertion for properties initialized in lifecycle methods
- **Type Safety:** Add proper type checking for Phaser physics bodies and dynamic objects
- **Error Handling:** Address TypeScript errors systematically to prevent runtime issues

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

## Major Refactoring History

### Code Organization Improvements (Session January 2025)
**Problem:** Large monolithic files (400+ line main.ts, 889-line MainScene.ts) were difficult to maintain and debug.

**Solution:** Implemented manager-based architecture with separation of concerns:

#### Server-Side Refactoring (game-server/src/main.ts: 400 → 61 lines)
- **RoomManager:** Room creation, joining, leaving, and lifecycle management
- **GameManager:** Game state management, task validation, and win condition checking  
- **SocketHandlers:** Socket.io event handling and player communication

#### Client-Side Refactoring (game-client/src/game/scenes/MainScene.ts: 889 → 231 lines)
- **ShipLayoutManager:** Ship visual layout creation and background rendering
- **PlayerManager:** Player sprite creation, animations, and movement handling
- **TaskManager:** Task system management, interaction detection, and completion tracking
- **GameSocketManager:** Socket.io event handling and server communication
- **GameUI:** User interface creation, updates, and interaction handling
- **WallCollisionManager:** Physics collision system and maze wall management

#### Architecture Benefits
- **Maintainability:** Each manager has a single, clear responsibility
- **Testability:** Smaller, focused classes are easier to unit test
- **Reusability:** Managers can be used across different scenes
- **Debugging:** Easier to isolate and fix issues in specific systems
- **Collaboration:** Multiple developers can work on different managers simultaneously

#### TypeScript Error Resolution
- Fixed module import conflicts by configuring CommonJS with ES module interop
- Added proper type assertions for Phaser physics bodies
- Resolved undefined variable issues with nullish coalescing operators
- Implemented definite assignment assertions for lifecycle-initialized properties
- Updated Map iteration patterns for cross-browser compatibility

#### Project Structure Cleanup
- **Removed lobby-web:** Consolidated to single-client architecture with integrated lobby
- **Updated Documentation:** All references updated to reflect new architecture
- **Simplified Development:** Reduced from 3 to 2 applications (game-client + game-server)