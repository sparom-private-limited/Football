// services/SocketManager.js
import io from "socket.io-client";
import { SOCKET_BASE_URL } from "../api/env";

const SOCKET_URL = SOCKET_BASE_URL;

class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(token) {
    if (!token) {
      console.log("⛔ Socket connect skipped: token missing");
      return null;
    }

    if (this.socket?.connected) {
      console.log("✅ Socket already connected");
      return this.socket;
    }

    if (this.connecting) {
      console.log("⏳ Socket connection in progress...");
      return this.socket;
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      // 🔑 CREATE SOCKET WITH EXPLICIT TOKEN
      this.socket = io(SOCKET_URL, {
        auth: { token },
        autoConnect: false,
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        this.connected = true;
        this.connecting = false;
        this.reconnectAttempts = 0;
        console.log("✅ Socket connected:", this.socket.id);
        resolve(this.socket);
      });

      this.socket.on("connect_error", (error) => {
        console.error("🔴 Socket connect error:", error.message);
        this.connecting = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.disconnect();
          reject(error);
        }
      });

      this.socket.on("disconnect", (reason) => {
        this.connected = false;
        this.connecting = false;
        console.log("❌ Socket disconnected:", reason);
        
        // Auto-reconnect on server disconnect
        if (reason === "io server disconnect") {
          this.socket.connect();
        }
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
        this.reconnectAttempts = 0;
      });

      this.socket.on("reconnect_failed", () => {
        console.error("❌ Socket reconnection failed after max attempts");
      });

      this.socket.on("error", (error) => {
        console.error("❌ Socket error:", error);
      });

      this.socket.connect();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.listeners.clear();
    console.log("🔌 Socket fully disconnected");
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  emit(event, data) {
    if (!this.isConnected()) {
      console.warn(`⚠️ Cannot emit '${event}': Socket not connected`);
      return;
    }
    this.socket.emit(event, data);
    console.log(`📤 Emitted '${event}':`, data);
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn(`⚠️ Cannot listen to '${event}': Socket not initialized`);
      return;
    }
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  // ==================== MATCH METHODS ====================

  joinMatch(matchId) {
    this.emit("match:join", { matchId });
  }

  leaveMatch(matchId) {
    this.emit("match:leave", { matchId });
  }

  startMatch(matchId) {
    this.emit("match:start", { matchId });
  }

  endMatch(matchId) {
    this.emit("match:end", { matchId });
  }

  addGoal(matchId, teamId, playerId, minute, assistPlayerId = null, type = "GOAL") {
    this.emit("match:goal", {
      matchId,
      teamId,
      playerId,
      assistPlayerId,
      minute,
      type,
    });
  }

  addCard(matchId, teamId, playerId, minute, type) {
    this.emit("match:card", {
      matchId,
      teamId,
      playerId,
      minute,
      type,
    });
  }

  addSubstitution(matchId, teamId, playerOutId, playerInId, minute) {
    this.emit("match:substitution", {
      matchId,
      teamId,
      playerOutId,
      playerInId,
      minute,
    });
  }

  updateMatchStatus(matchId, status) {
    this.emit("match:status", { matchId, status });
  }
  // Add this method in the MATCH METHODS section
resetMatch(matchId) {
  this.emit("match:reset", { matchId });
}

  // ==================== TOURNAMENT METHODS ====================

  joinTournament(tournamentId) {
    this.emit("tournament:join", { tournamentId });
  }

  leaveTournament(tournamentId) {
    this.emit("tournament:leave", { tournamentId });
  }

  startTournament(tournamentId) {
    this.emit("tournament:start", { tournamentId });
  }

  sendTournamentAnnouncement(tournamentId, message) {
    this.emit("tournament:announcement", { tournamentId, message });
  }

}

export default new SocketManager();