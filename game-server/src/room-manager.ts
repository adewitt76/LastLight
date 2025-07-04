import { GameRoom, Player, RoomSummary } from '@lastlight/shared-models';

export class RoomManager {
  private gameRooms = new Map<string, GameRoom>();
  private playerConnections = new Map<string, string>(); // playerId -> socketId

  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createPlayer(id: string, name: string): Player {
    return {
      id,
      name,
      position: { x: 2400, y: 1600 }, // Start in center hub
      role: 'crewmate',
      isAlive: true,
      infectionLevel: 0
    };
  }

  createGameRoom(id: string, name: string, hostPlayerId: string, maxPlayers: number): GameRoom {
    return {
      id,
      name,
      players: [],
      gameState: null,
      isStarted: false,
      maxPlayers,
      hostPlayerId
    };
  }

  resetRoom(room: GameRoom): void {
    // Reset room state
    room.isStarted = false;
    room.gameState = null;
    
    // Keep players in the room but reset their state
    room.players.forEach(player => {
      player.position = { x: 2400, y: 1600 }; // Reset to center hub
      player.role = 'crewmate';
      player.isAlive = true;
      player.infectionLevel = 0;
    });
  }

  addRoom(roomId: string, room: GameRoom): void {
    this.gameRooms.set(roomId, room);
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.gameRooms.get(roomId);
  }

  deleteRoom(roomId: string): void {
    this.gameRooms.delete(roomId);
  }

  addPlayerConnection(playerId: string, socketId: string): void {
    this.playerConnections.set(playerId, socketId);
  }

  removePlayerConnection(playerId: string): void {
    this.playerConnections.delete(playerId);
  }

  getRoomSummaries(): RoomSummary[] {
    return Array.from(this.gameRooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      status: room.isStarted ? 'playing' : 'waiting',
      isJoinable: !room.isStarted && room.players.length < room.maxPlayers
    }));
  }

  get roomCount(): number {
    return this.gameRooms.size;
  }

  get connectionCount(): number {
    return this.playerConnections.size;
  }
}