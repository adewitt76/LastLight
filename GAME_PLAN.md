# Last Light - Development Plan

## Phase 1: Foundation (MVP Core)
**Goal:** Basic multiplayer functionality with simple task system

### Core Features
- [x] NX monorepo setup with basic apps/libs structure
- [x] Basic NX workspace configuration with applications and libraries
- [x] Socket.io server with room management (4-10 players)
- [ ] Basic Phaser 3 client with player movement
- [ ] Simple lobby system (join/leave rooms)
- [ ] Basic task system (3-4 simple tasks: power, oxygen, communications)
- [ ] Win condition: complete all tasks

### Current Status
**COMPLETED:**
- NX monorepo workspace setup
- Basic project structure with apps (game-client, game-server, lobby-web)
- Shared libraries structure (game-engine, models, networking, utils)
- Socket.io server with comprehensive room management
- TypeScript data models and networking interfaces
- Server health monitoring and error handling

**NEXT STEP:** Implement basic Phaser 3 client with player movement

### Data Models
```typescript
interface Player {
  id: string;
  name: string;
  position: { x: number; y: number };
  role: 'crewmate' | 'decayer';
  isAlive: boolean;
  infectionLevel: number; // 0-100
}

interface Room {
  id: string;
  decayLevel: number; // 0-100
  lighting: number; // 0-100 (100 = full light)
  hasSpores: boolean;
  isAccessible: boolean;
}

interface GameState {
  players: Player[];
  rooms: Room[];
  entropyMeter: number; // 0-100 (100 = game over)
  phase: 'lobby' | 'playing' | 'meeting' | 'voting' | 'ended';
  tasks: Task[];
}
```

## Phase 2: Decay Mechanics
**Goal:** Implement the unique decay system

### Features
- [ ] Visual decay system (lighting dimming, texture changes)
- [ ] Entropy meter with automatic progression
- [ ] Room infection spread mechanics
- [ ] Infected room effects (vision blur, slower movement)
- [ ] Basic repair tasks to counter decay

### Visual Effects
- Progressive lighting reduction
- Particle systems for mold/decay
- UI elements for entropy meter
- Visual indicators for infected rooms

## Phase 3: Role System & Sabotage
**Goal:** Implement Crewmate vs Decayer gameplay

### Features
- [ ] Role assignment (1-2 Decayers based on player count)
- [ ] Decayer abilities:
  - Sabotage tasks/systems
  - Accelerate room decay
  - Place spores
- [ ] Emergency meeting system
- [ ] Voting mechanics
- [ ] Victory conditions for both sides

## Phase 4: Advanced Decay Features
**Goal:** Spores, hallucinations, and complex interactions

### Features
- [ ] Spore placement and propagation system
- [ ] Player infection mechanics
- [ ] Hallucination effects:
  - False task indicators
  - Fake player positions
  - Corrupted UI elements
- [ ] Advanced sabotage options
- [ ] Communication interference during meetings

## Phase 5: Polish & Balance
**Goal:** Game feel and balancing

### Features
- [ ] Improved graphics and animations
- [ ] Sound effects and ambient audio
- [ ] Balancing entropy progression
- [ ] Task difficulty tuning
- [ ] Performance optimization
- [ ] Mobile-friendly controls

## Technical Implementation Order

### Backend (game-server)
1. Basic Socket.io server with room management
2. Game state management and synchronization
3. Task validation system
4. Voting and meeting mechanics
5. Decay progression logic

### Frontend (game-client)
1. Phaser 3 setup with basic scenes
2. Player movement and networking
3. Task interaction system
4. UI for entropy meter, tasks, voting
5. Visual effects for decay

### Shared Libraries
1. Data models and interfaces
2. Game logic utilities
3. Socket.io event definitions
4. Validation functions

## Development Milestones

**Week 1:** Foundation setup, basic multiplayer
**Week 2:** Core task system, basic decay visuals
**Week 3:** Role system, sabotage mechanics
**Week 4:** Advanced features, polish

## Risk Mitigation

- **Scope Creep:** Focus on core gameplay loop first
- **Networking Complexity:** Start with simple state sync, optimize later
- **Visual Polish:** Use placeholder graphics initially
- **Performance:** Profile early, especially decay visual effects

## Success Metrics

- 4-10 players can join a game and complete basic tasks
- Decay system creates visible progression and tension
- Decayers can meaningfully impact the game
- Games complete within 10-15 minutes
- Core gameplay loop is engaging and unique from Among Us