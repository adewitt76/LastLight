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

*Commands will be added as the project structure is established*

## Game Development Priorities

1. **MVP Core:** Basic multiplayer lobby + simple task system
2. **Decay Mechanics:** Visual decay + entropy meter
3. **Role System:** Crewmate/Decayer gameplay
4. **Advanced Features:** Spores, hallucinations, complex sabotage

See [GAME_PLAN.md](./GAME_PLAN.md) for detailed development phases, milestones, and implementation order.

## Notes

- Game jam focus: prioritize core gameplay loop over polish
- Prototype-friendly: start with basic graphics, add visual flair later
- Emphasize the unique decay mechanics that differentiate from Among Us