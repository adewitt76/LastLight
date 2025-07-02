# Last Light - Development Plan

## Phase 1: Foundation (MVP Core)
**Goal:** Basic multiplayer functionality with simple task system

### Core Features
- [x] NX monorepo setup with basic apps/libs structure
- [x] Basic NX workspace configuration with applications and libraries
- [x] Socket.io server with room management (4-10 players)
- [x] Basic Phaser 3 client with player movement
- [x] Enhanced lobby system (room browsing, proper join functionality)
- [x] Basic task system (3-4 simple tasks: power, oxygen, communications)
- [x] Win condition: complete all tasks

### Current Status
**COMPLETED:**
- NX monorepo workspace setup
- Basic project structure with apps (game-client, game-server, lobby-web)
- Shared libraries structure (game-engine, models, networking, utils)
- Socket.io server with comprehensive room management
- TypeScript data models and networking interfaces
- Server health monitoring and error handling
- Phaser 3 client with working multiplayer foundation
- Player movement and position synchronization
- Basic ship layout with room visualization
- Room creation and basic multiplayer connectivity
- Enhanced lobby system with room browsing and selection
- Basic task system with power, oxygen, and communications tasks
- Task completion mechanics with progress animations
- Win condition implementation (complete all tasks)
- Game end screen and return to lobby functionality

**CURRENT STATUS:** Phase 1 (MVP Core) is now COMPLETE! ✅

### Phase 1 Achievements Summary
- ✅ **Enhanced Lobby System**: Real-time room browsing, selection, join/leave with comprehensive error handling
- ✅ **Large Strategic Map**: 4800x3200 world with isolated task sections for proper social deduction gameplay
- ✅ **Task System**: Power, Oxygen, Communications tasks with visual indicators, progress animations, and completion mechanics
- ✅ **Multiplayer Foundation**: Robust Socket.io integration with position sync, player management, and room state handling
- ✅ **Win Conditions**: Game completion detection and seamless return to lobby
- ✅ **UI System**: Camera-fixed interface elements that work with player following camera
- ✅ **Map Design**: Strategic isolation between task areas (Power Core, Life Support, Communications) prevents visual reconnaissance

### Technical Achievements
- **NX Workspace Sync**: Resolved shared library import issues with proper package references
- **Real-time Updates**: Position synchronization works immediately without requiring game start
- **Room Management**: Automatic cleanup, host transfer, and proper state reset after games
- **Error Handling**: Comprehensive client-side error messages and server validation
- **Camera System**: Player-following camera with proper UI positioning using `setScrollFactor(0)`

**NEXT STEP:** Begin Phase 2 - Implement the unique decay system and visual effects

### Phase 2 Planning Notes
Based on Phase 1 learnings, Phase 2 should focus on:
1. **Room Decay Visual System**: Progressive lighting and texture changes in task areas
2. **Entropy Meter**: Global decay progression with visual representation
3. **Infected Room Effects**: Vision impairment and movement penalties
4. **Decay Spread Mechanics**: Room-to-room infection propagation logic

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

### Backend (game-server) ✅ Phase 1 Complete
1. ✅ Basic Socket.io server with room management
2. ✅ Game state management and synchronization
3. ✅ Task validation system
4. [ ] Voting and meeting mechanics (Phase 3)
5. [ ] Decay progression logic (Phase 2)

### Frontend (game-client) ✅ Phase 1 Complete
1. ✅ Phaser 3 setup with basic scenes (Lobby + Main)
2. ✅ Player movement and networking
3. ✅ Task interaction system
4. ✅ UI for tasks, game state, room management
5. [ ] Visual effects for decay (Phase 2)
6. [ ] UI for entropy meter, voting (Phase 2-3)

### Shared Libraries ✅ Phase 1 Complete
1. ✅ Data models and interfaces
2. ✅ Game logic utilities
3. ✅ Socket.io event definitions
4. ✅ Validation functions

## Development Milestones

**✅ Phase 1 (Complete):** Foundation setup, enhanced lobby, comprehensive task system, large strategic map
**Phase 2 (Next):** Core decay system, entropy meter, visual effects
**Phase 3:** Role system (Crewmate vs Decayer), sabotage mechanics, voting
**Phase 4:** Advanced decay features (spores, hallucinations, infection)
**Phase 5:** Polish, balancing, optimization

## Risk Mitigation

- **Scope Creep:** Focus on core gameplay loop first
- **Networking Complexity:** Start with simple state sync, optimize later
- **Visual Polish:** Use placeholder graphics initially
- **Performance:** Profile early, especially decay visual effects

## Success Metrics

### Phase 1 ✅ ACHIEVED
- ✅ 4-10 players can join a game and complete basic tasks
- ✅ Enhanced lobby system with real-time room management
- ✅ Strategic map design enables proper social deduction gameplay
- ✅ Task completion mechanics provide clear progression and win conditions
- ✅ Robust multiplayer foundation with comprehensive error handling

### Phase 2+ Goals
- [ ] Decay system creates visible progression and tension
- [ ] Decayers can meaningfully impact the game
- [ ] Games complete within 10-15 minutes
- [ ] Core gameplay loop is engaging and unique from Among Us
- [ ] Visual decay effects enhance atmosphere and strategic decisions