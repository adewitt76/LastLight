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
- [ ] NX monorepo setup
- [ ] Basic multiplayer server
- [ ] Simple Phaser 3 client
- [ ] Core task system

See [GAME_PLAN.md](./GAME_PLAN.md) for detailed roadmap.

## 🚀 Getting Started

*Setup instructions will be added as the project structure is established*

## 🎮 What Makes This Unique

Unlike traditional social deduction games, Last Light features:
- **Visual Decay**: Watch the ship deteriorate in real-time
- **Environmental Hazards**: Infected rooms affect gameplay directly
- **Entropy Pressure**: Global timer creates urgency for all players
- **Corruption Mechanics**: Spores and hallucinations blur reality

Built for game jams with rapid prototyping in mind while maintaining extensible architecture.
