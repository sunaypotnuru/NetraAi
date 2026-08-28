/**
 * WebSocket Service Manager
 * 
 * Handles real-time communication for:
 * - Notifications
 * - Presence
 * - Messaging
 * - Video Call signaling
 */

type WebSocketCallback = (data: any) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<WebSocketCallback>> = new Map();
  private channel: string;
  private baseUrl: string;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 100;
  private reconnectInterval = 5000;

  constructor(baseUrl: string, channel: string, token: string) {
    this.baseUrl = baseUrl;
    this.channel = channel;
    this.token = token;
  }

  public connect(): Promise<WebSocketService> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.baseUrl}/${this.channel}?token=${this.token}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log(`[WebSocket] Connected to ${this.channel}`);
          this.reconnectAttempts = 0;
          this.emit('connection', { status: 'connected' });
          resolve(this);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            this.emit(type, payload);
          } catch (err) {
            console.error('[WebSocket] Failed to parse message:', err);
          }
        };

        this.socket.onclose = () => {
          console.log(`[WebSocket] Disconnected from ${this.channel}`);
          this.emit('connection', { status: 'disconnected' });
          this.handleReconnect();
        };

        this.socket.onerror = () => {
          this.emit('error', { error: 'Connection failed' });
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  public disconnect() {
    if (this.socket) {
      // Properly remove all event listeners before closing
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      // Close with proper code and reason
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'Client disconnect');
      } else {
        this.socket.close();
      }
      this.socket = null;
    }
    
    // Clear all listeners to prevent memory leaks
    this.listeners.clear();
  }

  public on(event: string, callback: WebSocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: WebSocketCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  public send(event: string, data: any) {
    if (this.isConnected()) {
      this.socket?.send(JSON.stringify({ type: event, payload: data }));
    }
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }
}

class WebSocketManager {
  private connections: Map<string, WebSocketService> = new Map();
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  public async connect(channel: string): Promise<WebSocketService> {
    if (this.connections.has(channel)) {
      const conn = this.connections.get(channel)!;
      if (conn.isConnected()) return conn;
    }

    const service = new WebSocketService(this.baseUrl, channel, this.token);
    await service.connect();
    this.connections.set(channel, service);
    return service;
  }

  public disconnect(channel: string) {
    this.connections.get(channel)?.disconnect();
    this.connections.delete(channel);
  }

  public disconnectAll() {
    this.connections.forEach((conn, channel) => {
      console.log(`[WebSocketManager] Disconnecting channel: ${channel}`);
      conn.disconnect();
    });
    this.connections.clear();
  }

  public getConnection(channel: string): WebSocketService | undefined {
    return this.connections.get(channel);
  }
}

let manager: WebSocketManager | null = null;

export const initializeWebSocketManager = (baseUrl: string, token: string) => {
  manager = new WebSocketManager(baseUrl, token);
  return manager;
};

export const getWebSocketManager = () => {
  if (!manager) {
    // Fallback for components that access it before initialization
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws') + '/ws';
    const baseUrl = import.meta.env.VITE_WS_URL || wsBaseUrl;
    const token = 'no-token'; 
    manager = new WebSocketManager(baseUrl, token);
  }
  return manager;
};
